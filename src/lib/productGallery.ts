export type ProductColorOption = {
  id: string;
  label: string;
  swatch: string;
  imageUrls: string[];
};

const COLOR_SWATCHES: Record<string, string> = {
  starwhite: '#F3EFE6',
  nightsky: '#1B1C28',
  black: '#1a1a1a',
  white: '#f5f5f5',
  silver: '#c0c0c0',
  gold: '#d4af37',
  lightgold: '#E8D5A3',
  blue: '#3b82f6',
  skyblue: '#7EB6D9',
  mistblue: '#A8C5D4',
  ultramarine: '#3b5bdb',
  sage: '#B7C4A8',
  lavender: '#C5B6D4',
  glacier: '#D5E3EA',
  burgundy: '#6B2D3C',
  cloudwhite: '#F7F5F0',
  deserttitanium: '#C2A78A',
  naturaltitanium: '#8E8B86',
  blacktitanium: '#3C3C3C',
  whitetitanium: '#F2F1ED',
  spaceblack: '#1C1C1E',
  spacegray: '#5A5A5E',
  midnight: '#1C2333',
  starlight: '#F5F2E8',
  blush: '#E8B4B8',
  citrus: '#F0C75E',
  indigo: '#3D4F7C',
  pink: '#f9a8d4',
  purple: '#8b5cf6',
  green: '#22c55e',
  red: '#ef4444',
  yellow: '#eab308',
};

const NON_COLOR_TOKENS = new Set([
  'unselect',
  'gallery',
  'model',
  'finish',
  'select',
  'size',
  'color',
  'geo',
  'av',
  'av1',
  'av2',
  'av3',
  'av4',
  'av5',
  'product',
  'products',
  'iphone',
  'ipad',
  'macbook',
  'neo',
  'air',
]);

function titleCaseColor(id: string): string {
  const labels: Record<string, string> = {
    starwhite: 'Starwhite',
    nightsky: 'Nightsky',
    starlight: 'Starlight',
    spaceblack: 'Space Black',
    spacegray: 'Space Gray',
    mistblue: 'Mist Blue',
    sage: 'Sage',
    lavender: 'Lavender',
    black: 'Black',
    white: 'White',
    silver: 'Silver',
    glacier: 'Glacier',
    burgundy: 'Burgundy',
    cloudwhite: 'Cloud White',
    skyblue: 'Sky Blue',
    lightgold: 'Light Gold',
    midnight: 'Midnight',
    blush: 'Blush',
    citrus: 'Citrus',
    indigo: 'Indigo',
  };
  if (labels[id]) return labels[id];
  if (id.endsWith('titanium')) {
    const base = id.replace(/titanium$/, '');
    return `${base.charAt(0).toUpperCase()}${base.slice(1)} Titanium`;
  }
  return id.charAt(0).toUpperCase() + id.slice(1);
}

function filenameFromUrl(url: string): string {
  try {
    const path = decodeURIComponent(new URL(url).pathname);
    return path.split('/').pop() || url;
  } catch {
    return url.split('/').pop() || url;
  }
}

/** Optional size token: 13inch, 15inch, or phone-style 6-3inch. */
const SIZE_PREFIX = '(?:\\d+(?:-\\d+)?inch-)';

function isValidColorId(id: string): boolean {
  return /^[a-z][a-z0-9]*$/.test(id) && !NON_COLOR_TOKENS.has(id);
}

/** Pull finish/color token from Apple-style Cloudinary filenames. */
export function extractColorIdFromUrl(url: string): string | null {
  const file = filenameFromUrl(url).toLowerCase();
  if (file.includes('unselect')) return null;
  if (file.includes('size-select')) return null;

  // finish-select-YYYYMM[-Ninch|-N-Ninch]-{color}
  const finishMatch = file.match(
    new RegExp(`finish-select-\\d{6}-${SIZE_PREFIX}?([a-z0-9]+)(?:_|-|\\.|$)`)
  );
  if (finishMatch && isValidColorId(finishMatch[1])) {
    return finishMatch[1];
  }

  // color-select-YYYYMM-{color} (MacBook Neo) or generic select-
  const colorMatch = file.match(
    new RegExp(
      `(?:color-select|finish-select|(?:^|-)select)-\\d{6}-${SIZE_PREFIX}?([a-z0-9]+)(?:_|-|\\.|$)`
    )
  );
  if (colorMatch && isValidColorId(colorMatch[1])) {
    return colorMatch[1];
  }

  return null;
}

/** e.g. 13inch → 13" ; 6-3inch → 6.3" */
export function extractSizeIdFromUrl(url: string): string | null {
  const file = filenameFromUrl(url).toLowerCase();
  const phone = file.match(/(\d+)-(\d+)inch/);
  if (phone) return `${phone[1]}.${phone[2]}"`;
  const laptop = file.match(/(?:^|[^0-9])(\d{2})inch/);
  if (laptop) return `${laptop[1]}"`;
  return null;
}

/** Keep URLs that match the chosen size, plus size-agnostic / unselect shots. */
export function filterUrlsBySize(
  urls: string[],
  selectedSize: string | null | undefined
): string[] {
  if (!selectedSize) return urls;
  const hasSized = urls.some((u) => /\d+(?:-\d+)?inch/i.test(filenameFromUrl(u)));
  if (!hasSized) return urls;

  const inches = selectedSize.replace(/["']/g, '');
  const inchToken = inches.includes('.')
    ? `${inches.replace('.', '-')}inch`
    : `${inches}inch`;

  const filtered = urls.filter((url) => {
    const file = filenameFromUrl(url).toLowerCase();
    if (file.includes('unselect')) return true;
    if (!/\d+(?:-\d+)?inch/.test(file)) return true;
    return file.includes(inchToken);
  });

  // If no assets for this size (e.g. 15" without photos), fall back to heroes.
  if (!filtered.some((u) => extractColorIdFromUrl(u))) {
    const heroes = urls.filter((u) => {
      const f = filenameFromUrl(u).toLowerCase();
      return f.includes('unselect') || !/\d+(?:-\d+)?inch/.test(f);
    });
    return heroes.length ? heroes : urls;
  }
  return filtered;
}

/** Prefer Black / dark finishes, then a neutral Silver when available. */
const DEFAULT_COLOR_PREFERENCE = [
  'black',
  'spaceblack',
  'blacktitanium',
  'midnight',
  'nightsky',
  'silver',
] as const;

export function buildColorOptions(imageUrls: string[]): ProductColorOption[] {
  const urls = Array.from(new Set(imageUrls.filter(Boolean)));
  const byColor = new Map<string, string[]>();

  for (const url of urls) {
    const colorId = extractColorIdFromUrl(url);
    if (!colorId) continue;
    const list = byColor.get(colorId) || [];
    list.push(url);
    byColor.set(colorId, list);
  }

  const options = [...byColor.entries()].map(([id, colorUrls]) => ({
    id,
    label: titleCaseColor(id),
    swatch: COLOR_SWATCHES[id] || '#94a3b8',
    imageUrls: colorUrls,
  }));

  // Stable order: preferred dark finishes first, then the rest alphabetically.
  return options.sort((a, b) => {
    const ai = DEFAULT_COLOR_PREFERENCE.indexOf(
      a.id as (typeof DEFAULT_COLOR_PREFERENCE)[number]
    );
    const bi = DEFAULT_COLOR_PREFERENCE.indexOf(
      b.id as (typeof DEFAULT_COLOR_PREFERENCE)[number]
    );
    const aRank = ai === -1 ? 100 : ai;
    const bRank = bi === -1 ? 100 : bi;
    if (aRank !== bRank) return aRank - bRank;
    return a.label.localeCompare(b.label);
  });
}

export function defaultColorId(
  colors: Pick<ProductColorOption, 'id'>[]
): string | null {
  if (!colors.length) return null;
  for (const id of DEFAULT_COLOR_PREFERENCE) {
    if (colors.some((c) => c.id === id)) return id;
  }
  return colors[0].id;
}

/** Apple-style hero set: unselect / size shots until the shopper picks a finish. */
export function defaultHeroGallery(urls: string[], fallback: string): string[] {
  const heroes = urls.filter((url) => {
    const file = filenameFromUrl(url).toLowerCase();
    return file.includes('unselect');
  });
  if (heroes.length) return heroes;

  const neutral = urls.filter((url) => !extractColorIdFromUrl(url));
  if (neutral.length) return neutral;

  return fallback ? [fallback] : urls.slice(0, 1);
}

export function resolveProductGallery(
  imageUrl: string,
  imageUrls: string[] | undefined,
  selectedColorId: string | null,
  selectedSize?: string | null
): { colors: ProductColorOption[]; gallery: string[] } {
  const all = Array.from(
    new Set((imageUrls?.length ? imageUrls : [imageUrl]).filter(Boolean))
  );
  // Swatches from the full set so missing size assets still show finish choices.
  const colors = buildColorOptions(all);
  const sized = filterUrlsBySize(all, selectedSize);

  // Nothing chosen yet → keep the product default gallery (not a finish).
  if (!selectedColorId) {
    return {
      colors,
      gallery: defaultHeroGallery(sized.length ? sized : all, imageUrl),
    };
  }

  if (colors.length === 0) {
    return { colors, gallery: sized.length ? sized : all };
  }

  const active = colors.find((c) => c.id === selectedColorId);
  if (!active) {
    return {
      colors,
      gallery: defaultHeroGallery(sized.length ? sized : all, imageUrl),
    };
  }

  const sizedColorUrls = sized.filter((u) => extractColorIdFromUrl(u) === active.id);
  const gallery = sizedColorUrls.length
    ? sizedColorUrls
    : active.imageUrls.length
      ? active.imageUrls
      : defaultHeroGallery(sized.length ? sized : all, imageUrl);

  return { colors, gallery };
}
