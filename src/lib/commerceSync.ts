import type { GroceryItem, Order } from '@/types';

const STOCK_KEY = 'pixel-tech-stock-by-name';
const ORDERS_KEY = 'pixel-tech-demo-orders';

function normalizeName(name: string): string {
  return name.toLowerCase().replace(/["“”']/g, '').replace(/\s+/g, ' ').trim();
}

function readJson<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback;
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function writeJson(key: string, value: unknown) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* ignore quota / private mode */
  }
}

export function applyStockOverrides(items: GroceryItem[]): GroceryItem[] {
  const overrides = readJson<Record<string, number>>(STOCK_KEY, {});
  if (!Object.keys(overrides).length) return items;
  return items.map((item) => {
    const key = normalizeName(item.name);
    if (typeof overrides[key] !== 'number') return item;
    return { ...item, stock: Math.max(0, Math.min(item.maxStock, overrides[key])) };
  });
}

export function persistStockLevels(items: GroceryItem[]) {
  const next: Record<string, number> = {};
  for (const item of items) {
    next[normalizeName(item.name)] = item.stock;
  }
  writeJson(STOCK_KEY, next);
}

export function loadPersistedOrders(): Order[] {
  return readJson<Order[]>(ORDERS_KEY, []);
}

export function persistOrders(orders: Order[]) {
  writeJson(ORDERS_KEY, orders);
}
