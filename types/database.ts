export type OrderStatus = "pending" | "confirmed" | "processing" | "shipped" | "delivered" | "cancelled";
export type EmailStatus = "pending" | "sending" | "sent" | "failed";

export type OrderRow = {
  id: string;
  order_number: string;
  user_id: string | null;
  customer_name: string;
  customer_email: string;
  phone: string;
  address: string;
  city: string;
  subtotal: number;
  total: number;
  status: OrderStatus;
  email_status: EmailStatus;
  created_at: string;
  updated_at: string;
};

export type OrderItemRow = {
  id: string;
  order_id: string;
  product_id: string | null;
  product_name: string;
  price: number;
  quantity: number;
  created_at: string;
};

export type OrderWithItems = OrderRow & { order_items: OrderItemRow[] };
