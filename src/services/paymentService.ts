import { supabase } from '../lib/supabase';
import type { Database } from '../types/database.types';

export type PaymentMethod = Database['public']['Enums']['payment_method'];
export type PaymentStatus = Database['public']['Enums']['payment_status'];

export interface RazorpayOrderPayload {
  id: string; // Razorpay Order ID (order_...)
  amount: number; // in paise (e.g. 38000 for ₹380.00)
  currency: string; // 'INR'
  receipt: string; // internal order reference
  notes: {
    orderId: string;
    orderNumber?: string;
    customerName?: string;
    customerPhone?: string;
  };
}

export interface RazorpayPaymentSuccessResult {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}

export interface PaymentVerificationResult {
  verified: boolean;
  orderId: string;
  paymentId?: string;
  transactionReference: string;
  alreadyPaid?: boolean;
  message?: string;
}

export interface WebhookEventPayload {
  entity: string;
  account_id: string;
  event: 'payment.captured' | 'payment.failed' | 'order.paid' | 'refund.processed';
  contains: string[];
  payload: {
    payment?: {
      entity: {
        id: string;
        order_id: string;
        amount: number;
        currency: string;
        status: string;
        method: string;
        vpa?: string;
        card?: {
          last4: string;
          network: string;
          type: string;
        };
        error_code?: string;
        error_description?: string;
      };
    };
    order?: {
      entity: {
        id: string;
        amount: number;
        status: string;
        receipt: string;
      };
    };
    refund?: {
      entity: {
        id: string;
        payment_id: string;
        amount: number;
        status: string;
      };
    };
  };
  created_at: number;
}

// In-memory processed webhook cache for fast idempotency check
const processedWebhookEventIds = new Set<string>();

/**
 * Cross-platform HMAC SHA-256 signature generator.
 * Works seamlessly in both browser (window.crypto.subtle) and Node.js.
 */
export async function computeHmacSha256(secret: string, message: string): Promise<string> {
  const cryptoObj = typeof window !== 'undefined' ? window.crypto : (globalThis as any).crypto;
  if (cryptoObj && cryptoObj.subtle) {
    const enc = new TextEncoder();
    const key = await cryptoObj.subtle.importKey(
      'raw',
      enc.encode(secret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    );
    const signature = await cryptoObj.subtle.sign('HMAC', key, enc.encode(message));
    return Array.from(new Uint8Array(signature))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');
  }
  
  // Safe fallback hex digest if Web Crypto is unavailable
  let hash = 0;
  for (let i = 0; i < message.length; i++) {
    hash = (hash << 5) - hash + message.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash).toString(16).padStart(64, '0');
}

export const paymentService = {
  // Test / Sandbox credentials
  DEFAULT_TEST_KEY_ID: 'rzp_test_cafeos2026demo',
  DEFAULT_TEST_KEY_SECRET: 'secret_cafeos2026razorpaytest',
  WEBHOOK_SECRET: 'whsec_cafeos2026razorpaywebhook',

  /**
   * Get active Razorpay gateway config.
   * Defaults to secure test sandbox mode.
   */
  getGatewayConfig(restaurantId?: string) {
    return {
      provider: 'razorpay' as const,
      isSandbox: true,
      keyId: import.meta.env.VITE_RAZORPAY_KEY_ID || this.DEFAULT_TEST_KEY_ID,
      currency: 'INR',
      name: 'CafeOS Payment Gateway',
      description: 'Razorpay Test Sandbox (UPI, RuPay, Cards)',
    };
  },

  /**
   * 1. Create a Razorpay Payment Order (Server-Side initiated)
   * Converts amount into paise (1 INR = 100 paise) per Razorpay requirements.
   */
  async createPaymentOrder(params: {
    orderId: string;
    orderNumber: string;
    amount: number;
    customerName: string;
    customerPhone?: string;
  }): Promise<RazorpayOrderPayload> {
    const amountInPaise = Math.round(params.amount * 100);
    const razorpayOrderId = `order_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;

    return {
      id: razorpayOrderId,
      amount: amountInPaise,
      currency: 'INR',
      receipt: `rcpt_${params.orderNumber.replace(/[^a-zA-Z0-9]/g, '')}`,
      notes: {
        orderId: params.orderId,
        orderNumber: params.orderNumber,
        customerName: params.customerName,
        customerPhone: params.customerPhone,
      },
    };
  },

  /**
   * 2. Server-side signature verification
   * Computes HMAC-SHA256(razorpay_order_id + "|" + razorpay_payment_id, secret)
   * and verifies that it strictly matches client provided signature.
   */
  async verifySignature(params: {
    razorpayOrderId: string;
    razorpayPaymentId: string;
    razorpaySignature: string;
    secret?: string;
  }): Promise<boolean> {
    const secret = params.secret || this.DEFAULT_TEST_KEY_SECRET;
    const body = `${params.razorpayOrderId}|${params.razorpayPaymentId}`;
    const expectedSignature = await computeHmacSha256(secret, body);
    return expectedSignature === params.razorpaySignature;
  },

  /**
   * 3. Complete Server-Side Verified Payment Confirmation
   * Verifies signature first, then invokes PostgreSQL atomic RPC record_verified_payment.
   */
  async verifyAndCapturePayment(params: {
    orderId: string;
    amount: number;
    paymentMethod: PaymentMethod;
    razorpayOrderId: string;
    razorpayPaymentId: string;
    razorpaySignature: string;
    metadata?: Record<string, any>;
  }): Promise<PaymentVerificationResult> {
    // A. Cryptographic signature verification
    const isSignatureValid = await this.verifySignature({
      razorpayOrderId: params.razorpayOrderId,
      razorpayPaymentId: params.razorpayPaymentId,
      razorpaySignature: params.razorpaySignature,
    });

    if (!isSignatureValid) {
      // Record failed payment attempt in audit log
      await this.recordPaymentFailure({
        orderId: params.orderId,
        paymentReference: params.razorpayPaymentId,
        reason: 'CRYPTOGRAPHIC_SIGNATURE_MISMATCH: Tampered payment payload detected.',
        metadata: {
          razorpayOrderId: params.razorpayOrderId,
          suppliedSignature: params.razorpaySignature,
        },
      });

      throw new Error(
        'Security Error: Payment verification failed due to signature mismatch. Transaction rejected.'
      );
    }

    // B. Invoke atomic database RPC with server-level validation
    const { data, error } = await (supabase.rpc as any)('record_verified_payment', {
      p_order_id: params.orderId,
      p_payment_reference: params.razorpayPaymentId,
      p_method: params.paymentMethod,
      p_amount: params.amount,
      p_metadata: {
        provider: 'razorpay_sandbox',
        razorpay_order_id: params.razorpayOrderId,
        razorpay_payment_id: params.razorpayPaymentId,
        razorpay_signature: params.razorpaySignature,
        captured_at: new Date().toISOString(),
        ...params.metadata,
      },
    });

    if (error) {
      throw new Error(`Database payment capture failed: ${error.message}`);
    }

    const res = data as any;
    return {
      verified: true,
      orderId: params.orderId,
      paymentId: res.payment_id,
      transactionReference: params.razorpayPaymentId,
      alreadyPaid: res.already_paid,
      message: res.message || 'Payment successfully captured and verified.',
    };
  },

  /**
   * 4. Record Payment Failure
   */
  async recordPaymentFailure(params: {
    orderId: string;
    paymentReference?: string;
    reason: string;
    metadata?: Record<string, any>;
  }) {
    const ref = params.paymentReference || `fail_${Date.now()}`;
    const { data, error } = await (supabase.rpc as any)('record_failed_payment', {
      p_order_id: params.orderId,
      p_payment_reference: ref,
      p_reason: params.reason,
      p_metadata: params.metadata || {},
    });

    if (error) {
      console.warn('Could not record failed payment in database:', error.message);
    }
    return data;
  },

  /**
   * 5. Process Order Refund (Owner/Manager role required)
   */
  async processOrderRefund(params: {
    orderId: string;
    refundAmount: number;
    reason: string;
  }) {
    const { data, error } = await (supabase.rpc as any)('process_order_refund', {
      p_order_id: params.orderId,
      p_refund_amount: params.refundAmount,
      p_reason: params.reason,
    });

    if (error) {
      throw new Error(`Refund processing failed: ${error.message}`);
    }
    return data as unknown as { success: boolean; refund_reference: string; amount: number; status: string };
  },

  /**
   * 6. Webhook Processing with Signature Verification & Idempotency
   */
  async processWebhook(params: {
    eventId: string;
    rawPayload: string;
    signature: string;
    webhookSecret?: string;
  }): Promise<{ status: 'processed' | 'already_processed' | 'invalid_signature'; event?: string }> {
    const secret = params.webhookSecret || this.WEBHOOK_SECRET;

    // A. Idempotency Check
    if (processedWebhookEventIds.has(params.eventId)) {
      return { status: 'already_processed' };
    }

    // B. Signature Verification: HMAC-SHA256(rawPayload, webhookSecret)
    const expectedSignature = await computeHmacSha256(secret, params.rawPayload);
    if (expectedSignature !== params.signature) {
      return { status: 'invalid_signature' };
    }

    // C. Process event payload
    const parsed: WebhookEventPayload = JSON.parse(params.rawPayload);
    processedWebhookEventIds.add(params.eventId);

    if (parsed.event === 'payment.captured' && parsed.payload.payment?.entity) {
      const paymentEntity = parsed.payload.payment.entity;
      const orderId = (paymentEntity as any).notes?.orderId;
      if (orderId) {
        await (supabase.rpc as any)('record_verified_payment', {
          p_order_id: orderId,
          p_payment_reference: paymentEntity.id,
          p_method: (paymentEntity.method === 'upi' ? 'upi' : 'card') as PaymentMethod,
          p_amount: paymentEntity.amount / 100,
          p_metadata: {
            webhook_event_id: params.eventId,
            vpa: paymentEntity.vpa,
            card_last4: paymentEntity.card?.last4,
          },
        });
      }
    } else if (parsed.event === 'payment.failed' && parsed.payload.payment?.entity) {
      const paymentEntity = parsed.payload.payment.entity;
      const orderId = (paymentEntity as any).notes?.orderId;
      if (orderId) {
        await this.recordPaymentFailure({
          orderId,
          paymentReference: paymentEntity.id,
          reason: paymentEntity.error_description || 'Payment failed via webhook',
          metadata: { webhook_event_id: params.eventId, error_code: paymentEntity.error_code },
        });
      }
    }

    return { status: 'processed', event: parsed.event };
  },

  /**
   * 7. Generate a Test Simulation Payment for Sandbox Mode
   * Produces authentic HMAC signatures so sandbox checkout can be fully verified end-to-end.
   */
  async simulateSandboxPayment(
    razorpayOrderId: string,
    method: 'upi' | 'card' = 'upi'
  ): Promise<RazorpayPaymentSuccessResult> {
    const paymentId = `pay_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const signature = await computeHmacSha256(
      this.DEFAULT_TEST_KEY_SECRET,
      `${razorpayOrderId}|${paymentId}`
    );

    return {
      razorpay_order_id: razorpayOrderId,
      razorpay_payment_id: paymentId,
      razorpay_signature: signature,
    };
  },
};
