/** Device-focused categories for Pixel Tech storefront + admin. */
export const PRODUCT_CATEGORIES = [
  'Smartphones',
  'Tablets',
  'Laptops',
  'Desktops / PCs',
  'Audio / Headphones',
  'Smartwatches / Wearables',
  'Accessories',
] as const;

export type ProductCategory = (typeof PRODUCT_CATEGORIES)[number];

/** Brands across phones, laptops, desktops, audio, etc. */
export const PRODUCT_BRANDS = [
  'Apple',
  'Samsung',
  'Sony',
  'ASUS',
  'Google',
  'Dell',
  'HP',
  'Lenovo',
  'Microsoft',
  'Logitech',
  'Anker',
  'Other',
] as const;

export type ProductBrand = (typeof PRODUCT_BRANDS)[number];

export function inferBrandFromName(name: string): string {
  const n = name.toLowerCase();
  if (n.includes('iphone') || n.includes('ipad') || n.includes('macbook') || n.includes('airpods') || n.includes('apple watch')) {
    return 'Apple';
  }
  if (n.includes('galaxy') || n.includes('samsung')) return 'Samsung';
  if (n.includes('sony') || n.includes('wh-1000')) return 'Sony';
  if (n.includes('asus') || n.includes('rog')) return 'ASUS';
  if (n.includes('pixel') || n.includes('google')) return 'Google';
  if (n.includes('dell') || n.includes('xps') || n.includes('alienware')) return 'Dell';
  if (n.includes('hp ') || n.includes('hewlett')) return 'HP';
  if (n.includes('lenovo') || n.includes('thinkpad') || n.includes('ideapad')) return 'Lenovo';
  if (n.includes('surface') || n.includes('xbox')) return 'Microsoft';
  if (n.includes('logitech')) return 'Logitech';
  if (n.includes('anker')) return 'Anker';
  return 'Other';
}

export function inferCategoryFromName(name: string, legacyCategory?: string): string {
  const n = name.toLowerCase();
  if (n.includes('iphone') || n.includes('galaxy s') || (n.includes('pixel') && n.includes('phone'))) {
    return 'Smartphones';
  }
  if (n.includes('ipad') || n.includes('tab ') || n.includes('tablet')) return 'Tablets';
  if (n.includes('macbook') || n.includes('laptop') || n.includes('rog') || n.includes('notebook')) {
    return 'Laptops';
  }
  if (n.includes('desktop') || n.includes('imac') || n.includes('mac mini') || n.includes('pc tower')) {
    return 'Desktops / PCs';
  }
  if (n.includes('airpods') || n.includes('headphone') || n.includes('wh-1000') || n.includes('earbuds') || n.includes('buds')) {
    return 'Audio / Headphones';
  }
  if (n.includes('watch') || n.includes('wearable') || n.includes('band')) {
    return 'Smartwatches / Wearables';
  }

  // Map older broad labels if present on local fallback data.
  switch (legacyCategory) {
    case 'Mobile':
      return 'Smartphones';
    case 'Laptop':
      return 'Laptops';
    case 'Audio':
      return 'Audio / Headphones';
    case 'Wearables':
      return 'Smartwatches / Wearables';
    case 'Electronics':
      return n.includes('tab') || n.includes('ipad') ? 'Tablets' : 'Accessories';
    default:
      return legacyCategory && PRODUCT_CATEGORIES.includes(legacyCategory as ProductCategory)
        ? legacyCategory
        : 'Accessories';
  }
}
