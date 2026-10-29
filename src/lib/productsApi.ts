import { GroceryItem, FeaturesRestriction } from '@/types';
import { INITIAL_GROCERIES } from '@/data/products';
import {
  PRODUCT_CATEGORIES,
  inferBrandFromName,
  inferCategoryFromName,
} from '@/data/catalogTaxonomy';

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
  brand?: string;
  category?: string;
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

function resolveBrand(apiBrand: string | undefined, name: string, local?: GroceryItem): string {
  if (apiBrand?.trim()) return apiBrand.trim();
  if (local?.brand) return local.brand;
  return inferBrandFromName(name);
}

function resolveCategory(
  apiCategory: string | undefined,
  name: string,
  local?: GroceryItem
): string {
  if (apiCategory?.trim()) return apiCategory.trim();
  if (local?.category) return local.category;
  return inferCategoryFromName(name);
}

/** Drop leftover grocery rows still present in the shared Neon catalog. */
function isElectronicsProduct(item: GroceryItem, hasLocalMatch: boolean): boolean {
  if (hasLocalMatch) return true;
  if ((PRODUCT_CATEGORIES as readonly string[]).includes(item.category)) return true;
  const n = item.name.toLowerCase();
  return /iphone|ipad|macbook|galaxy|airpods|sony|asus|rog|laptop|phone|tablet|headphone|earbud|watch|desktop|pc/.test(
    n
  );
}

function mapApiProduct(api: ApiProduct, local?: GroceryItem): GroceryItem {
  const name = api.name?.trim() || local?.name || 'Product';
  const priceNum = Number(api.price);
  const stock = typeof api.stock === 'number' ? api.stock : local?.stock ?? 0;
  const apiGallery =
    api.images
      ?.map((img) => img.path)
      .filter((path): path is string => Boolean(path) && !isPlaceholderImage(path)) ?? [];
  // Prefer curated local primary/gallery order when present; API fills gaps.
  const imageUrl =
    local?.imageUrl ||
    apiGallery[0] ||
    'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=600&q=80';
  const imageUrls =
    local?.imageUrls?.length
      ? local.imageUrls
      : apiGallery.length > 0
        ? apiGallery
        : [imageUrl];

  return {
    // Keep stable local ids when names match so demo features (Buy Again, restock sync) work.
    id: local?.id ?? String(api.id),
    apiId: String(api.id),
    name,
    description: api.description?.trim() || local?.description || '',
    brand: resolveBrand(api.brand, name, local),
    category: resolveCategory(api.category, name, local),
    price: Number.isFinite(priceNum) ? priceNum : local?.price ?? 0,
    currency: 'MMK',
    imageUrl,
    imageUrls,
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

  return (data as ApiProduct[])
    .map((api) => {
      const local = api.name ? localByName.get(normalizeName(api.name)) : undefined;
      return { item: mapApiProduct(api, local), hasLocal: Boolean(local) };
    })
    .filter(({ item, hasLocal }) => isElectronicsProduct(item, hasLocal))
    .map(({ item }) => item);
}
