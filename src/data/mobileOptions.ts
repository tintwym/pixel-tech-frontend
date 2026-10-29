/** Shared smartphone finish/storage options for product details. */
export const MOBILE_STORAGE_OPTIONS = ['128GB', '256GB', '512GB'] as const;
export type MobileStorage = (typeof MOBILE_STORAGE_OPTIONS)[number];

export function isSmartphoneCategory(category: string | undefined): boolean {
  return (category || '').toLowerCase() === 'smartphones';
}

/** Always open on 256GB when that tier is offered (ignore name suffixes like — 128GB). */
export function defaultMobileStorage(_productName?: string): MobileStorage {
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
