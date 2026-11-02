/** Tablet size / storage configurator for product details. */

export const TABLET_STORAGE_OPTIONS = ['256GB', '512GB', '1TB', '2TB'] as const;
export type TabletStorage = (typeof TABLET_STORAGE_OPTIONS)[number];

export function isTabletCategory(category: string | undefined): boolean {
  return (category || '').toLowerCase() === 'tablets';
}

/** Screen sizes offered for a tablet SKU (from name + image cues). */
export function tabletSizeOptions(
  productName: string,
  imageUrls: string[] = []
): string[] {
  const fromUrls = Array.from(
    new Set(
      imageUrls
        .map((url) => {
          const file = url.toLowerCase();
          const m = file.match(/(?:^|[^0-9])(\d{2})inch/);
          return m ? `${m[1]}"` : null;
        })
        .filter((s): s is string => Boolean(s))
    )
  ).sort((a, b) => parseInt(a, 10) - parseInt(b, 10));

  const n = productName.toLowerCase();
  if (/ipad\s*(pro|air)/.test(n)) return ['11"', '13"'];
  if (fromUrls.length) return fromUrls;
  return [];
}

export function defaultTabletSize(productName: string, sizes: string[]): string | null {
  if (!sizes.length) return null;
  const m = productName.match(/(\d+)\s*["”]/);
  if (m) {
    const hit = `${m[1]}"`;
    if (sizes.includes(hit)) return hit;
  }
  return sizes[0];
}

export function defaultTabletStorage(): TabletStorage {
  return '256GB';
}

/** Catalog base price assumed for: 11" · 256GB. */
export function tabletConfigPrice(
  basePrice: number,
  size: string | null,
  storage: string
): number {
  let price = basePrice;
  const inches = size ? parseInt(size, 10) : NaN;
  if (!Number.isNaN(inches) && inches >= 13) price += 700_000;
  switch (storage) {
    case '512GB':
      price += 400_000;
      break;
    case '1TB':
      price += 1_200_000;
      break;
    case '2TB':
      price += 2_000_000;
      break;
    default:
      break;
  }
  return Math.max(0, price);
}

export function formatTabletConfig(size: string | null, storage: string): string {
  return [size, storage].filter(Boolean).join(' · ');
}
