/** Laptop size / memory / storage configurator for product details. */

export const LAPTOP_STORAGE_OPTIONS = ['256GB', '512GB', '1TB'] as const;
export type LaptopStorage = (typeof LAPTOP_STORAGE_OPTIONS)[number];

export const LAPTOP_MEMORY_OPTIONS = ['16GB', '24GB'] as const;
export type LaptopMemory = (typeof LAPTOP_MEMORY_OPTIONS)[number];

export function isLaptopCategory(category: string | undefined): boolean {
  return (category || '').toLowerCase() === 'laptops';
}

/** Screen sizes offered for a laptop SKU (from name + image cues). */
export function laptopSizeOptions(
  productName: string,
  imageUrls: string[] = []
): string[] {
  const fromUrls = Array.from(
    new Set(
      imageUrls
        .map((url) => {
          const file = url.toLowerCase();
          // Ignore phone-style 6-3inch / 6-9inch tokens on shared galleries.
          const m = file.match(/(?:^|[^0-9])(\d{2})inch/);
          return m ? `${m[1]}"` : null;
        })
        .filter((s): s is string => Boolean(s))
    )
  ).sort((a, b) => parseInt(a, 10) - parseInt(b, 10));

  const n = productName.toLowerCase();
  if (/macbook\s*air/.test(n)) return ['13"', '15"'];
  if (/macbook\s*neo/.test(n)) return fromUrls; // Neo assets are single-size
  if (/macbook\s*pro/.test(n)) {
    if (/\b14/.test(n)) return ['14"', '16"'];
    if (/\b16/.test(n)) return ['14"', '16"'];
    return fromUrls.length ? fromUrls : ['14"', '16"'];
  }
  if (fromUrls.length) return fromUrls;
  return [];
}

export function defaultLaptopSize(productName: string, sizes: string[]): string | null {
  if (!sizes.length) return null;
  const m = productName.match(/(\d+)\s*["”]/);
  if (m) {
    const hit = `${m[1]}"`;
    if (sizes.includes(hit)) return hit;
  }
  return sizes[0];
}

/** Always open on 256GB when that tier is offered. */
export function defaultLaptopStorage(_productName?: string): LaptopStorage {
  return '256GB';
}

export function defaultLaptopMemory(productName: string): LaptopMemory {
  const m = productName.match(/(\d+)\s*GB/i);
  // Prefer the RAM figure when name is like "16GB/512GB"
  const ramMatch = productName.match(/(\d+)\s*GB\s*\/\s*\d+/i);
  if (ramMatch) {
    const ram = `${ramMatch[1]}GB` as LaptopMemory;
    if ((LAPTOP_MEMORY_OPTIONS as readonly string[]).includes(ram)) return ram;
  }
  if (m && Number(m[1]) <= 32) {
    const ram = `${m[1]}GB` as LaptopMemory;
    if ((LAPTOP_MEMORY_OPTIONS as readonly string[]).includes(ram)) return ram;
  }
  return '16GB';
}

/** Catalog base price assumed for: 13"/14" · 16GB · 256GB. */
export function laptopConfigPrice(
  basePrice: number,
  size: string | null,
  memory: string,
  storage: string
): number {
  let price = basePrice;
  const inches = size ? parseInt(size, 10) : NaN;
  if (!Number.isNaN(inches)) {
    if (inches >= 15 && inches < 16) price += 500_000;
    if (inches >= 16) price += 700_000;
  }
  switch (memory) {
    case '24GB':
      price += 600_000;
      break;
    default:
      break;
  }
  switch (storage) {
    case '512GB':
      price += 400_000;
      break;
    case '1TB':
      price += 1_200_000;
      break;
    default:
      break;
  }
  return Math.max(0, price);
}

/** Compact cart / toast label: 13" · 16GB · 512GB */
export function formatLaptopConfig(
  size: string | null,
  memory: string,
  storage: string
): string {
  return [size, memory, storage].filter(Boolean).join(' · ');
}
