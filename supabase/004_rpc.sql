-- Drop functions if they exist
drop function if exists place_order(jsonb, jsonb, text);
drop function if exists cancel_order(uuid);

create or replace function place_order(
  p_items jsonb,
  p_address jsonb,
  p_utr text
) returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid;
  v_order_id uuid;
  v_order_number text;
  v_item jsonb;
  v_product record;
  v_subtotal numeric := 0;
  v_shipping numeric := 0;
  v_total numeric := 0;
begin
  -- 1. Require auth
  v_user_id := auth.uid();
  if v_user_id is null then
    raise exception 'Unauthorized';
  end if;

  -- 2. Validate UTR (must be exactly 12 digits)
  if p_utr !~ '^[0-9]{12}$' then
    raise exception 'Invalid UTR format. Must be exactly 12 digits.';
  end if;

  -- 3. Check duplicate UTR early to give a clear error
  if exists (select 1 from orders where payment_reference = p_utr) then
    raise exception 'duplicate_utr';
  end if;

  -- 4. Calculate total and validate items directly from the database
  for v_item in select * from jsonb_array_elements(p_items) loop
    if (v_item->>'qty')::int < 1 then
      raise exception 'Quantity must be at least 1 for product %', v_item->>'product_id';
    end if;

    select * into v_product from products where id = v_item->>'product_id';
    if not found then
      raise exception 'Unknown product %', v_item->>'product_id';
    end if;

    v_subtotal := v_subtotal + (v_product.price * (v_item->>'qty')::int);
  end loop;

  -- 5. Calculate shipping (free > 5000)
  if v_subtotal > 5000 then
    v_shipping := 0;
  else
    v_shipping := 199;
  end if;
  
  v_total := v_subtotal + v_shipping;

  -- 6. Generate unique order number
  v_order_number := 'ORD-' || to_char(now(), 'YYMMDD') || '-' || upper(substring(md5(random()::text) from 1 for 6));

  -- 7. Insert Order
  insert into orders (
    user_id,
    order_number,
    status,
    total_amount,
    shipping_address,
    payment_method,
    payment_reference
  ) values (
    v_user_id,
    v_order_number,
    'pending',
    v_total,
    p_address,
    'upi_qr',
    p_utr
  ) returning id into v_order_id;

  -- 8. Insert order items
  for v_item in select * from jsonb_array_elements(p_items) loop
    select * into v_product from products where id = v_item->>'product_id';
    
    insert into order_items (
      order_id,
      product_id,
      product_name,
      quantity,
      price,
      size,
      color
    ) values (
      v_order_id,
      v_item->>'product_id',
      v_product.name,
      (v_item->>'qty')::int,
      v_product.price,
      v_item->>'size',
      v_item->>'color'
    );
  end loop;

  return jsonb_build_object('id', v_order_id, 'order_number', v_order_number);

exception
  when unique_violation then
    if sqlerrm ilike '%payment_reference%' then
      raise exception 'duplicate_utr';
    elsif sqlerrm ilike '%order_number%' then
      raise exception 'order_number_collision';
    else
      raise;
    end if;
end;
$$;

create or replace function cancel_order(p_order_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid;
  v_status text;
begin
  v_user_id := auth.uid();
  if v_user_id is null then
    raise exception 'Unauthorized';
  end if;

  select status into v_status from orders where id = p_order_id and user_id = v_user_id;
  
  if not found then
    raise exception 'Order not found or unauthorized';
  end if;

  if v_status != 'pending' then
    raise exception 'Only pending orders can be cancelled';
  end if;

  update orders set status = 'cancelled' where id = p_order_id;
end;
$$;

-- Grant execution to authenticated users
grant execute on function place_order(jsonb, jsonb, text) to authenticated;
grant execute on function cancel_order(uuid) to authenticated;

notify pgrst, 'reload schema';
