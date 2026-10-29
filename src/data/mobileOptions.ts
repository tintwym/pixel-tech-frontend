/** Shared smartphone finish/storage options for product details. */
export const MOBILE_STORAGE_OPTIONS = ['128GB', '256GB', '512GB'] as const;
export type MobileStorage = (typeof MOBILE_STORAGE_OPTIONS)[number];

export function isSmartphoneCategory(category: string | undefined): boolean {
  return (category || '').toLowerCase() === 'smartphones';
}

export function defaultMobileStorage(productName: string): MobileStorage {
  const match = productName.match(/(\d+)\s*GB/i);
  if (match) {
    const gb = `${match[1]}GB` as MobileStorage;
    if ((MOBILE_STORAGE_OPTIONS as readonly string[]).includes(gb)) return gb;
  }
  return '256GB';
}

/** Price adjustment vs the catalog base (assumed 256GB). */
export function mobileStoragePrice(basePrice: number, storage: string): number {
  const step = 400_000;
  switch (storage) {
    case '128GB':
      return Math.max(0, basePrice - step);
    case '512GB':
      return basePrice + step;
    default:
      return basePrice;
  }
}
