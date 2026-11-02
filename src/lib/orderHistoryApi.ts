import { getStoredToken } from '@/lib/authApi';
import type { OrderStatus } from '@/types';

const API_BASE =
  (typeof process !== 'undefined' && process.env.NEXT_PUBLIC_API_BASE_URL) ||
  '/api';

function apiUrl(path: string): string {
  const base = String(API_BASE).replace(/\/$/, '');
  return `${base}${path.startsWith('/') ? path : `/${path}`}`;
}

export type ServerOrderSnapshot = {
  id: string;
  fulfillmentStatus: OrderStatus;
};

type ApiOrder = {
  id?: string;
  fulfillmentStatus?: string | null;
};

const STATUSES: OrderStatus[] = [
  'pending',
  'processing',
  'out_for_delivery',
  'delivered',
  'cancelled',
];

function mapStatus(raw: string | null | undefined): OrderStatus {
  if (raw && STATUSES.includes(raw as OrderStatus)) return raw as OrderStatus;
  return 'pending';
}

/** Poll signed-in Stripe/API order fulfillment for shopper alerts. */
export async function fetchOrderFulfillmentSnapshots(
  signal?: AbortSignal
): Promise<ServerOrderSnapshot[]> {
  const token = getStoredToken();
  if (!token) return [];
  const res = await fetch(apiUrl('/orders/history'), {
    headers: {
      Accept: 'application/json',
      Authorization: `Bearer ${token}`,
    },
    signal,
  });
  if (!res.ok) return [];
  const data = (await res.json()) as ApiOrder[];
  if (!Array.isArray(data)) return [];
  return data
    .filter((o) => o.id)
    .map((o) => ({
      id: String(o.id),
      fulfillmentStatus: mapStatus(o.fulfillmentStatus),
    }));
}
