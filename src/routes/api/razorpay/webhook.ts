import { createFileRoute } from '@tanstack/react-router';
import '@tanstack/react-start/server-only';
import { supabaseAdmin } from '@/lib/supabaseAdmin.server';

async function hmacSha256(key: string, message: string): Promise<string> {
  const encoder = new TextEncoder();
  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    encoder.encode(key),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const sig = await crypto.subtle.sign('HMAC', cryptoKey, encoder.encode(message));
  return Array.from(new Uint8Array(sig)).map(b => b.toString(16).padStart(2, '0')).join('');
}

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return result === 0;
}

export const Route = createFileRoute('/api/razorpay/webhook')({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
          if (!webhookSecret) {
            return Response.json({ error: 'Webhook not configured' }, { status: 503 });
          }

          const signature = request.headers.get('x-razorpay-signature');
          if (!signature) {
            return Response.json({ error: 'Missing signature' }, { status: 400 });
          }

          // Read raw body for signature verification
          const rawBody = await request.text();
          const expectedSig = await hmacSha256(webhookSecret, rawBody);
          if (!timingSafeEqual(expectedSig, signature)) {
            return Response.json({ error: 'Invalid signature' }, { status: 400 });
          }

          const event = JSON.parse(rawBody);
          const eventType = event?.event;

          if (eventType === 'payment.captured') {
            const payment = event?.payload?.payment?.entity;
            if (!payment) {
              return Response.json({ status: 'ok' });
            }

            const rzpOrderId = payment.order_id;
            const rzpPaymentId = payment.id;

            if (rzpOrderId && rzpPaymentId) {
              // Find order and update if still pending
              const { data: order } = await supabaseAdmin
                .from('orders')
                .select('id, status')
                .eq('razorpay_order_id', rzpOrderId)
                .single();

              if (order && order.status === 'pending') {
                await supabaseAdmin
                  .from('orders')
                  .update({
                    status: 'processing',
                    razorpay_payment_id: rzpPaymentId,
                    payment_reference: rzpPaymentId,
                  })
                  .eq('id', order.id);
              }
            }
          }

          // Always respond 200 for valid webhook events
          return Response.json({ status: 'ok' });
        } catch (err: any) {
          console.error('webhook error:', err?.message || err);
          return Response.json({ error: 'Internal server error' }, { status: 500 });
        }
      },
    },
  },
});
