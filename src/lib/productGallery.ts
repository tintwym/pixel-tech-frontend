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
  blue: '#3b82f6',
  ultramarine: '#3b5bdb',
  deserttitanium: '#C2A78A',
  naturaltitanium: '#8E8B86',
  blacktitanium: '#3C3C3C',
  whitetitanium: '#F2F1ED',
  spaceblack: '#1C1C1E',
  spacegray: '#5A5A5E',
  midnight: '#191970',
  starlight: '#F5F2E8',
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
]);

function titleCaseColor(id: string): string {
  if (id === 'starwhite') return 'Starwhite';
  if (id === 'nightsky') return 'Nightsky';
  if (id === 'starlight') return 'Starlight';
  if (id === 'spaceblack') return 'Space Black';
  if (id === 'spacegray') return 'Space Gray';
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

/** Pull finish/color token from Apple-style Cloudinary filenames. */
export function extractColorIdFromUrl(url: string): string | null {
  const file = filenameFromUrl(url).toLowerCase();
  if (file.includes('unselect')) return null;

  const selectMatch = file.match(/finish-select-\d{6}-([a-z0-9]+)(?:_|-|\.|$)/);
  if (selectMatch && !NON_COLOR_TOKENS.has(selectMatch[1])) {
    return selectMatch[1];
  }

  const genericSelect = file.match(/(?:^|-)select-\d{6}-([a-z0-9]+)(?:_|-|\.|$)/);
  if (genericSelect && !NON_COLOR_TOKENS.has(genericSelect[1])) {
    return genericSelect[1];
  }

  return null;
}

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

  return [...byColor.entries()].map(([id, colorUrls]) => ({
    id,
    label: titleCaseColor(id),
    swatch: COLOR_SWATCHES[id] || '#94a3b8',
    imageUrls: colorUrls,
  }));
}

export function resolveProductGallery(
  imageUrl: string,
  imageUrls: string[] | undefined,
  selectedColorId: string | null
): { colors: ProductColorOption[]; gallery: string[] } {
  const all = Array.from(
    new Set((imageUrls?.length ? imageUrls : [imageUrl]).filter(Boolean))
  );
  const colors = buildColorOptions(all);

  if (colors.length === 0) {
    return { colors, gallery: all };
  }

  const active =
    colors.find((c) => c.id === selectedColorId) || colors[0];
  return { colors, gallery: active.imageUrls.length ? active.imageUrls : all };
}
