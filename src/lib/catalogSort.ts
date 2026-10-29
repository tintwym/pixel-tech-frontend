/**
 * Rank devices so the newest flagships surface first.
 * Bump logic here (or set GroceryItem.catalogPriority) when new models land.
 */
export function inferCatalogPriority(name: string): number {
  const n = name.toLowerCase();
  let score = 0;

  // Foldable / special releases
  if (/\bduo\b/.test(n)) score = Math.max(score, 10_000);
  // iPhone Air (no generation digit in the name)
  if (/iphone\s*air/.test(n)) score = Math.max(score, 8355);

  const iphone = n.match(/iphone\s*(\d+)/);
  if (iphone) {
    const gen = Number(iphone[1]);
    const tier = n.includes('pro max') ? 3 : n.includes('pro') ? 2 : 1;
    score = Math.max(score, 8000 + gen * 20 + tier);
  }

  const galaxy = n.match(/galaxy\s*s(\d+)/) || n.match(/\bs(\d+)\s*ultra\b/);
  if (galaxy) {
    const gen = Number(galaxy[1]);
    const tier = n.includes('ultra') ? 3 : n.includes('plus') ? 2 : 1;
    score = Math.max(score, 7000 + gen * 20 + tier);
  }

  if (n.includes('macbook')) {
    if (/\bneo\b/.test(n)) score = Math.max(score, 6250);
    else if (/\bair\b/.test(n)) score = Math.max(score, 6200);
    else {
      const chip = n.match(/\bm(\d+)/);
      const gen = chip ? Number(chip[1]) : 1;
      score = Math.max(score, 6000 + gen * 20 + (n.includes('pro') ? 2 : 1));
    }
  }

  if (n.includes('ipad')) {
    const chip = n.match(/\bm(\d+)/);
    const gen = chip ? Number(chip[1]) : 1;
    score = Math.max(score, 5000 + gen * 20 + (n.includes('pro') ? 2 : 1));
  }

  const tab = n.match(/tab\s*s(\d+)/);
  if (tab) {
    score = Math.max(score, 4500 + Number(tab[1]) * 20);
  }

  if (n.includes('watch')) {
    const series = n.match(/series\s*(\d+)/);
    const gen = series ? Number(series[1]) : 1;
    score = Math.max(score, 4000 + gen * 20);
  }

  if (n.includes('airpods')) {
    const pro = n.match(/pro\s*(\d+)/);
    const gen = pro ? Number(pro[1]) : 1;
    score = Math.max(score, 3000 + gen * 20);
  }

  if (n.includes('wh-1000') || (n.includes('sony') && n.includes('xm'))) {
    const xm = n.match(/xm(\d+)/);
    score = Math.max(score, 2800 + (xm ? Number(xm[1]) * 10 : 0));
  }

  if (n.includes('rog') || n.includes('asus')) {
    score = Math.max(score, 5500);
  }

  return score;
}

export function catalogPriorityOf(item: { name: string; catalogPriority?: number }): number {
  return item.catalogPriority ?? inferCatalogPriority(item.name);
}

/** Newest / highest-priority models first. Stable by name when ranks tie. */
export function sortCatalogNewestFirst<T extends { name: string; catalogPriority?: number }>(
  items: T[]
): T[] {
  return [...items].sort((a, b) => {
    const diff = catalogPriorityOf(b) - catalogPriorityOf(a);
    if (diff !== 0) return diff;
    return a.name.localeCompare(b.name);
  });
}
