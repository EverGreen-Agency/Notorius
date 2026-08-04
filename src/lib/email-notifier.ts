/**
 * Emergency Email Notifier Module
 * Dispatches administrative alerts when an order fulfillment fails after max retries.
 */

export interface EmergencyAlertParams {
  orderId: string;
  customerEmail: string;
  postUrl: string;
  packageSlug: string;
  metric: string;
  attemptCount: number;
  errorMessage: string;
}

export async function sendEmergencyAlertEmail(params: EmergencyAlertParams): Promise<boolean> {
  const adminEmail = process.env.ADMIN_ALERT_EMAIL || 'admin@notorios.com.br';
  const resendApiKey = process.env.RESEND_API_KEY;

  const subject = `🚨 [ALERTA CRÍTICO NOTORIUS] Falha no Fulfillment do Pedido #${params.orderId}`;
  const htmlBody = `
    <div style="font-family: Arial, sans-serif; padding: 20px; background-color: #05070d; color: #f7f4ec;">
      <h2 style="color: #e6626a;">🚨 Alerta de Intervenção Manual Necessária</h2>
      <p>O pedido <strong>#${params.orderId}</strong> excedeu o limite máximo de <strong>${params.attemptCount} tentativas</strong> de re-envio automático para o provedor Notorius SMM.</p>
      
      <hr style="border-color: #ddbc83; margin: 20px 0;" />

      <h3>Detalhes do Pedido:</h3>
      <ul>
        <li><strong>ID do Pedido:</strong> ${params.orderId}</li>
        <li><strong>E-mail do Cliente:</strong> ${params.customerEmail}</li>
        <li><strong>Pacote:</strong> ${params.packageSlug}</li>
        <li><strong>Métrica com Falha:</strong> ${params.metric}</li>
        <li><strong>URL do Post:</strong> <a style="color: #2f7bff;" href="${params.postUrl}">${params.postUrl}</a></li>
        <li><strong>Última Erro:</strong> <code style="color: #ddbc83;">${params.errorMessage}</code></li>
      </ul>

      <hr style="border-color: #ddbc83; margin: 20px 0;" />

      <p style="font-size: 12px; color: #9bc2ff;">
        Por favor, acesse o painel administrativo em <code>/admin/orders</code> para realizar o re-envio manual ou contatar o cliente.
      </p>
    </div>
  `;

  // If Resend API Key is configured, attempt real email dispatch via Resend API
  if (resendApiKey) {
    try {
      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${resendApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev',
          to: [adminEmail],
          subject,
          html: htmlBody,
        }),
      });

      if (!response.ok) {
        const errText = await response.text();
        console.error(`[EMERGENCY EMAIL FAILED]: Resend API error (${response.status}): ${errText}`);
        return false;
      }

      console.log(`[EMERGENCY EMAIL SENT]: Alert successfully sent to ${adminEmail} for order #${params.orderId}`);
      return true;
    } catch (err) {
      console.error('[EMERGENCY EMAIL ERROR]:', err);
      return false;
    }
  }

  // Fallback to structured console alert if email service is not configured in local environment
  console.warn(`
================================================================================
🚨 [ALERTA DE EMERGÊNCIA - EMAIL SIMULADO]
Para: ${adminEmail}
Assunto: ${subject}
Pedido: #${params.orderId} (${params.customerEmail})
Tentativas: ${params.attemptCount}/3
Métrica: ${params.metric}
Erro: ${params.errorMessage}
URL: ${params.postUrl}
================================================================================
  `);

  return true;
}

export interface SaleNotificationParams {
  orderId: string;
  customerEmail: string;
  customerPhone?: string;
  packageName: string;
  amountCents: number;
  postUrl: string;
  paidAt: string;
}

export async function sendSaleNotificationEmail(params: SaleNotificationParams): Promise<boolean> {
  const adminEmail = process.env.ADMIN_ALERT_EMAIL || 'admin@notorios.com.br';
  const resendApiKey = process.env.RESEND_API_KEY;

  const formattedAmount = (params.amountCents / 100).toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  });
  const subject = `🎉 [NOVA VENDA NOTORIUS] ${formattedAmount} - Pedido #${params.orderId}`;
  const htmlBody = `
    <div style="font-family: Arial, sans-serif; padding: 24px; background-color: #05070d; color: #f7f4ec; border-radius: 12px; border: 1px solid rgba(221, 188, 131, 0.3);">
      <h2 style="color: #49b887; margin-top: 0;">🎉 Nova Venda Confirmada via Pix!</h2>
      <p style="font-size: 16px; color: #f4e4c1;">Parabéns! Uma nova venda no valor de <strong>${formattedAmount}</strong> foi paga com sucesso.</p>
      
      <hr style="border-color: rgba(221, 188, 131, 0.2); margin: 20px 0;" />

      <h3 style="color: #ddbc83;">Resumo da Transação:</h3>
      <ul style="line-height: 1.8;">
        <li><strong>ID do Pedido:</strong> <code>#${params.orderId}</code></li>
        <li><strong>Pacote Adquirido:</strong> ${params.packageName}</li>
        <li><strong>Valor Recebido:</strong> <span style="color: #49b887; font-weight: bold;">${formattedAmount}</span></li>
        <li><strong>Cliente:</strong> ${params.customerEmail} ${params.customerPhone ? `(${params.customerPhone})` : ''}</li>
        <li><strong>URL da Publicação:</strong> <a style="color: #2f7bff;" href="${params.postUrl}" target="_blank">${params.postUrl}</a></li>
        <li><strong>Data/Hora do Pagamento:</strong> ${new Date(params.paidAt).toLocaleString('pt-BR')}</li>
      </ul>

      <hr style="border-color: rgba(221, 188, 131, 0.2); margin: 20px 0;" />

      <p style="font-size: 12px; color: #9bc2ff;">
        O fulfillment automático com a API Notorius já foi iniciado para este pedido. Acompanhe no painel em <code>/admin/orders</code>.
      </p>
    </div>
  `;

  if (resendApiKey) {
    try {
      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${resendApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev',
          to: [adminEmail],
          subject,
          html: htmlBody,
        }),
      });

      if (!response.ok) {
        const errText = await response.text();
        console.error(`[SALE EMAIL FAILED]: Resend API error (${response.status}): ${errText}`);
        return false;
      }

      console.log(`[SALE EMAIL SENT]: Sale notification sent to ${adminEmail} for order #${params.orderId}`);
      return true;
    } catch (err) {
      console.error('[SALE EMAIL ERROR]:', err);
      return false;
    }
  }

  console.log(`
================================================================================
🎉 [NOTIFICAÇÃO DE VENDA - EMAIL SIMULADO]
Para: ${adminEmail}
Assunto: ${subject}
Valor: ${formattedAmount}
Cliente: ${params.customerEmail}
Pacote: ${params.packageName}
URL: ${params.postUrl}
================================================================================
  `);

  return true;
}
