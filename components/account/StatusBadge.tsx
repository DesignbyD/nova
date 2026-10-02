import { Badge, type BadgeTone } from "@/components/ui/Badge";
import type { OrderStatus } from "@/types/database";

export const statusInfo: Record<OrderStatus, { label: string; tone: BadgeTone; description: string }> = {
  pending: { label: "Received", tone: "accent", description: "We've received your order and will confirm it shortly." },
  confirmed: { label: "Confirmed", tone: "accent", description: "Your order is confirmed." },
  processing: { label: "Being prepared", tone: "warning", description: "We're preparing your order." },
  shipped: { label: "On its way", tone: "accent", description: "Your order has left us and is on its way." },
  delivered: { label: "Delivered", tone: "success", description: "Your order has been delivered." },
  cancelled: { label: "Cancelled", tone: "danger", description: "This order was cancelled." },
};

export function StatusBadge({ status }: { status: OrderStatus }) {
  const info = statusInfo[status] ?? statusInfo.pending;
  return <Badge tone={info.tone}>{info.label}</Badge>;
}
