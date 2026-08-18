import {
  store,
  FulfillmentItemRecord,
  OrderRecord,
  PaymentProvider,
} from './store';
import { addNotoriusOrder, getNotoriusBalance } from './notorius-api';
import {
  sendEmergencyAlertEmail,
  sendSaleNotificationEmail,
  sendLowBalanceAlertEmail,
} from './email-notifier';

const MAX_RETRY_ATTEMPTS = 3;
const RETRY_DELAYS_SEC = [30, 120, 600];
const LOW_BALANCE_THRESHOLD_USD = 5;
const COOLDOWN_MS = 6 * 60 * 60 * 1000;

export interface PaymentProcessingResult {
  success: boolean;
  retryable: boolean;
  requiresManualReview?: boolean;
  code:
    | 'processed'
    | 'already_processed'
    | 'duplicate_payment'
    | 'payment_not_found'
    | 'order_not_found'
    | 'amount_mismatch';
  message: string;
  orderId?: string;
}

export async function checkAndAlertNotoriusBalance(): Promise<{
  checked: boolean;
  balanceUSD?: number;
  alertSent: boolean;
  message: string;
}> {
  const result = await getNotoriusBalance();
  if (!result.success || result.balanceUSD === undefined) {
    return {
      checked: false,
      alertSent: false,
      message: `Erro ao consultar saldo: ${result.errorMessage || 'Falha na resposta'}`,
    };
  }

  const currentBalance = result.balanceUSD;
  const now = Date.now();
  const { lastAlertAt, lastLevel } = store.getLastBalanceAlertState();
  const lastAlertTime = lastAlertAt ? new Date(lastAlertAt).getTime() : 0;
  const isCooldownActive = now - lastAlertTime < COOLDOWN_MS;

  let currentLevel: 'normal' | 'warning' | 'critical' = 'normal';
  if (currentBalance <= 0) currentLevel = 'critical';
  else if (currentBalance < LOW_BALANCE_THRESHOLD_USD) currentLevel = 'warning';

  if (currentLevel === 'normal') {
    if (lastLevel !== 'normal') store.updateBalanceAlertState('normal');
    return {
      checked: true,
      balanceUSD: currentBalance,
      alertSent: false,
      message: `Saldo regular: $${currentBalance.toFixed(2)} USD.`,
    };
  }

  const shouldBypassCooldown = currentLevel === 'critical' && lastLevel !== 'critical';
  if (isCooldownActive && !shouldBypassCooldown) {
    return {
      checked: true,
      balanceUSD: currentBalance,
      alertSent: false,
      message: `Saldo baixo ($${currentBalance.toFixed(2)} USD), com alerta em cooldown.`,
    };
  }

  const sent = await sendLowBalanceAlertEmail({
    balanceUSD: currentBalance,
    thresholdUSD: LOW_BALANCE_THRESHOLD_USD,
    level: currentLevel,
    checkedAt: new Date().toISOString(),
  });
  if (sent) store.updateBalanceAlertState(currentLevel);

  return {
    checked: true,
    balanceUSD: currentBalance,
    alertSent: sent,
    message: `Alerta de saldo ${currentLevel} processado.`,
  };
}

function calculateNextRetryTime(attemptCount: number): string {
  const index = Math.min(attemptCount - 1, RETRY_DELAYS_SEC.length - 1);
  const baseDelaySec = RETRY_DELAYS_SEC[index];
  const jitterSec = baseDelaySec * (0.9 + Math.random() * 0.2);
  return new Date(Date.now() + jitterSec * 1000).toISOString();
}

function isReadyForSubmission(item: FulfillmentItemRecord, now = Date.now()): boolean {
  if (item.status === 'pending' || item.status === 'waiting_for_compatibility') return true;
  return (
    item.status === 'retry_scheduled' &&
    Boolean(item.nextRetryAt) &&
    new Date(item.nextRetryAt as string).getTime() <= now
  );
}

async function alertFulfillmentFailure(
  order: OrderRecord,
  item: FulfillmentItemRecord,
  errorMessage: string
): Promise<void> {
  await sendEmergencyAlertEmail({
    orderId: order.id,
    customerEmail: order.customerEmail,
    postUrl: order.postUrlCanonical,
    packageSlug: order.packageSlug,
    metric: item.metric,
    attemptCount: item.attemptCount,
    errorMessage,
  });
}

async function createInitialItems(order: OrderRecord): Promise<FulfillmentItemRecord[]> {
  const items: FulfillmentItemRecord[] = [];
  for (const [index, config] of order.packageSnapshot.items.entries()) {
    const item = await store.createFulfillmentItem({
      id: `item_${order.id}_${index + 1}`,
      orderId: order.id,
      metric: config.metric,
      serviceId: config.serviceId,
      quantity: config.quantity,
      isGatekeeper: config.isGatekeeper || config.metric === 'views',
      status:
        config.isGatekeeper || config.metric === 'views'
          ? 'pending'
          : 'waiting_for_compatibility',
      attemptCount: 0,
      createdAt: new Date().toISOString(),
    });
    items.push(item);
  }
  return items;
}

async function processGatekeeper(
  order: OrderRecord,
  item: FulfillmentItemRecord,
  nonGatekeeperItems: FulfillmentItemRecord[]
): Promise<boolean> {
  const claimed = await store.tryClaimFulfillmentItem(item);
  if (!claimed) return false;

  await store.updateOrder(order.id, {
    fulfillmentStatus: 'validating_content_compatibility',
  });
  await store.addEvent(
    order.id,
    'gatekeeper_started',
    `Tentativa ${claimed.attemptCount}/${MAX_RETRY_ATTEMPTS} de validação por visualizações.`
  );

  if (!claimed.serviceId) {
    await store.updateFulfillmentItem(claimed.id, {
      status: 'failed',
      lastError: 'Service ID não cadastrado no sistema para esta métrica.',
    });
    await store.updateOrder(order.id, { fulfillmentStatus: 'awaiting_review' });
    await store.addEvent(
      order.id,
      'gatekeeper_failed_no_service',
      'Service ID pendente de cadastro administrativo.'
    );
    await alertFulfillmentFailure(order, claimed, 'Service ID não cadastrado.');
    return false;
  }

  const result = await addNotoriusOrder({
    serviceId: claimed.serviceId,
    link: order.postUrlCanonical,
    quantity: claimed.quantity,
  });

  if (result.status === 'success') {
    await store.updateFulfillmentItem(claimed.id, {
      status: 'submitted',
      providerOrderId: result.providerOrderId,
      submittedAt: new Date().toISOString(),
      lastError: undefined,
      nextRetryAt: undefined,
    });
    await store.addEvent(
      order.id,
      'gatekeeper_success',
      `Pedido #${result.providerOrderId} criado no Notorious para visualizações.`
    );
    for (const dependentItem of nonGatekeeperItems) {
      if (dependentItem.status === 'waiting_for_compatibility') {
        await store.updateFulfillmentItem(dependentItem.id, { status: 'pending' });
      }
    }
    return true;
  }

  const reachedLimit = claimed.attemptCount >= MAX_RETRY_ATTEMPTS;
  if (result.errorType === 'transient' && !reachedLimit) {
    const nextRetryAt = calculateNextRetryTime(claimed.attemptCount);
    await store.updateFulfillmentItem(claimed.id, {
      status: 'retry_scheduled',
      lastError: result.errorMessage,
      nextRetryAt,
    });
    await store.updateOrder(order.id, { fulfillmentStatus: 'partially_submitted' });
    await store.addEvent(
      order.id,
      'gatekeeper_retry_scheduled',
      `Falha temporária no Notorious. Nova tentativa agendada para ${nextRetryAt}.`
    );
    return false;
  }

  const status = result.errorType === 'ambiguous' ? 'submission_unknown' :
    result.errorType === 'definitive' && !reachedLimit ? 'blocked_incompatible_content' : 'failed';
  await store.updateFulfillmentItem(claimed.id, {
    status,
    lastError: result.errorMessage,
  });
  await store.updateOrder(order.id, { fulfillmentStatus: 'awaiting_review' });
  await store.addEvent(
    order.id,
    'gatekeeper_failed',
    `Falha no gatekeeper: ${result.errorMessage}`
  );
  await alertFulfillmentFailure(order, claimed, result.errorMessage);
  return false;
}

async function processNonGatekeeper(
  order: OrderRecord,
  item: FulfillmentItemRecord
): Promise<void> {
  const claimed = await store.tryClaimFulfillmentItem(item);
  if (!claimed) return;

  if (!claimed.serviceId) {
    await store.updateFulfillmentItem(claimed.id, {
      status: 'failed',
      lastError: 'Service ID não cadastrado.',
    });
    await store.addEvent(
      order.id,
      'item_failed_no_service',
      `Service ID ausente para ${claimed.metric}.`
    );
    return;
  }

  const result = await addNotoriusOrder({
    serviceId: claimed.serviceId,
    link: order.postUrlCanonical,
    quantity: claimed.quantity,
  });

  if (result.status === 'success') {
    await store.updateFulfillmentItem(claimed.id, {
      status: 'submitted',
      providerOrderId: result.providerOrderId,
      submittedAt: new Date().toISOString(),
      lastError: undefined,
      nextRetryAt: undefined,
    });
    await store.addEvent(
      order.id,
      'item_submitted',
      `Subserviço ${claimed.metric} enviado com sucesso (#${result.providerOrderId}).`
    );
    return;
  }

  const reachedLimit = claimed.attemptCount >= MAX_RETRY_ATTEMPTS;
  if (result.errorType === 'transient' && !reachedLimit) {
    const nextRetryAt = calculateNextRetryTime(claimed.attemptCount);
    await store.updateFulfillmentItem(claimed.id, {
      status: 'retry_scheduled',
      lastError: result.errorMessage,
      nextRetryAt,
    });
    await store.addEvent(
      order.id,
      'item_retry_scheduled',
      `Retry de ${claimed.metric} agendado para ${nextRetryAt}.`
    );
    return;
  }

  const status = result.errorType === 'ambiguous' ? 'submission_unknown' : 'failed';
  await store.updateFulfillmentItem(claimed.id, {
    status,
    lastError: result.errorMessage,
  });
  await store.addEvent(
    order.id,
    'item_failed_emergency',
    `Falha no subserviço ${claimed.metric}: ${result.errorMessage}`
  );
  await alertFulfillmentFailure(order, claimed, result.errorMessage);
}

async function updateConsolidatedStatus(orderId: string): Promise<void> {
  const items = await store.getFulfillmentItemsByOrderIdAsync(orderId);
  const statuses = items.map((item) => item.status);
  if (statuses.length === 0) return;

  if (statuses.every((status) => status === 'submitted' || status === 'completed')) {
    await store.updateOrder(orderId, { fulfillmentStatus: 'in_progress' });
  } else if (
    statuses.some(
      (status) => status === 'submission_unknown' || status === 'blocked_incompatible_content'
    )
  ) {
    await store.updateOrder(orderId, { fulfillmentStatus: 'awaiting_review' });
  } else if (statuses.some((status) => status === 'retry_scheduled')) {
    await store.updateOrder(orderId, { fulfillmentStatus: 'partially_submitted' });
  } else if (statuses.some((status) => status === 'failed')) {
    await store.updateOrder(orderId, { fulfillmentStatus: 'partially_failed' });
  }
}

/** Executes or safely resumes fulfillment with distributed item claims. */
export async function processOrderFulfillment(orderId: string): Promise<OrderRecord | undefined> {
  const lockKey = `order_fulfillment_${orderId}`;
  if (!store.acquireLock(lockKey)) return store.getOrderAsync(orderId);

  try {
    let order = await store.getOrderAsync(orderId);
    if (!order || order.paymentStatus !== 'paid') return order;

    let items = await store.getFulfillmentItemsByOrderIdAsync(orderId);
    if (order.fulfillmentStatus === 'pending') {
      if (items.length === 0) items = await createInitialItems(order);
      const claimedOrder = await store.tryClaimOrderFulfillment(orderId);
      if (!claimedOrder) return store.getOrderAsync(orderId);
      order = claimedOrder;
      await store.addEvent(
        order.id,
        'fulfillment_items_created',
        `Criados ${items.length} itens de fulfillment persistentes.`
      );
    } else if (items.length === 0) {
      await store.updateOrder(orderId, { fulfillmentStatus: 'awaiting_review' });
      await store.addEvent(
        orderId,
        'fulfillment_missing_items',
        'Pedido reservado sem itens de fulfillment; encaminhado para revisão segura.'
      );
      return store.getOrderAsync(orderId);
    }

    const gatekeeper = items.find((item) => item.isGatekeeper);
    const nonGatekeepers = items.filter((item) => !item.isGatekeeper);

    if (gatekeeper && isReadyForSubmission(gatekeeper)) {
      const passed = await processGatekeeper(order, gatekeeper, nonGatekeepers);
      if (!passed) {
        await updateConsolidatedStatus(orderId);
        return store.getOrderAsync(orderId);
      }
    }

    const currentItems = await store.getFulfillmentItemsByOrderIdAsync(orderId);
    const currentGatekeeper = currentItems.find((item) => item.isGatekeeper);
    const gatekeeperPassed =
      !currentGatekeeper ||
      currentGatekeeper.status === 'submitted' ||
      currentGatekeeper.status === 'completed';

    if (gatekeeperPassed) {
      await store.updateOrder(orderId, { fulfillmentStatus: 'in_progress' });
      for (const item of currentItems.filter(
        (candidate) => !candidate.isGatekeeper && isReadyForSubmission(candidate)
      )) {
        await processNonGatekeeper(order, item);
      }
    }

    await updateConsolidatedStatus(orderId);
    try {
      await checkAndAlertNotoriusBalance();
    } catch (error) {
      console.error('[POST-FULFILLMENT BALANCE CHECK ERROR]:', error);
    }
    return store.getOrderAsync(orderId);
  } finally {
    store.releaseLock(lockKey);
  }
}

export async function processDueFulfillmentRetries(): Promise<{
  orderIds: string[];
  processed: number;
}> {
  const orderIds = await store.listOrderIdsWithDueRetriesAsync();
  let processed = 0;
  for (const orderId of orderIds) {
    await processOrderFulfillment(orderId);
    processed += 1;
  }
  return { orderIds, processed };
}

export async function updateOrderUrlAndRestartGate(
  orderId: string,
  _newUrl: string
): Promise<{ success: boolean; message: string; order?: OrderRecord }> {
  void orderId;
  void _newUrl;
  return {
    success: false,
    message:
      'A URL do pedido é imutável (1 pacote = 1 URL). Para outra publicação, faça um novo pedido.',
  };
}

export async function handleLateWebhookPayment(
  provider: PaymentProvider,
  providerPaymentId: string,
  valueCents: number,
  providerPaidAt?: string
): Promise<PaymentProcessingResult> {
  const payment = await store.getPaymentByProviderIdAsync(providerPaymentId, provider);
  if (!payment) {
    return {
      success: false,
      retryable: true,
      code: 'payment_not_found',
      message: 'Cobrança Pix ainda não encontrada no banco de dados.',
    };
  }

  const order = await store.getOrderAsync(payment.orderId);
  if (!order) {
    return {
      success: false,
      retryable: true,
      code: 'order_not_found',
      message: 'Pedido relacionado ao pagamento não foi encontrado.',
    };
  }

  if (valueCents !== order.amountCents || valueCents !== payment.amountCents) {
    await store.updateOrder(order.id, { paymentStatus: 'manual_review' });
    if (payment.status !== 'failed') {
      await store.updatePayment(payment.id, { status: 'failed' });
      await store.addEvent(
        order.id,
        'payment_mismatch_error',
        `Valor esperado: ${order.amountCents} centavos; recebido: ${valueCents} centavos.`,
        { provider, providerPaymentId }
      );
    }
    return {
      success: false,
      retryable: false,
      requiresManualReview: true,
      code: 'amount_mismatch',
      message: 'Pagamento recebido com divergência de valor e enviado para revisão manual.',
      orderId: order.id,
    };
  }

  const paidAt = providerPaidAt || new Date().toISOString();
  const paymentTransition = await store.tryMarkPaymentPaid(payment, paidAt);
  const allPayments = await store.getPaymentsByOrderIdAsync(order.id);
  const anotherPaidPayment = allPayments.find(
    (candidate) => candidate.id !== payment.id && candidate.status === 'paid'
  );

  if (anotherPaidPayment) {
    if (paymentTransition) {
      await store.addEvent(
        order.id,
        'duplicate_payment_review',
        'Pagamento adicional recebido para pedido já pago.',
        { provider, stage: 'payment_confirmation', code: 'duplicate_payment' }
      );
    }
    return {
      success: true,
      retryable: false,
      requiresManualReview: true,
      code: 'duplicate_payment',
      message: 'Pagamento adicional registrado para revisão; fulfillment não foi duplicado.',
      orderId: order.id,
    };
  }

  const orderTransition = await store.tryMarkOrderPaid(order.id);

  if (orderTransition) {
    await store.addEvent(
      order.id,
      'payment_confirmed',
      payment.status === 'expired'
        ? 'Pagamento confirmado após a expiração.'
        : 'Pagamento confirmado com sucesso.',
      { provider, providerPaymentId, paidAt }
    );

    const emailSent = await sendSaleNotificationEmail({
      orderId: order.id,
      customerEmail: order.customerEmail,
      customerPhone: order.customerPhone,
      packageName: order.packageSnapshot.name,
      amountCents: order.amountCents,
      postUrl: order.postUrlCanonical,
      paidAt,
    });
    if (!emailSent) {
      await store.addEvent(
        order.id,
        'sale_notification_failed',
        'Pagamento confirmado, mas o e-mail administrativo não foi enviado.'
      );
    }
  }

  await processOrderFulfillment(order.id);
  return {
    success: true,
    retryable: false,
    code: orderTransition ? 'processed' : 'already_processed',
    message: orderTransition
      ? 'Pagamento confirmado e fulfillment processado.'
      : 'Notificação já processada; fulfillment verificado de forma idempotente.',
    orderId: order.id,
  };
}
