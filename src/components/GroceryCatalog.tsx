'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { MapPin, WifiOff, Tag, LayoutGrid, SlidersHorizontal, X } from 'lucide-react';
import { GroceryItem } from '@/types';
import { ZONE_OPTIONS, ZONE_DELIVERY_STATUS } from '@/data/products';
import { PRODUCT_BRANDS, PRODUCT_CATEGORIES } from '@/data/catalogTaxonomy';
import { motion, AnimatePresence } from 'motion/react';
import ProductImage from '@/components/ProductImage';
import ProductDetailsModal from '@/components/ProductDetailsModal';
import CatalogSearchBar from '@/components/CatalogSearchBar';
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
  onAddToast
}: GroceryCatalogProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [aiFilterIds, setAiFilterIds] = useState<string[] | null>(null);
  const [selectedBrand, setSelectedBrand] = useState('All Brands');
  const [selectedCategory, setSelectedCategory] = useState('All Categories');
  const [detailsItem, setDetailsItem] = useState<GroceryItem | null>(null);
  const [onlyBestValue, setOnlyBestValue] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [recognition, setRecognition] = useState<any>(null);
  const [isOffline, setIsOffline] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);

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
    window.addEventListener('pixel-filter-category', onNavCategory);
    return () => window.removeEventListener('pixel-filter-category', onNavCategory);
  }, []);

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

  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    const rec = new SpeechRecognition();
    rec.continuous = false;
    rec.interimResults = false;
    rec.lang = 'en-US';

    rec.onstart = () => {
      setIsListening(true);
      onAddToast('Listening...', 'Speak the product name to search.', 'info');
    };

    rec.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setSearchQuery(transcript);
      onAddToast('Voice Search', `Searching for: "${transcript}"`, 'success');
    };

    rec.onerror = (event: any) => {
      console.error('Speech recognition error:', event.error);
      if (event.error === 'not-allowed') {
        onAddToast('Access Denied', 'Please enable microphone permission to use voice search.', 'warning');
      } else if (event.error !== 'aborted') {
        onAddToast('Search Error', `Voice search error: ${event.error}`, 'warning');
      }
      setIsListening(false);
    };

    rec.onend = () => {
      setIsListening(false);
    };

    setRecognition(rec);
    return () => {
      try {
        rec.abort();
      } catch {
        /* ignore */
      }
      setRecognition(null);
    };
  }, [onAddToast]);

  const handleToggleSpeech = () => {
    if (!recognition) {
      onAddToast('Not Supported', 'Speech recognition is not supported on this browser.', 'warning');
      return;
    }

    if (isListening) {
      recognition.stop();
    } else {
      try {
        recognition.start();
      } catch (err) {
        console.error('Speech recognition failed to start:', err);
      }
    }
  };

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
    'w-full min-h-11 px-2.5 py-2.5 rounded-2xl border border-[#0284c7]/15 dark:border-white/10 bg-white/80 dark:bg-[#121a24] font-medium text-sm text-[#0f172a] dark:text-[#e7eef5] hover:border-[#0284c7]/35 dark:hover:border-white/20 transition-colors';

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

  return (
    <div id="catalog-section" className="space-y-8 scroll-mt-20">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
        <div>
          <h2 className="font-display text-3xl sm:text-4xl font-semibold text-[#0f172a] dark:text-[#e7eef5] tracking-tight">
            Device catalog
          </h2>
          <p className="mt-1 text-sm text-[#64748b] dark:text-[#8a9eb0]">
            Newest models first — mobiles, laptops, and accessories for Yangon delivery.
          </p>
        </div>
        <p className="hidden sm:block text-xs font-medium text-[#64748b] dark:text-[#8a9eb0]">
          {`${filteredProducts.length} ${filteredProducts.length === 1 ? 'item' : 'items'}${
            selectedZone !== 'All Zones' && zoneDeliveryInfo.status === 'delayed'
              ? ` · +${zoneDeliveryInfo.delayMinutes}m delay in ${selectedZone}`
              : ''
          }`}
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

      <div className="flex flex-col gap-3 md:flex-row md:items-start">
        <CatalogSearchBar
          products={products}
          value={searchQuery}
          onChange={setSearchQuery}
          onAiFilter={setAiFilterIds}
          onAddToCart={(item, qty, isSub) => onAddToCart(item, qty, isSub)}
          onOpenProduct={setDetailsItem}
          onAddToast={onAddToast}
          isListening={isListening}
          onToggleSpeech={handleToggleSpeech}
        />

        {/* Mobile: Brand / Category / Filters */}
        <div className="grid grid-cols-[1fr_1fr_auto] gap-2 md:hidden">
          <Select
            id="brand-select-mobile"
            aria-label="Brand"
            value={selectedBrand}
            onChange={setSelectedBrand}
            options={brandOptions}
            size="sm"
            className={selectTriggerClass}
          />
          <Select
            id="category-select-mobile"
            aria-label="Category"
            value={selectedCategory}
            onChange={setSelectedCategory}
            options={categoryOptions}
            size="sm"
            className={selectTriggerClass}
          />
          <button
            type="button"
            id="filters-open-mobile"
            onClick={() => setFiltersOpen(true)}
            className={`relative min-h-11 min-w-11 px-3 rounded-2xl border inline-flex items-center justify-center transition-colors cursor-pointer ${
              sheetFiltersActive
                ? 'border-[#0284c7]/40 bg-[#e0f2fe]/70 text-[#0284c7] dark:border-sky-400/40 dark:bg-sky-500/15 dark:text-sky-300'
                : 'border-[#0284c7]/15 dark:border-white/10 bg-white/80 dark:bg-[#121a24] text-[#0f172a] dark:text-[#e7eef5] hover:border-[#0284c7]/35'
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

        {/* Desktop: Brand / Category / Zone / Best value */}
        <div className="hidden md:flex flex-wrap items-center gap-2">
          <Select
            id="brand-select"
            aria-label="Brand"
            value={selectedBrand}
            onChange={setSelectedBrand}
            options={desktopBrandOptions}
            icon={<Tag className="w-4 h-4 text-[#0ea5e9] shrink-0" />}
            className="min-w-40 px-3.5 py-3 rounded-2xl border border-[#0284c7]/15 dark:border-white/10 bg-white/80 dark:bg-[#121a24] font-medium text-[#0f172a] dark:text-[#e7eef5] hover:border-[#0284c7]/35 dark:hover:border-white/20 transition-colors"
          />

          <Select
            id="category-select"
            aria-label="Category"
            value={selectedCategory}
            onChange={setSelectedCategory}
            options={desktopCategoryOptions}
            icon={<LayoutGrid className="w-4 h-4 text-[#0ea5e9] shrink-0" />}
            className="min-w-44 px-3.5 py-3 rounded-2xl border border-[#0284c7]/15 dark:border-white/10 bg-white/80 dark:bg-[#121a24] font-medium text-[#0f172a] dark:text-[#e7eef5] hover:border-[#0284c7]/35 dark:hover:border-white/20 transition-colors"
          />

          <Select
            id="zone-select"
            aria-label="Delivery zone"
            value={selectedZone}
            onChange={setSelectedZone}
            options={zoneOptions}
            icon={<MapPin className="w-4 h-4 text-[#0ea5e9] shrink-0" />}
            className="min-w-48 px-3.5 py-3 rounded-2xl border border-[#0284c7]/15 dark:border-white/10 bg-white/80 dark:bg-[#121a24] font-medium text-[#0f172a] dark:text-[#e7eef5] hover:border-[#0284c7]/35 dark:hover:border-white/20 transition-colors"
          />

          <button
            id="best-value-toggle"
            type="button"
            onClick={() => setOnlyBestValue(!onlyBestValue)}
            className={`px-3.5 py-3 rounded-2xl text-sm font-medium border transition-colors cursor-pointer ${
              onlyBestValue
                ? 'bg-amber-400 border-amber-400 text-slate-950'
                : 'bg-white/80 dark:bg-[#121a24] border-[#0284c7]/15 dark:border-white/10 text-[#0f172a] dark:text-[#e7eef5]'
            }`}
          >
            Best value
          </button>
        </div>
      </div>

      {/* Mobile clear + count */}
      <div className="flex items-center justify-between gap-3 md:hidden">
        <p className="text-xs font-medium text-[#64748b] dark:text-[#8a9eb0]">
          {`${filteredProducts.length} ${filteredProducts.length === 1 ? 'item' : 'items'}${
            selectedZone !== 'All Zones' && zoneDeliveryInfo.status === 'delayed'
              ? ` · +${zoneDeliveryInfo.delayMinutes}m in ${selectedZone}`
              : ''
          }`}
        </p>
        {filtersActive && (
          <button
            type="button"
            onClick={clearFilters}
            className="text-xs font-semibold text-[#0284c7] dark:text-sky-400 cursor-pointer"
          >
            Clear filters
          </button>
        )}
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
        <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-4 gap-y-8 sm:gap-x-6 sm:gap-y-10">
          {filteredProducts.map((item, index) => {
            const out = item.stock === 0;
            const finishes = buildColorOptions(item.imageUrls?.length ? item.imageUrls : [item.imageUrl]);

            return (
              <motion.button
                key={item.id}
                type="button"
                layout
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  duration: 0.4,
                  delay: Math.min(index * 0.035, 0.25),
                  ease: [0.22, 1, 0.36, 1],
                }}
                whileHover={{ y: -3, transition: { duration: 0.2 } }}
                onClick={() => setDetailsItem(item)}
                aria-label={`View details for ${item.name}`}
                className="group flex flex-col text-left cursor-pointer"
              >
                <div className="relative aspect-[4/5] overflow-hidden rounded-2xl bg-[#e8f0f6] dark:bg-[#0B1220]">
                  <ProductImage
                    src={item.imageUrl}
                    alt={item.name}
                    className={`h-full w-full object-contain p-4 sm:p-5 transition-transform duration-500 ease-out group-hover:scale-[1.03] ${
                      out ? 'opacity-45' : ''
                    }`}
                  />
                  {out && (
                    <span className="absolute inset-0 flex items-center justify-center">
                      <span className="rounded-full bg-[#0B1220]/75 px-3 py-1 text-[10px] font-semibold uppercase tracking-wide text-white">
                        Sold out
                      </span>
                    </span>
                  )}
                </div>

                <div className="mt-3 flex flex-1 flex-col gap-1.5 px-0.5">
                  <h3 className="font-display font-semibold text-[14px] sm:text-[15px] text-[#0f172a] dark:text-[#e7eef5] leading-snug line-clamp-2">
                    {item.name}
                  </h3>
                  <p
                    className={`font-semibold tabular-nums leading-none ${
                      out
                        ? 'text-[#94a3b8] dark:text-[#64748b]'
                        : 'text-[#0f172a] dark:text-[#e7eef5]'
                    }`}
                  >
                    <span className="text-base sm:text-lg tracking-tight">
                      {item.price.toLocaleString()}
                    </span>
                    <span className="ml-1 text-[10px] font-medium text-[#64748b]">MMK</span>
                  </p>
                  {finishes.length > 1 && (
                    <div className="mt-1 flex flex-wrap items-center gap-1.5" aria-hidden>
                      {finishes.slice(0, 6).map((color) => (
                        <span
                          key={color.id}
                          className="h-2.5 w-2.5 rounded-full border border-black/10 dark:border-white/20"
                          style={{ backgroundColor: color.swatch }}
                          title={color.label}
                        />
                      ))}
                      {finishes.length > 6 && (
                        <span className="text-[10px] font-medium text-[#64748b]">
                          +{finishes.length - 6}
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
