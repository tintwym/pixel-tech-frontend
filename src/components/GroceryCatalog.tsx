'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { MapPin, WifiOff, Tag, LayoutGrid, SlidersHorizontal, X } from 'lucide-react';
import { GroceryItem } from '@/types';
import { ZONE_OPTIONS, ZONE_DELIVERY_STATUS } from '@/data/products';
import { PRODUCT_BRANDS, PRODUCT_CATEGORIES } from '@/data/catalogTaxonomy';
import { motion, AnimatePresence } from 'motion/react';
import ProductImage from '@/components/ProductImage';
import ProductDetailsModal from '@/components/ProductDetailsModal';
import Select from '@/components/Select';
import { buildColorOptions } from '@/lib/productGallery';

interface GroceryCatalogProps {
  products: GroceryItem[];
  onAddToCart: (
    item: GroceryItem,
    qty: number,
    isSub: boolean,
    freq?: 'weekly' | 'biweekly' | 'monthly',
    selectedColor?: string,
    selectedStorage?: string
  ) => boolean | void;
  selectedZone: string;
  setSelectedZone: (zone: string) => void;
  onAddToast: (title: string, msg: string, type: 'success' | 'warning' | 'info') => void;
  /** Controlled from showroom header — search is owned by the sticky nav. */
  searchQuery: string;
  setSearchQuery: (value: string) => void;
  aiFilterIds: string[] | null;
  setAiFilterIds: (ids: string[] | null) => void;
  selectedCategory: string;
  setSelectedCategory: (category: string) => void;
}

export interface BestValueInfo {
  unitPrice: number;
  label: string;
  unitType: 'mass' | 'volume' | 'count';
}

export function calculateUnitPrice(price: number, unitStr: string): BestValueInfo {
  const lower = unitStr.toLowerCase().trim();

  // Mass in kg e.g. "5kg", "1.2kg", "1kg"
  const kgMatch = lower.match(/^([\d.]+)\s*kg$/);
  if (kgMatch) {
    const kg = parseFloat(kgMatch[1]);
    if (kg > 0) {
      const perKg = Math.round(price / kg);
      return { unitPrice: perKg, label: `${perKg.toLocaleString()} MMK/kg`, unitType: 'mass' };
    }
  }

  // Mass in g e.g. "500g", "250g", "400g"
  const gMatch = lower.match(/^([\d.]+)\s*g$/);
  if (gMatch) {
    const g = parseFloat(gMatch[1]);
    if (g > 0) {
      const perKg = Math.round(price / (g / 1000));
      return { unitPrice: perKg, label: `${perKg.toLocaleString()} MMK/kg`, unitType: 'mass' };
    }
  }

  // Volume in Liter e.g. "1 liter", "1l"
  const literMatch = lower.match(/^([\d.]+)\s*(liter|l)$/);
  if (literMatch) {
    const l = parseFloat(literMatch[1]);
    if (l > 0) {
      const perL = Math.round(price / l);
      return { unitPrice: perL, label: `${perL.toLocaleString()} MMK/L`, unitType: 'volume' };
    }
  }

  // Volume in ml e.g. "500ml", "250ml"
  const mlMatch = lower.match(/^([\d.]+)\s*ml$/);
  if (mlMatch) {
    const ml = parseFloat(mlMatch[1]);
    if (ml > 0) {
      const perL = Math.round(price / (ml / 1000));
      return { unitPrice: perL, label: `${perL.toLocaleString()} MMK/L`, unitType: 'volume' };
    }
  }

  return { unitPrice: price, label: `${price.toLocaleString()} MMK/unit`, unitType: 'count' };
}

export default function GroceryCatalog({
  products,
  onAddToCart,
  selectedZone,
  setSelectedZone,
  onAddToast,
  searchQuery,
  setSearchQuery,
  aiFilterIds,
  setAiFilterIds,
  selectedCategory,
  setSelectedCategory,
}: GroceryCatalogProps) {
  const [selectedBrand, setSelectedBrand] = useState('All Brands');
  const [detailsItem, setDetailsItem] = useState<GroceryItem | null>(null);
  const [onlyBestValue, setOnlyBestValue] = useState(false);
  const [isOffline, setIsOffline] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);
  // Keep deep-link slug until the live catalog can resolve apiId matches (don't wipe URL early).
  const [pendingDeepLink, setPendingDeepLink] = useState<string | null>(() => {
    if (typeof window === 'undefined') return null;
    return new URLSearchParams(window.location.search).get('product');
  });

  // Deep link: /?product=… or /product/[id] → open matching product details.
  useEffect(() => {
    if (!pendingDeepLink || products.length === 0) return;
    const slug = pendingDeepLink;
    const match = products.find(
      (p) =>
        p.id === slug ||
        p.apiId === slug ||
        p.name.toLowerCase().replace(/\s+/g, '-') === slug.toLowerCase()
    );
    if (match) {
      setDetailsItem(match);
      setPendingDeepLink(null);
      return;
    }
    // Wait until at least one API-backed row exists before giving up on uuid links.
    const catalogReady = products.some((p) => Boolean(p.apiId));
    if (catalogReady) setPendingDeepLink(null);
  }, [products, pendingDeepLink]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const url = new URL(window.location.href);
    if (detailsItem) {
      const key = detailsItem.apiId || detailsItem.id;
      if (url.searchParams.get('product') !== key) {
        url.searchParams.set('product', key);
        window.history.replaceState({}, '', `${url.pathname}?${url.searchParams.toString()}`);
      }
      return;
    }
    // Don't strip ?product= while a deep link is still resolving against the catalog.
    if (pendingDeepLink) return;
    if (url.searchParams.has('product')) {
      url.searchParams.delete('product');
      const qs = url.searchParams.toString();
      window.history.replaceState({}, '', qs ? `${url.pathname}?${qs}` : url.pathname);
    }
  }, [detailsItem, pendingDeepLink]);

  useEffect(() => {
    if (!filtersOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setFiltersOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener('keydown', onKey);
    };
  }, [filtersOpen]);

  useEffect(() => {
    const onNavCategory = (event: Event) => {
      const category = (event as CustomEvent<string>).detail;
      if (!category) return;
      setSelectedCategory(category);
    };
    const onOpenProduct = (event: Event) => {
      const item = (event as CustomEvent<GroceryItem>).detail;
      if (item?.id) setDetailsItem(item);
    };
    window.addEventListener('pixel-filter-category', onNavCategory);
    window.addEventListener('pixel-open-product', onOpenProduct);
    return () => {
      window.removeEventListener('pixel-filter-category', onNavCategory);
      window.removeEventListener('pixel-open-product', onOpenProduct);
    };
  }, [setSelectedCategory]);

  // Best value = lowest unit price within the same category (not global unit-type)
  const bestValueMap = useMemo(() => {
    const minPriceCategory: { [cat: string]: number } = {};
    const map: { [itemId: string]: { unitPrice: number; label: string; isBestValue: boolean } } = {};

    products.forEach(item => {
      const info = calculateUnitPrice(item.price, item.unit);
      if (!(item.category in minPriceCategory) || info.unitPrice < minPriceCategory[item.category]) {
        minPriceCategory[item.category] = info.unitPrice;
      }
    });

    products.forEach(item => {
      const info = calculateUnitPrice(item.price, item.unit);
      map[item.id] = {
        unitPrice: info.unitPrice,
        label: info.label,
        isBestValue: info.unitPrice === minPriceCategory[item.category]
      };
    });

    return map;
  }, [products]);

  useEffect(() => {
    // Determine initial online/offline state
    if (typeof window !== 'undefined' && window.navigator) {
      setIsOffline(!window.navigator.onLine);
    }

    const handleOnline = () => {
      setIsOffline(false);
      onAddToast('Online Mode', 'Encrypted connection re-established. Syncing active inventories.', 'success');
    };

    const handleOffline = () => {
      setIsOffline(true);
      onAddToast('Offline Mode', 'Your network is offline. Switched to local offline cache.', 'warning');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [onAddToast]);

  const availableBrands = useMemo(() => {
    const present = new Set(products.map((p) => p.brand).filter(Boolean));
    return PRODUCT_BRANDS.filter((b) => present.has(b));
  }, [products]);

  const availableCategories = useMemo(() => {
    const present = new Set(products.map((p) => p.category).filter(Boolean));
    return PRODUCT_CATEGORIES.filter((c) => present.has(c));
  }, [products]);

  const filteredProducts = useMemo(() => {
    return products.filter(item => {
      const q = searchQuery.toLowerCase();
      const matchesAi =
        aiFilterIds === null || aiFilterIds.includes(item.id);

      // When AI pinned matches, skip text filter so the grid mirrors AI results.
      const matchesSearch =
        aiFilterIds !== null
          ? true
          : !q ||
            item.name.toLowerCase().includes(q) ||
            item.description.toLowerCase().includes(q) ||
            item.category.toLowerCase().includes(q) ||
            item.brand.toLowerCase().includes(q);

      const matchesZone = selectedZone === 'All Zones' ||
                          item.availabilityZone === 'All Zones' ||
                          item.availabilityZone === selectedZone;

      const matchesBrand =
        selectedBrand === 'All Brands' || item.brand === selectedBrand;

      const matchesCategory =
        selectedCategory === 'All Categories' || item.category === selectedCategory;

      const matchesBestValue = !onlyBestValue || bestValueMap[item.id]?.isBestValue;

      return (
        matchesAi &&
        matchesSearch &&
        matchesZone &&
        matchesBrand &&
        matchesCategory &&
        matchesBestValue
      );
    });
  }, [
    products,
    searchQuery,
    aiFilterIds,
    selectedZone,
    selectedBrand,
    selectedCategory,
    onlyBestValue,
    bestValueMap,
  ]);

  const zoneDeliveryInfo = ZONE_DELIVERY_STATUS[selectedZone] || ZONE_DELIVERY_STATUS['All Zones'];

  const sheetFiltersActive = selectedZone !== 'All Zones' || onlyBestValue;
  const filtersActive =
    selectedBrand !== 'All Brands' ||
    selectedCategory !== 'All Categories' ||
    sheetFiltersActive ||
    aiFilterIds !== null ||
    searchQuery.trim().length > 0;

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedBrand('All Brands');
    setSelectedCategory('All Categories');
    setSelectedZone('All Zones');
    setOnlyBestValue(false);
    setAiFilterIds(null);
  };

  const selectTriggerClass =
    'w-full min-h-11 px-2.5 py-2.5 rounded-xl border border-[#0284c7]/12 dark:border-white/10 bg-white dark:bg-[#121a24] font-medium text-sm text-[#0f172a] dark:text-[#e7eef5] hover:border-[#0284c7]/30 dark:hover:border-white/20 transition-colors';

  const brandOptions = [
    { value: 'All Brands', label: 'Brand' },
    ...availableBrands.map((brand) => ({ value: brand, label: brand })),
  ];
  const categoryOptions = [
    { value: 'All Categories', label: 'Category' },
    ...availableCategories.map((category) => ({
      value: category,
      label: category,
    })),
  ];
  const desktopBrandOptions = [
    { value: 'All Brands', label: 'All brands' },
    ...availableBrands.map((brand) => ({ value: brand, label: brand })),
  ];
  const desktopCategoryOptions = [
    { value: 'All Categories', label: 'All categories' },
    ...availableCategories.map((category) => ({
      value: category,
      label: category,
    })),
  ];
  const zoneOptions = ZONE_OPTIONS.map((zone) => ({
    value: zone,
    label: zone,
    description: ZONE_DELIVERY_STATUS[zone]?.title,
  }));

  const resultCountLabel = `${filteredProducts.length} ${
    filteredProducts.length === 1 ? 'item' : 'items'
  }${
    selectedZone !== 'All Zones' && zoneDeliveryInfo.status === 'delayed'
      ? ` · +${zoneDeliveryInfo.delayMinutes}m in ${selectedZone}`
      : ''
  }`;

  const toolbarSelectClass =
    'min-w-[9.5rem] px-3 py-2.5 rounded-xl border border-[#0284c7]/12 dark:border-white/10 bg-white dark:bg-[#121a24] text-sm font-medium text-[#0f172a] dark:text-[#e7eef5] hover:border-[#0284c7]/30 dark:hover:border-white/20 transition-colors';

  return (
    <div id="catalog-section" className="space-y-6 scroll-mt-28 md:scroll-mt-36">
      <div>
        <h2 className="font-display text-3xl sm:text-4xl font-semibold text-[#0f172a] dark:text-[#e7eef5] tracking-tight">
          Shop all
        </h2>
        <p className="mt-1 text-sm text-[#64748b] dark:text-[#8a9eb0]">
          Newest first · mobiles, laptops &amp; accessories for Yangon delivery.
        </p>
      </div>

      <AnimatePresence>
        {isOffline && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="flex items-center gap-3 text-sm text-[#8a5a2b] bg-[#f5e6d3]/80 dark:bg-[#2a2018] px-4 py-3 rounded-2xl border border-[#c45c26]/20">
              <WifiOff className="w-4 h-4 shrink-0" />
              You&apos;re offline — reconnect to add items and checkout.
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Showroom filter toolbar */}
      <div className="rounded-2xl border border-[#0284c7]/10 dark:border-white/8 bg-white/55 dark:bg-[#121a24]/55 backdrop-blur-sm px-3 py-3 sm:px-4">
        {/* Mobile: Brand primary · Category · more filters */}
        <div className="grid grid-cols-[1.2fr_1fr_auto] gap-2 md:hidden">
          <Select
            id="brand-select-mobile"
            aria-label="Brand"
            value={selectedBrand}
            onChange={setSelectedBrand}
            options={brandOptions}
            size="sm"
            icon={<Tag className="w-3.5 h-3.5 text-[#0284c7] shrink-0" />}
            className={selectTriggerClass}
          />
          <Select
            id="category-select-mobile"
            aria-label="Category"
            value={selectedCategory}
            onChange={setSelectedCategory}
            options={categoryOptions}
            size="sm"
            className={`${selectTriggerClass} text-[#64748b] dark:text-[#94a3b8]`}
          />
          <button
            type="button"
            id="filters-open-mobile"
            onClick={() => setFiltersOpen(true)}
            className={`relative min-h-11 min-w-11 px-3 rounded-xl border inline-flex items-center justify-center transition-colors cursor-pointer ${
              sheetFiltersActive
                ? 'border-[#0284c7]/40 bg-[#e0f2fe]/70 text-[#0284c7] dark:border-sky-400/40 dark:bg-sky-500/15 dark:text-sky-300'
                : 'border-[#0284c7]/12 dark:border-white/10 bg-white dark:bg-[#121a24] text-[#0f172a] dark:text-[#e7eef5] hover:border-[#0284c7]/30'
            }`}
            aria-label="Filters"
            aria-haspopup="dialog"
            aria-expanded={filtersOpen}
          >
            <SlidersHorizontal className="w-4 h-4 shrink-0" />
            {sheetFiltersActive && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[#0284c7] dark:bg-sky-400" aria-hidden />
            )}
          </button>
        </div>

        {/* Desktop: full-width Brand · Category · Zone · Best value · count/clear */}
        <div className="hidden md:flex flex-wrap items-center gap-2">
          <Select
            id="brand-select"
            aria-label="Brand"
            value={selectedBrand}
            onChange={setSelectedBrand}
            options={desktopBrandOptions}
            icon={<Tag className="w-4 h-4 text-[#0284c7] shrink-0" />}
            className={`${toolbarSelectClass} min-w-[11rem] font-semibold`}
          />

          <Select
            id="category-select"
            aria-label="Category"
            value={selectedCategory}
            onChange={setSelectedCategory}
            options={desktopCategoryOptions}
            icon={<LayoutGrid className="w-4 h-4 text-[#64748b] shrink-0" />}
            className={`${toolbarSelectClass} min-w-[11rem] text-[#475569] dark:text-[#94a3b8]`}
          />

          <Select
            id="zone-select"
            aria-label="Delivery zone"
            value={selectedZone}
            onChange={setSelectedZone}
            options={zoneOptions}
            icon={<MapPin className="w-4 h-4 text-[#64748b] shrink-0" />}
            className={`${toolbarSelectClass} min-w-[10.5rem] text-[#475569] dark:text-[#94a3b8]`}
          />

          <button
            id="best-value-toggle"
            type="button"
            onClick={() => setOnlyBestValue(!onlyBestValue)}
            className={`px-3.5 py-2.5 rounded-xl text-sm font-medium border transition-colors cursor-pointer ${
              onlyBestValue
                ? 'bg-amber-400 border-amber-400 text-slate-950'
                : 'bg-transparent border-[#0284c7]/12 dark:border-white/10 text-[#475569] dark:text-[#94a3b8] hover:border-[#0284c7]/30 hover:text-[#0f172a] dark:hover:text-[#e7eef5]'
            }`}
          >
            Best value
          </button>

          <div className="ml-auto flex items-center gap-3 pl-2">
            <p className="text-xs font-medium tabular-nums text-[#64748b] dark:text-[#8a9eb0]">
              {resultCountLabel}
            </p>
            {filtersActive && (
              <button
                type="button"
                onClick={clearFilters}
                className="text-xs font-semibold text-[#0284c7] dark:text-sky-400 hover:underline cursor-pointer"
              >
                Clear
              </button>
            )}
          </div>
        </div>

        {/* Mobile count + clear */}
        <div className="mt-2.5 flex items-center justify-between gap-3 md:hidden">
          <p className="text-xs font-medium tabular-nums text-[#64748b] dark:text-[#8a9eb0]">
            {resultCountLabel}
          </p>
          {filtersActive && (
            <button
              type="button"
              onClick={clearFilters}
              className="text-xs font-semibold text-[#0284c7] dark:text-sky-400 cursor-pointer"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Mobile Filters sheet — Zone + Best value */}
      <AnimatePresence>
        {filtersOpen && (
          <motion.div
            className="md:hidden fixed inset-0 z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <button
              type="button"
              className="absolute inset-0 bg-[#0B1220]/45 backdrop-blur-[2px] cursor-pointer"
              aria-label="Close filters"
              onClick={() => setFiltersOpen(false)}
            />
            <motion.div
              role="dialog"
              aria-modal="true"
              aria-labelledby="mobile-filters-title"
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 320 }}
              className="absolute inset-x-0 bottom-0 rounded-t-3xl border border-[#0284c7]/15 dark:border-white/10 bg-[#eef4f8] dark:bg-[#0B1220] shadow-market px-4 pt-3 pb-[max(1.5rem,calc(env(safe-area-inset-bottom)+0.75rem))]"
            >
              <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-[#0284c7]/25 dark:bg-white/20" aria-hidden />
              <div className="flex items-center justify-between gap-3 mb-4">
                <h3
                  id="mobile-filters-title"
                  className="font-display text-lg font-semibold text-[#0f172a] dark:text-[#e7eef5]"
                >
                  Filters
                </h3>
                <button
                  type="button"
                  onClick={() => setFiltersOpen(false)}
                  className="p-2 rounded-xl text-[#64748b] hover:bg-white/70 dark:hover:bg-white/10 cursor-pointer"
                  aria-label="Close"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <label htmlFor="zone-select-mobile" className="text-xs font-semibold uppercase tracking-wide text-[#64748b]">
                    Delivery zone
                  </label>
                  <Select
                    id="zone-select-mobile"
                    aria-label="Delivery zone"
                    value={selectedZone}
                    onChange={setSelectedZone}
                    options={zoneOptions}
                    icon={<MapPin className="w-4 h-4 text-[#0ea5e9] shrink-0" />}
                    className={selectTriggerClass}
                  />
                  <p className="text-xs text-[#64748b] dark:text-[#8a9eb0]">
                    {zoneDeliveryInfo.title}
                    {zoneDeliveryInfo.status === 'delayed'
                      ? ` · +${zoneDeliveryInfo.delayMinutes}m delay`
                      : ''}
                  </p>
                </div>

                <div className="flex items-center justify-between gap-3 rounded-2xl border border-[#0284c7]/15 dark:border-white/10 bg-white/80 dark:bg-[#121a24] px-3.5 py-3">
                  <div>
                    <p className="text-sm font-semibold text-[#0f172a] dark:text-[#e7eef5]">Best value</p>
                    <p className="text-xs text-[#64748b] dark:text-[#8a9eb0]">
                      Lowest unit price in each category
                    </p>
                  </div>
                  <button
                    id="best-value-toggle-mobile"
                    type="button"
                    role="switch"
                    aria-checked={onlyBestValue}
                    onClick={() => setOnlyBestValue(!onlyBestValue)}
                    className={`relative h-7 w-12 rounded-full transition-colors cursor-pointer ${
                      onlyBestValue ? 'bg-amber-400' : 'bg-[#cbd5e1] dark:bg-[#334155]'
                    }`}
                  >
                    <span
                      className={`absolute top-0.5 left-0.5 h-6 w-6 rounded-full bg-white shadow transition-transform ${
                        onlyBestValue ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>
              </div>

              <div className="mt-5 flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedZone('All Zones');
                    setOnlyBestValue(false);
                  }}
                  className="flex-1 min-h-11 rounded-2xl border border-[#0284c7]/15 dark:border-white/10 text-sm font-semibold text-[#0f172a] dark:text-[#e7eef5] cursor-pointer"
                >
                  Reset
                </button>
                <button
                  type="button"
                  onClick={() => setFiltersOpen(false)}
                  className="flex-1 min-h-11 rounded-2xl bg-[#0284c7] hover:bg-[#0ea5e9] text-white text-sm font-semibold cursor-pointer transition-colors"
                >
                  Done
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {filteredProducts.length === 0 ? (
        <div className="py-16 text-center">
          <p className="font-display text-lg font-semibold text-[#0f172a] dark:text-[#e7eef5]">
            Nothing matches
          </p>
          <p className="mt-1 text-sm text-[#64748b]">Try another search or clear filters.</p>
          {filtersActive && (
            <button
              type="button"
              onClick={clearFilters}
              className="mt-4 text-sm font-semibold text-[#0284c7] dark:text-sky-400 cursor-pointer"
            >
              Clear filters
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-5 gap-y-10 sm:gap-x-8 sm:gap-y-12">
          {filteredProducts.map((item, index) => {
            const out = item.stock === 0;
            const finishes = buildColorOptions(item.imageUrls?.length ? item.imageUrls : [item.imageUrl]);

            return (
              <motion.button
                key={item.id}
                type="button"
                layout
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  duration: 0.35,
                  delay: Math.min(index * 0.03, 0.2),
                  ease: [0.22, 1, 0.36, 1],
                }}
                onClick={() => setDetailsItem(item)}
                aria-label={`View details for ${item.name}`}
                className="group flex flex-col text-left cursor-pointer"
              >
                <div className="relative aspect-square overflow-hidden rounded-[1.25rem] bg-[#f3f5f7] dark:bg-[#101820] ring-1 ring-black/[0.04] dark:ring-white/[0.06]">
                  <ProductImage
                    src={item.imageUrl}
                    alt={item.name}
                    className={`absolute inset-0 h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.04] ${
                      out ? 'opacity-40' : ''
                    }`}
                  />
                  {out && (
                    <span className="absolute inset-0 flex items-center justify-center bg-white/20 dark:bg-black/20">
                      <span className="rounded-full bg-[#0f172a]/80 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.06em] text-white">
                        Sold out
                      </span>
                    </span>
                  )}
                </div>

                <div className="mt-3.5 flex flex-1 flex-col gap-1">
                  <h3 className="font-sans text-[13px] sm:text-sm font-medium text-[#0f172a] dark:text-[#e7eef5] leading-snug line-clamp-2 tracking-[-0.01em]">
                    {item.name}
                  </h3>
                  <p
                    className={`tabular-nums leading-none ${
                      out
                        ? 'text-[#94a3b8] dark:text-[#64748b]'
                        : 'text-[#334155] dark:text-[#cbd5e1]'
                    }`}
                  >
                    <span className="text-sm sm:text-[15px] font-semibold tracking-tight">
                      {item.price.toLocaleString()}
                    </span>
                    <span className="ml-1 text-[10px] font-medium text-[#94a3b8]">MMK</span>
                  </p>
                  {finishes.length > 1 && (
                    <div className="mt-1.5 flex flex-wrap items-center gap-1.5" aria-hidden>
                      {finishes.slice(0, 5).map((color) => (
                        <span
                          key={color.id}
                          className="h-2 w-2 rounded-full ring-1 ring-black/10 dark:ring-white/20"
                          style={{ backgroundColor: color.swatch }}
                          title={color.label}
                        />
                      ))}
                      {finishes.length > 5 && (
                        <span className="text-[10px] font-medium text-[#94a3b8]">
                          +{finishes.length - 5}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </motion.button>
            );
          })}
        </div>
      )}

      <ProductDetailsModal
        item={detailsItem}
        isOpen={!!detailsItem}
        onClose={() => setDetailsItem(null)}
        onAddToCart={onAddToCart}
        onAddToast={onAddToast}
      />
    </div>
  );
}
