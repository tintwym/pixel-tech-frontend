/** Tablet size / storage configurator for product details. */

export const TABLET_STORAGE_OPTIONS = ['256GB', '512GB', '1TB', '2TB'] as const;
export type TabletStorage = (typeof TABLET_STORAGE_OPTIONS)[number];

const IPAD_BASE_STORAGE = ['128GB', '256GB', '512GB'] as const;
/** Air catalog base price assumes 256GB (skip 128GB to avoid negative deltas). */
const IPAD_AIR_STORAGE = ['256GB', '512GB', '1TB'] as const;

/** Absolute upgrade vs a notional 128GB floor; deltas are relative to each SKU’s base tier. */
const STORAGE_UPGRADE_MMK: Record<string, number> = {
  '128GB': 0,
  '256GB': 200_000,
  '512GB': 600_000,
  '1TB': 1_400_000,
  '2TB': 2_200_000,
};

export function isTabletCategory(category: string | undefined): boolean {
  return (category || '').toLowerCase() === 'tablets';
}

/** Apple iPads (incl. single-size base iPad) use finish + storage configurators. */
export function isConfigurableIpad(productName: string): boolean {
  return /\bipad\b/i.test(productName);
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

export function tabletStorageOptions(productName: string): readonly string[] {
  const n = productName.toLowerCase();
  if (/ipad\s*pro/.test(n)) return TABLET_STORAGE_OPTIONS;
  if (/ipad\s*air/.test(n)) return IPAD_AIR_STORAGE;
  if (/\bipad\b/.test(n)) return IPAD_BASE_STORAGE;
  return TABLET_STORAGE_OPTIONS;
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

export function defaultTabletStorage(productName = ''): string {
  return tabletStorageOptions(productName)[0] || '256GB';
}

/** Catalog base price assumed for: smallest size · that SKU’s base storage. */
export function tabletConfigPrice(
  basePrice: number,
  size: string | null,
  storage: string,
  productName = ''
): number {
  let price = basePrice;
  const inches = size ? parseInt(size, 10) : NaN;
  if (!Number.isNaN(inches) && inches >= 13) price += 700_000;

  const options = tabletStorageOptions(productName);
  const baseStorage = options[0];
  const baseUpgrade = STORAGE_UPGRADE_MMK[baseStorage] ?? 0;
  const selectedUpgrade = STORAGE_UPGRADE_MMK[storage] ?? 0;
  price += Math.max(0, selectedUpgrade - baseUpgrade);

  return Math.max(0, price);
}

export function formatTabletConfig(size: string | null, storage: string): string {
  return [size, storage].filter(Boolean).join(' · ');
}
