import { store, FulfillmentItemRecord, OrderRecord } from './store';
import { addNotoriusOrder } from './notorius-api';
import { parseInstagramUrl } from './url-parser';

// Retry Delays in seconds (30s, 2m, 10m, 30m, 2h)
const RETRY_DELAYS_SEC = [30, 120, 600, 1800, 7200];

function calculateNextRetryTime(attemptCount: number): string {
  const index = Math.min(attemptCount - 1, RETRY_DELAYS_SEC.length - 1);
  const baseDelaySec = RETRY_DELAYS_SEC[index];
  // Add random jitter (+- 10%)
  const jitterSec = baseDelaySec * (0.9 + Math.random() * 0.2);
  return new Date(Date.now() + jitterSec * 1000).toISOString();
}

/**
 * Executes or continues the fulfillment process for an order.
 */
export async function processOrderFulfillment(orderId: string): Promise<OrderRecord | undefined> {
  const lockKey = `order_fulfillment_${orderId}`;
  if (!store.acquireLock(lockKey)) {
    return store.getOrder(orderId);
  }

  try {
    const order = store.getOrder(orderId);
    if (!order) return undefined;

    if (order.paymentStatus !== 'paid') {
      return order;
    }

    let items = store.getFulfillmentItemsByOrderId(orderId);

    // Initial setup if items don't exist yet
    if (items.length === 0) {
      items = order.packageSnapshot.items.map((itemConfig, idx) => {
        return store.createFulfillmentItem({
          id: `item_${orderId}_${idx + 1}`,
          orderId,
          metric: itemConfig.metric,
          serviceId: itemConfig.serviceId,
          quantity: itemConfig.quantity,
          isGatekeeper: itemConfig.isGatekeeper || itemConfig.metric === 'views',
          status: itemConfig.isGatekeeper ? 'pending' : 'waiting_for_compatibility',
          attemptCount: 0,
          createdAt: new Date().toISOString(),
        });
      });
      store.addEvent(orderId, 'fulfillment_items_created', `Criados ${items.length} itens de fulfillment locais.`);
    }

    const gatekeeperItem = items.find((i) => i.isGatekeeper);
    const nonGatekeeperItems = items.filter((i) => !i.isGatekeeper);

    // -------------------------------------------------------------
    // PHASE 1: Compatibility Gatekeeper Processing (Visualizações)
    // -------------------------------------------------------------
    if (gatekeeperItem && ['pending', 'waiting_for_compatibility'].includes(gatekeeperItem.status)) {
      store.updateOrder(orderId, { fulfillmentStatus: 'validating_content_compatibility' });
      store.addEvent(orderId, 'gatekeeper_started', 'Iniciando validação de compatibilidade via portão de visualizações.');

      if (!gatekeeperItem.serviceId) {
        store.updateFulfillmentItem(gatekeeperItem.id, {
          status: 'failed',
          lastError: 'Service ID não cadastrado no sistema para esta métrica.',
        });
        store.updateOrder(orderId, { fulfillmentStatus: 'awaiting_review' });
        store.addEvent(orderId, 'gatekeeper_failed_no_service', 'Service ID pendente de cadastro administrativo.');
        return store.getOrder(orderId);
      }

      store.updateFulfillmentItem(gatekeeperItem.id, {
        status: 'submitting',
        attemptCount: gatekeeperItem.attemptCount + 1,
      });

      const result = await addNotoriusOrder({
        serviceId: gatekeeperItem.serviceId,
        link: order.postUrlCanonical,
        quantity: gatekeeperItem.quantity,
      });

      if (result.status === 'success') {
        store.updateFulfillmentItem(gatekeeperItem.id, {
          status: 'submitted',
          providerOrderId: result.providerOrderId,
          submittedAt: new Date().toISOString(),
        });
        store.addEvent(
          orderId,
          'gatekeeper_success',
          `Gatekeeper aceito! Order #${result.providerOrderId} criado no Notorius para Visualizações.`
        );

        // Unlock non-gatekeeper items to pending
        nonGatekeeperItems.forEach((item) => {
          if (item.status === 'waiting_for_compatibility') {
            store.updateFulfillmentItem(item.id, { status: 'pending' });
          }
        });
      } else if (result.status === 'error') {
        if (result.errorType === 'definitive') {
          // Format Incompatibility (e.g. invalid_post_type_for_service)
          store.updateFulfillmentItem(gatekeeperItem.id, {
            status: 'blocked_incompatible_content',
            lastError: result.errorMessage,
          });
          store.updateOrder(orderId, { fulfillmentStatus: 'awaiting_review' });
          store.addEvent(
            orderId,
            'gatekeeper_incompatible',
            'Publicação incompatível identificada. Retido para análise administrativa (Invariante: 1 Pacote = 1 URL Imutável).'
          );
          return store.getOrder(orderId); // Stop fulfillment for admin review!
        } else if (result.errorType === 'transient') {
          const nextRetry = calculateNextRetryTime(gatekeeperItem.attemptCount + 1);
          store.updateFulfillmentItem(gatekeeperItem.id, {
            status: 'retry_scheduled',
            lastError: result.errorMessage,
            nextRetryAt: nextRetry,
          });
          store.updateOrder(orderId, { fulfillmentStatus: 'partially_submitted' });
          store.addEvent(
            orderId,
            'gatekeeper_transient_error',
            `Falha temporária no Notorius: ${result.errorMessage}. Tentativa agendada.`
          );
          return store.getOrder(orderId);
        } else {
          // Ambiguous
          store.updateFulfillmentItem(gatekeeperItem.id, {
            status: 'submission_unknown',
            lastError: result.errorMessage,
          });
          store.updateOrder(orderId, { fulfillmentStatus: 'awaiting_review' });
          store.addEvent(
            orderId,
            'gatekeeper_ambiguous_error',
            'Timeout ambíguo após envio. Retido para revisão manual para evitar duplicidade.'
          );
          return store.getOrder(orderId);
        }
      }
    }

    // -------------------------------------------------------------
    // PHASE 2: Non-Gatekeeper Items Processing (Curtidas, Salvamentos, Compartilhamentos)
    // -------------------------------------------------------------
    const activeItems = store.getFulfillmentItemsByOrderId(orderId);
    const pendingNonGatekeepers = activeItems.filter(
      (i) => !i.isGatekeeper && i.status === 'pending'
    );

    if (pendingNonGatekeepers.length > 0) {
      store.updateOrder(orderId, { fulfillmentStatus: 'in_progress' });

      for (const item of pendingNonGatekeepers) {
        if (!item.serviceId) {
          store.updateFulfillmentItem(item.id, {
            status: 'failed',
            lastError: 'Service ID não cadastrado.',
          });
          continue;
        }

        store.updateFulfillmentItem(item.id, {
          status: 'submitting',
          attemptCount: item.attemptCount + 1,
        });

        const res = await addNotoriusOrder({
          serviceId: item.serviceId,
          link: order.postUrlCanonical,
          quantity: item.quantity,
        });

        if (res.status === 'success') {
          store.updateFulfillmentItem(item.id, {
            status: 'submitted',
            providerOrderId: res.providerOrderId,
            submittedAt: new Date().toISOString(),
          });
          store.addEvent(
            orderId,
            'item_submitted',
            `Subserviço ${item.metric} enviado com sucesso (#${res.providerOrderId}).`
          );
        } else if (res.status === 'error') {
          if (res.errorType === 'transient') {
            const nextRetry = calculateNextRetryTime(item.attemptCount + 1);
            store.updateFulfillmentItem(item.id, {
              status: 'retry_scheduled',
              lastError: res.errorMessage,
              nextRetryAt: nextRetry,
            });
            store.addEvent(
              orderId,
              'item_retry_scheduled',
              `Erro temporário no subserviço ${item.metric}. Agendado para ${nextRetry}.`
            );
          } else if (res.errorType === 'ambiguous') {
            store.updateFulfillmentItem(item.id, {
              status: 'submission_unknown',
              lastError: res.errorMessage,
            });
            store.addEvent(
              orderId,
              'item_ambiguous_error',
              `Timeout ambíguo no subserviço ${item.metric}. Retido para análise.`
            );
          } else {
            store.updateFulfillmentItem(item.id, {
              status: 'failed',
              lastError: res.errorMessage,
            });
            store.addEvent(
              orderId,
              'item_failed',
              `Erro definitivo no subserviço ${item.metric}: ${res.errorMessage}`
            );
          }
        }
      }
    }

    // Consolidated Order Status Computation
    const finalItems = store.getFulfillmentItemsByOrderId(orderId);
    const statuses = finalItems.map((i) => i.status);

    if (statuses.every((s) => s === 'submitted' || s === 'completed')) {
      store.updateOrder(orderId, { fulfillmentStatus: 'in_progress' });
    } else if (statuses.some((s) => s === 'submission_unknown')) {
      store.updateOrder(orderId, { fulfillmentStatus: 'awaiting_review' });
    } else if (statuses.some((s) => s === 'blocked_incompatible_content')) {
      store.updateOrder(orderId, { fulfillmentStatus: 'awaiting_review' });
    } else if (statuses.some((s) => s === 'retry_scheduled')) {
      store.updateOrder(orderId, { fulfillmentStatus: 'partially_submitted' });
    } else if (statuses.some((s) => s === 'failed')) {
      store.updateOrder(orderId, { fulfillmentStatus: 'partially_failed' });
    }

    return store.getOrder(orderId);
  } finally {
    store.releaseLock(lockKey);
  }
}

/**
 * Enforces URL Immutability (1 Package = 1 URL).
 */
export async function updateOrderUrlAndRestartGate(
  orderId: string,
  _newUrl: string
): Promise<{ success: boolean; message: string; order?: OrderRecord }> {
  return { 
    success: false, 
    message: 'A URL do pedido é imutável (Regra de Negócio: 1 Pacote = 1 URL). Para impulsionar outra publicação, faça um novo pedido.' 
  };
}

/**
 * Rescues a late paid Pix webhook on an expired payment/order.
 */
export async function handleLateWebhookPayment(
  providerPaymentId: string,
  valueCents: number
): Promise<{ success: boolean; message: string }> {
  const payment = store.getPaymentByProviderId(providerPaymentId);
  if (!payment) {
    return { success: false, message: 'Cobrança Pix não encontrada.' };
  }

  const order = store.getOrder(payment.orderId);
  if (!order) {
    return { success: false, message: 'Pedido não encontrado.' };
  }

  if (order.paymentStatus === 'paid') {
    // Registered duplicate payment silently in admin logs while keeping customer status untouched
    store.addEvent(
      order.id,
      'duplicate_payment_review',
      `ALERTA SILENCIOSO [ADMIN]: Pagamento Pix em duplicidade recebido para o mesmo pedido (R$${(valueCents / 100).toFixed(2)}). Requer revisão no painel.`
    );
    return { success: true, message: 'Pagamento em duplicidade registrado silenciosamente para revisão no painel administrativo.' };
  }

  if (valueCents !== order.amountCents) {
    store.updateOrder(order.id, { paymentStatus: 'manual_review' });
    store.addEvent(
      order.id,
      'payment_mismatch_error',
      `Divergência de valor pago: Esperado R$${(order.amountCents / 100).toFixed(2)}, Recebido R$${(valueCents / 100).toFixed(2)}.`
    );
    return { success: false, message: 'Divergência de valor no pagamento.' };
  }

  // Handle late payment on expired payment
  store.updatePayment(payment.id, {
    status: 'paid',
    paidAfterExpiration: payment.status === 'expired',
    paidAt: new Date().toISOString(),
  });

  store.updateOrder(order.id, { paymentStatus: 'paid' });
  store.addEvent(
    order.id,
    'payment_confirmed',
    payment.status === 'expired'
      ? 'Pagamento Pix confirmado após janela de expiração (paid_after_expiration = true).'
      : 'Pagamento Pix confirmado com sucesso.'
  );

  await processOrderFulfillment(order.id);
  return { success: true, message: 'Pagamento processado com sucesso.' };
}
