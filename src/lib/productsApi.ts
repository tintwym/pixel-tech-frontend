import { GroceryItem, FeaturesRestriction } from '@/types';
import { INITIAL_GROCERIES } from '@/data/products';

const API_BASE =
  (typeof process !== 'undefined' && process.env.NEXT_PUBLIC_API_BASE_URL) ||
  '/api';

type ApiProductImage = {
  id?: string;
  path?: string;
  altText?: string;
};

type ApiProduct = {
  id: string;
  name?: string;
  description?: string;
  price?: number | string;
  stock?: number;
  images?: ApiProductImage[];
};

function apiUrl(path: string): string {
  const base = String(API_BASE).replace(/\/$/, '');
  const relative = path.startsWith('/') ? path : `/${path}`;
  return `${base}${relative}`;
}

function normalizeName(name: string): string {
  return name.toLowerCase().replace(/["“”']/g, '').replace(/\s+/g, ' ').trim();
}

function isPlaceholderImage(url?: string | null): boolean {
  if (!url) return true;
  const lower = url.toLowerCase();
  return (
    lower.includes('dummyimage.com') ||
    lower.includes('placehold.co') ||
    lower.includes('placehold.it') ||
    lower.includes('via.placeholder.com') ||
    lower.includes('picsum.photos') ||
    lower.endsWith('.svg')
  );
}

function inferCategory(name: string, local?: GroceryItem): string {
  if (local?.category) return local.category;
  const n = name.toLowerCase();
  if (
    n.includes('iphone') ||
    n.includes('galaxy s') ||
    n.includes('pixel') ||
    n.includes('phone')
  ) {
    return 'Mobile';
  }
  if (n.includes('macbook') || n.includes('laptop') || n.includes('rog') || n.includes('book')) {
    return 'Laptop';
  }
  if (n.includes('airpods') || n.includes('wh-1000') || n.includes('headphone') || n.includes('buds')) {
    return 'Audio';
  }
  if (n.includes('watch')) return 'Wearables';
  if (n.includes('ipad') || n.includes('tab ') || n.includes('tablet') || n.includes('monitor')) {
    return 'Electronics';
  }
  return 'Accessories';
}

function mapApiProduct(api: ApiProduct, local?: GroceryItem): GroceryItem {
  const name = api.name?.trim() || local?.name || 'Product';
  const priceNum = Number(api.price);
  const stock = typeof api.stock === 'number' ? api.stock : local?.stock ?? 0;
  const apiImage = api.images?.find((img) => img.path)?.path;
  // Prefer real photos: skip grey dummyimage/placehold seeds from the API.
  const imageUrl =
    (apiImage && !isPlaceholderImage(apiImage) ? apiImage : undefined) ||
    local?.imageUrl ||
    'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=600&q=80';

  return {
    // Keep stable local ids when names match so demo features (Buy Again, restock sync) work.
    id: local?.id ?? String(api.id),
    apiId: String(api.id),
    name,
    description: api.description?.trim() || local?.description || '',
    category: inferCategory(name, local),
    price: Number.isFinite(priceNum) ? priceNum : local?.price ?? 0,
    currency: 'MMK',
    imageUrl,
    stock,
    maxStock: Math.max(local?.maxStock ?? stock, stock),
    availabilityZone: local?.availabilityZone ?? 'All Zones',
    featuresRestrictions: (local?.featuresRestrictions ?? []) as FeaturesRestriction[],
    isSubscriptionAvailable: local?.isSubscriptionAvailable ?? false,
    rating: local?.rating ?? 4.5,
    unit: local?.unit ?? '1 unit',
  };
}

/**
 * Load catalog from Spring `/api/products/index`, enriching with local metadata
 * (zones, features, ratings). Falls back to the static electronics catalog offline.
 */
export async function fetchCatalogProducts(signal?: AbortSignal): Promise<GroceryItem[]> {
  let res: Response;
  try {
    res = await fetch(apiUrl('/products/index'), {
      method: 'GET',
      headers: { Accept: 'application/json' },
      signal,
    });
  } catch {
    return INITIAL_GROCERIES;
  }

  if (!res.ok) {
    return INITIAL_GROCERIES;
  }

  let data: unknown;
  try {
    data = await res.json();
  } catch {
    return INITIAL_GROCERIES;
  }

  if (!Array.isArray(data) || data.length === 0) {
    return INITIAL_GROCERIES;
  }

  const localByName = new Map(
    INITIAL_GROCERIES.map((item) => [normalizeName(item.name), item] as const)
  );

  return (data as ApiProduct[]).map((api) => {
    const local = api.name ? localByName.get(normalizeName(api.name)) : undefined;
    return mapApiProduct(api, local);
  });
}
