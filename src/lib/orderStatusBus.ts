export type OrderStatusEvent = {
  orderId: string;
  status: string;
  customerName?: string;
  at: string;
};

const KEY = 'pixel-tech-order-status-event';
const EVENT = 'pixel-order-status';

export function subscribeOrderStatusEvents(
  cb: (event: OrderStatusEvent) => void
): () => void {
  if (typeof window === 'undefined') return () => undefined;

  const onStorage = (ev: StorageEvent) => {
    if (ev.key !== KEY || !ev.newValue) return;
    try {
      cb(JSON.parse(ev.newValue) as OrderStatusEvent);
    } catch {
      /* ignore */
    }
  };

  const onCustom = (ev: Event) => {
    const detail = (ev as CustomEvent<OrderStatusEvent>).detail;
    if (detail) cb(detail);
  };

  window.addEventListener('storage', onStorage);
  window.addEventListener(EVENT, onCustom);
  return () => {
    window.removeEventListener('storage', onStorage);
    window.removeEventListener(EVENT, onCustom);
  };
}

export const ORDER_STATUS_COPY: Record<
  string,
  { title: string; message: (id: string) => string; type: 'order' | 'success' | 'warning' | 'info' }
> = {
  pending: {
    title: 'Order received',
    message: (id) => `Order ${id.slice(0, 8).toUpperCase()} is queued at the hub.`,
    type: 'order',
  },
  processing: {
    title: 'Order packing',
    message: (id) => `Order ${id.slice(0, 8).toUpperCase()} is being packed for dispatch.`,
    type: 'order',
  },
  out_for_delivery: {
    title: 'Out for delivery',
    message: (id) => `A rider is on the way with order ${id.slice(0, 8).toUpperCase()}.`,
    type: 'order',
  },
  delivered: {
    title: 'Delivered',
    message: (id) => `Order ${id.slice(0, 8).toUpperCase()} was delivered. Enjoy your gear.`,
    type: 'success',
  },
  cancelled: {
    title: 'Order cancelled',
    message: (id) => `Order ${id.slice(0, 8).toUpperCase()} was cancelled. Contact support if this was unexpected.`,
    type: 'warning',
  },
};
