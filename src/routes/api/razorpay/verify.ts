import { createFileRoute } from '@tanstack/react-router';
import '@tanstack/react-start/server-only';
import { supabaseAdmin } from '@/lib/supabaseAdmin.server';

// Constant-time comparison to prevent timing attacks
function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return result === 0;
}

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

export const Route = createFileRoute('/api/razorpay/verify')({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          // --- Auth ---
          const auth = request.headers.get('authorization');
          if (!auth?.startsWith('Bearer ')) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
          }
          const token = auth.slice(7);
          const { data: { user }, error: authErr } = await supabaseAdmin.auth.getUser(token);
          if (authErr || !user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
          }

          // --- Parse body ---
          const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = await request.json();
          if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
            return Response.json({ error: 'Missing payment data' }, { status: 400 });
          }

          // --- Verify signature ---
          const rzpSecret = process.env.RAZORPAY_KEY_SECRET;
          if (!rzpSecret) {
            return Response.json({ error: 'Payment service unavailable' }, { status: 503 });
          }

          const expectedSig = await hmacSha256(rzpSecret, `${razorpay_order_id}|${razorpay_payment_id}`);
          if (!timingSafeEqual(expectedSig, razorpay_signature)) {
            return Response.json({ error: 'Invalid payment signature' }, { status: 400 });
          }

          // --- Find order ---
          const { data: order, error: findErr } = await supabaseAdmin
            .from('orders')
            .select('id, status, order_number')
            .eq('razorpay_order_id', razorpay_order_id)
            .eq('user_id', user.id)
            .single();

          if (findErr || !order) {
            return Response.json({ error: 'Order not found' }, { status: 404 });
          }

          // Idempotent: already processed
          if (order.status !== 'pending') {
            return Response.json({ success: true, orderNumber: order.order_number });
          }

          // --- Update order ---
          const { error: updateErr } = await supabaseAdmin
            .from('orders')
            .update({
              status: 'processing',
              razorpay_payment_id,
              payment_reference: razorpay_payment_id,
            })
            .eq('id', order.id);

          if (updateErr) {
            console.error('Order update error:', updateErr.message);
            return Response.json({ error: 'Failed to update order' }, { status: 500 });
          }

          return Response.json({ success: true, orderNumber: order.order_number });
        } catch (err: any) {
          console.error('verify error:', err?.message || err);
          return Response.json({ error: 'Internal server error' }, { status: 500 });
        }
      },
    },
  },
});
