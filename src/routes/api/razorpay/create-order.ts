import { createFileRoute } from '@tanstack/react-router';
import '@tanstack/react-start/server-only';
import { supabaseAdmin } from '@/lib/supabaseAdmin.server';

export const Route = createFileRoute('/api/razorpay/create-order')({
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
          const body = await request.json();
          const { items, address } = body as {
            items: Array<{ product_id: string; quantity: number; size: string; color: string; image?: string }>;
            address: { name: string; phone: string; address: string; city: string; pincode: string };
          };

          // --- Validate ---
          if (!items || !Array.isArray(items) || items.length === 0) {
            return Response.json({ error: 'Items required' }, { status: 400 });
          }
          if (!address?.name || !address?.phone || !address?.address || !address?.city || !address?.pincode) {
            return Response.json({ error: 'Complete address required' }, { status: 400 });
          }
          for (const item of items) {
            if (!item.product_id || !item.quantity || item.quantity < 1 || item.quantity > 10) {
              return Response.json({ error: `Invalid item: ${item.product_id}` }, { status: 400 });
            }
          }

          // --- Load prices from DB ---
          const productIds = items.map(i => i.product_id);
          const { data: products, error: prodErr } = await supabaseAdmin
            .from('products')
            .select('id, name, price')
            .in('id', productIds);

          if (prodErr) {
            console.error('Products query error:', prodErr.message);
            return Response.json({ error: 'Failed to load products' }, { status: 500 });
          }

          const productMap = new Map((products || []).map(p => [p.id, p]));
          for (const item of items) {
            if (!productMap.has(item.product_id)) {
              return Response.json({ error: `Unknown product: ${item.product_id}` }, { status: 400 });
            }
          }

          // --- Calculate totals ---
          let subtotal = 0;
          for (const item of items) {
            const p = productMap.get(item.product_id)!;
            subtotal += Number(p.price) * item.quantity;
          }
          const shipping = (subtotal > 5000 || subtotal <= 1) ? 0 : 199;
          const total = subtotal + shipping;

          // --- Create Razorpay order ---
          const rzpKeyId = process.env.RAZORPAY_KEY_ID;
          const rzpSecret = process.env.RAZORPAY_KEY_SECRET;
          if (!rzpKeyId || !rzpSecret) {
            console.error('Razorpay credentials missing');
            return Response.json({ error: 'Payment service unavailable' }, { status: 503 });
          }

          const orderNumber = 'ORD-' + Math.random().toString(36).substring(2, 11).toUpperCase();
          const rzpRes = await fetch('https://api.razorpay.com/v1/orders', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': 'Basic ' + btoa(`${rzpKeyId}:${rzpSecret}`),
            },
            body: JSON.stringify({
              amount: Math.round(total * 100),
              currency: 'INR',
              receipt: orderNumber,
            }),
          });

          if (!rzpRes.ok) {
            const errBody = await rzpRes.text();
            console.error('Razorpay create order failed:', rzpRes.status, errBody);
            return Response.json({ error: 'Failed to create payment order' }, { status: 502 });
          }

          const rzpOrder = await rzpRes.json();

          // --- Insert order + items in DB ---
          const { data: order, error: orderErr } = await supabaseAdmin
            .from('orders')
            .insert({
              user_id: user.id,
              order_number: orderNumber,
              status: 'pending',
              total_amount: total,
              shipping_address: address,
              payment_method: 'razorpay',
              razorpay_order_id: rzpOrder.id,
            })
            .select('id')
            .single();

          if (orderErr) {
            console.error('Order insert error:', orderErr.message);
            return Response.json({ error: 'Failed to create order' }, { status: 500 });
          }

          const orderItems = items.map(item => {
            const p = productMap.get(item.product_id)!;
            return {
              order_id: order.id,
              product_id: item.product_id,
              product_name: p.name,
              product_image_url: item.image || '',
              quantity: item.quantity,
              price: Number(p.price),
              size: item.size,
              color: item.color,
            };
          });

          const { error: itemsErr } = await supabaseAdmin.from('order_items').insert(orderItems);
          if (itemsErr) {
            console.error('Order items insert error:', itemsErr.message);
            await supabaseAdmin.from('orders').delete().eq('id', order.id);
            return Response.json({ error: 'Failed to save order items' }, { status: 500 });
          }

          return Response.json({
            orderId: order.id,
            orderNumber,
            razorpayOrderId: rzpOrder.id,
            amount: rzpOrder.amount,
            currency: rzpOrder.currency,
            keyId: rzpKeyId,
          });
        } catch (err: any) {
          console.error('create-order error:', err?.message || err);
          return Response.json({ error: 'Internal server error' }, { status: 500 });
        }
      },
    },
  },
});
