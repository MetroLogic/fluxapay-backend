import { createHmac } from 'crypto';
import { prisma } from '../db/prisma';
import { logger } from '../utils/logger';

export interface WebhookEventPayload {
  event: 'charge.created' | 'charge.confirmed' | 'charge.failed' | 'charge.settled';
  data: Record<string, unknown>;
  timestamp: string;
}

export class WebhookService {
  /**
   * Generates SHA-256 HMAC signature for webhook payload
   */
  public generateSignature(payload: string, secret: string): string {
    return createHmac('sha256', secret).update(payload).digest('hex');
  }

  /**
   * Dispatches webhook event to all subscribed endpoints for a merchant
   */
  public async dispatchEvent(merchantId: string, event: WebhookEventPayload['event'], data: Record<string, unknown>): Promise<void> {
    try {
      const webhooks = await prisma.webhook.findMany({
        where: { merchantId, isActive: true },
      });

      if (!webhooks.length) {
        return;
      }

      const payload: WebhookEventPayload = {
        event,
        data,
        timestamp: new Date().toISOString(),
      };

      const payloadString = JSON.stringify(payload);

      for (const hook of webhooks) {
        if (hook.events.length > 0 && !hook.events.includes(event) && !hook.events.includes('*')) {
          continue;
        }

        const signature = this.generateSignature(payloadString, hook.secret);

        try {
          const response = await fetch(hook.url, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'x-fluxapay-signature': signature,
              'User-Agent': 'FluxaPay-Webhook-Dispatcher/1.0',
            },
            body: payloadString,
          });

          await prisma.webhookDelivery.create({
            data: {
              webhookId: hook.id,
              event,
              payload: payload as unknown as object,
              statusCode: response.status,
              status: response.ok ? 'SUCCESS' : 'FAILED',
            },
          });
        } catch (deliveryError) {
          logger.warn(`Failed to deliver webhook to ${hook.url}:`, deliveryError);
          await prisma.webhookDelivery.create({
            data: {
              webhookId: hook.id,
              event,
              payload: payload as unknown as object,
              statusCode: 500,
              status: 'FAILED',
              responseBody: deliveryError instanceof Error ? deliveryError.message : 'Network error',
            },
          });
        }
      }
    } catch (error) {
      logger.error('Error dispatching webhook events:', error);
    }
  }
}

export const webhookService = new WebhookService();
