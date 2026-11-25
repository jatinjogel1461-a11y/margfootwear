import { useQuery } from "@tanstack/react-query";
import { supabase } from "./supabaseClient";

export interface ShippingAddress {
  name?: string;
  phone?: string;
  address?: string;
  city?: string;
  pincode?: string;
}

export interface AdminOrderItem {
  id: string;
  order_id: string;
  product_id: string | null;
  product_name: string;
  product_image_url: string | null;
  quantity: number;
  price: number;
  size: string | null;
  color: string | null;
}

export interface AdminOrder {
  id: string;
  user_id: string;
  order_number: string;
  status: string;
  total_amount: number;
  shipping_address: ShippingAddress | null;
  payment_method: string | null;
  payment_reference: string | null;
  created_at: string;
  order_items?: AdminOrderItem[];
}

export interface AdminProduct {
  id: string;
  name: string;
  category: string;
  sub: string;
  price: number;
  stock?: number | null;
  description: string | null;
  is_new?: boolean | null;
  release_date?: string | null;
  rating?: number | null;
  reviews?: number | null;
}

export function useIsAdmin(userId?: string | null) {
  return useQuery({
    queryKey: ["is_admin", userId],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("is_admin");
      if (error) throw error;
      return Boolean(data);
    },
    enabled: Boolean(userId),
    staleTime: 60_000,
    retry: false,
  });
}
