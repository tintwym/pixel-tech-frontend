'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { Search, ShoppingCart, MapPin, Mic, TrendingUp, WifiOff, Star } from 'lucide-react';
import { GroceryItem, FeaturesRestriction } from '@/types';
import { DIETARY_OPTIONS, ZONE_OPTIONS, ZONE_DELIVERY_STATUS } from '@/data/products';
import { motion, AnimatePresence } from 'motion/react';
import PriceSparkline from '@/components/PriceSparkline';

interface GroceryCatalogProps {
  products: GroceryItem[];
  onAddToCart: (item: GroceryItem, qty: number, isSub: boolean, freq?: 'weekly' | 'biweekly' | 'monthly') => boolean | void;
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
  const [selectedFeatures, setSelectedFeatures] = useState<FeaturesRestriction[]>([]);
  const [onlyBestValue, setOnlyBestValue] = useState(false);
  const [quantities, setQuantities] = useState<{ [itemId: string]: number }>({});
  const [isListening, setIsListening] = useState(false);
  const [recognition, setRecognition] = useState<any>(null);
  const [expandedSparklines, setExpandedSparklines] = useState<{ [itemId: string]: boolean }>({});
  const [isOffline, setIsOffline] = useState(false);

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

  const toggleFeatures = (restriction: FeaturesRestriction) => {
    setSelectedFeatures(prev =>
      prev.includes(restriction)
        ? prev.filter(r => r !== restriction)
        : [...prev, restriction]
    );
  };

  const filteredProducts = useMemo(() => {
    return products.filter(item => {
      // Search text match
      const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            item.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            item.category.toLowerCase().includes(searchQuery.toLowerCase());

      // Features restriction match (must match ALL selected restrictions)
      const matchesFeatures = selectedFeatures.length === 0 ||
                             selectedFeatures.every(r => item.featuresRestrictions.includes(r));

      // Zone match
      const matchesZone = selectedZone === 'All Zones' ||
                          item.availabilityZone === 'All Zones' ||
                          item.availabilityZone === selectedZone;

      // Best Value match
      const matchesBestValue = !onlyBestValue || bestValueMap[item.id]?.isBestValue;

      return matchesSearch && matchesFeatures && matchesZone && matchesBestValue;
    });
  }, [products, searchQuery, selectedFeatures, selectedZone, onlyBestValue, bestValueMap]);

  const handleAddToCartClick = (item: GroceryItem) => {
    const qty = quantities[item.id] || 1;

    if (item.stock < qty) {
      onAddToast('Insufficient Stock', `Only ${item.stock} items left in inventory.`, 'warning');
      return;
    }

    const added = onAddToCart(item, qty, false);
    if (added === false) {
      onAddToast('Cart limit reached', `You already have the max available stock of ${item.name}.`, 'warning');
      return;
    }
    onAddToast('Added to Cart', `${qty}× ${item.name} added.`, 'success');
  };

  const zoneDeliveryInfo = ZONE_DELIVERY_STATUS[selectedZone] || ZONE_DELIVERY_STATUS['All Zones'];

  return (
    <div id="catalog-section" className="space-y-8 scroll-mt-20">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
        <div>
          <h2 className="font-display text-3xl sm:text-4xl font-semibold text-[#0f172a] dark:text-[#e7eef5] tracking-tight">
            Device catalog
          </h2>
          <p className="mt-1 text-sm text-[#64748b] dark:text-[#8a9eb0]">
            Mobiles, laptops, and accessories ready for Yangon delivery.
          </p>
        </div>
        <p className="text-xs font-medium text-[#64748b] dark:text-[#8a9eb0]">
          {filteredProducts.length} item{filteredProducts.length === 1 ? '' : 's'}
          {zoneDeliveryInfo.status === 'delayed' ? ` · +${zoneDeliveryInfo.delayMinutes}m delay in ${selectedZone}` : ''}
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

      <div className="flex flex-col md:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-[#64748b]/70" />
          <input
            id="grocery-search"
            type="text"
            placeholder="Search phones, laptops, audio…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-11 pr-12 py-3 border border-[#0284c7]/15 dark:border-white/10 bg-white/80 dark:bg-[#121a24] text-[#0f172a] dark:text-[#e7eef5] rounded-2xl text-sm placeholder:text-[#64748b]/60 focus:outline-hidden focus:ring-2 focus:ring-[#0ea5e9]/40 transition-shadow"
          />
          <button
            type="button"
            onClick={handleToggleSpeech}
            className={`absolute right-3 top-1/2 -translate-y-1/2 p-1.5 rounded-xl transition-colors cursor-pointer ${
              isListening
                ? 'bg-red-500/15 text-red-600'
                : 'text-[#64748b] hover:text-[#0284c7] hover:bg-[#e0f2fe]/60'
            }`}
            title={isListening ? 'Stop' : 'Voice search'}
          >
            <Mic className="w-4 h-4" />
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <label className="flex items-center gap-2 px-3.5 py-3 rounded-2xl border border-[#0284c7]/15 dark:border-white/10 bg-white/80 dark:bg-[#121a24] text-sm text-[#0f172a] dark:text-[#e7eef5]">
            <MapPin className="w-4 h-4 text-[#0ea5e9] shrink-0" />
            <select
              id="zone-select"
              value={selectedZone}
              onChange={(e) => setSelectedZone(e.target.value)}
              className="bg-transparent font-medium focus:outline-hidden cursor-pointer min-w-0"
            >
              {ZONE_OPTIONS.map(opt => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </select>
          </label>

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

      <div className="flex flex-wrap gap-2">
        {DIETARY_OPTIONS.map((diet) => {
          const active = selectedFeatures.includes(diet.value as FeaturesRestriction);
          return (
            <button
              key={diet.value}
              type="button"
              onClick={() => toggleFeatures(diet.value as FeaturesRestriction)}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-colors cursor-pointer ${
                active
                  ? 'bg-[#e0f2fe] text-[#0c4a6e] dark:bg-[#0c4a6e] dark:text-[#e0f2fe]'
                  : 'bg-white/60 dark:bg-[#121a24] text-[#64748b] dark:text-[#8a9eb0] hover:bg-[#e0f2fe]/50'
              }`}
            >
              {diet.name}
            </button>
          );
        })}
        {selectedFeatures.length > 0 && (
          <button
            type="button"
            onClick={() => setSelectedFeatures([])}
            className="px-3 py-1.5 text-xs font-medium text-[#c45c26] cursor-pointer"
          >
            Clear
          </button>
        )}
      </div>

      {filteredProducts.length === 0 ? (
        <div className="py-16 text-center">
          <p className="font-display text-lg font-semibold text-[#0f172a] dark:text-[#e7eef5]">
            Nothing matches
          </p>
          <p className="mt-1 text-sm text-[#64748b]">Try another search or clear filters.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5">
          {filteredProducts.map((item, index) => {
            const qty = quantities[item.id] || 1;
            const out = item.stock === 0;
            const low = item.stock > 0 && item.stock <= 5;
            const itemBestValue = bestValueMap[item.id];
            const showTrend = !!expandedSparklines[item.id];

            return (
              <motion.article
                key={item.id}
                layout
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  duration: 0.4,
                  delay: Math.min(index * 0.035, 0.25),
                  ease: [0.22, 1, 0.36, 1],
                }}
                whileHover={{ y: -4, transition: { duration: 0.2 } }}
                className="group flex flex-col bg-white/90 dark:bg-[#121a24] rounded-2xl overflow-hidden shadow-market hover:shadow-market-hover transition-shadow duration-300"
              >
                <div className="relative aspect-[4/3] bg-[#e8f0f6] dark:bg-[#0B1220] overflow-hidden">
                  <img
                    src={item.imageUrl}
                    alt={item.name}
                    className="h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.04]"
                    referrerPolicy="no-referrer"
                    loading="lazy"
                  />
                  {out && (
                    <span className="absolute inset-0 flex items-center justify-center bg-[#0B1220]/45 text-white text-xs font-semibold tracking-wide">
                      Sold out
                    </span>
                  )}
                  {itemBestValue?.isBestValue && (
                    <span className="absolute top-2.5 left-2.5 text-[10px] font-semibold text-slate-950 bg-amber-400 px-2 py-0.5 rounded-md shadow-sm">
                      Best value
                    </span>
                  )}
                  {!out && low && (
                    <span className="absolute bottom-2.5 left-2.5 text-[10px] font-semibold text-white bg-[#0f172a]/75 px-2 py-0.5 rounded-md">
                      {item.stock} left
                    </span>
                  )}
                  {item.rating > 0 && (
                    <span className="absolute bottom-2.5 right-2.5 inline-flex items-center gap-1 text-[10px] font-semibold text-[#0f172a] bg-white/90 dark:bg-[#121a24]/90 backdrop-blur-sm px-2 py-0.5 rounded-md">
                      <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                      {item.rating.toFixed(1)}
                    </span>
                  )}
                </div>

                <div className="flex flex-1 flex-col p-3.5 sm:p-4 gap-2.5">
                  <div className="min-h-0">
                    <p className="text-[10px] font-medium uppercase tracking-wide text-[#0284c7] dark:text-sky-400">
                      {item.category}
                    </p>
                    <h3 className="mt-0.5 font-display font-semibold text-[15px] sm:text-base text-[#0f172a] dark:text-[#e7eef5] leading-snug line-clamp-2">
                      {item.name}
                    </h3>
                    <p className="mt-1 text-[11px] text-[#64748b] dark:text-[#8a9eb0]">
                      {item.unit}
                    </p>
                  </div>

                  <div className="mt-auto space-y-2.5 pt-1">
                    <div className="flex items-end justify-between gap-2">
                      <p className="font-semibold text-[#0f172a] dark:text-[#e7eef5] tabular-nums leading-none">
                        <span className="text-lg sm:text-xl tracking-tight">
                          {item.price.toLocaleString()}
                        </span>
                        <span className="ml-1 text-[10px] font-medium text-[#64748b]">MMK</span>
                      </p>
                      <button
                        type="button"
                        onClick={() =>
                          setExpandedSparklines((prev) => ({ ...prev, [item.id]: !prev[item.id] }))
                        }
                        className="inline-flex items-center gap-1 text-[11px] font-medium text-[#64748b] hover:text-[#0284c7] dark:text-[#8a9eb0] dark:hover:text-sky-400 transition-colors cursor-pointer"
                        aria-expanded={showTrend}
                        aria-label={showTrend ? 'Hide price trend' : 'Show price trend'}
                      >
                        <TrendingUp className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">{showTrend ? 'Hide' : 'Trend'}</span>
                      </button>
                    </div>

                    <AnimatePresence initial={false}>
                      {showTrend && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="overflow-hidden"
                        >
                          <PriceSparkline itemId={item.id} basePrice={item.price} />
                        </motion.div>
                      )}
                    </AnimatePresence>

                    <div className="flex items-center gap-2">
                      <div className="flex items-center rounded-xl border border-[#0284c7]/12 dark:border-white/10 overflow-hidden h-10 bg-[#eef4f8]/70 dark:bg-[#0B1220]">
                        <button
                          type="button"
                          onClick={() =>
                            setQuantities((prev) => ({
                              ...prev,
                              [item.id]: Math.max(1, (prev[item.id] || 1) - 1),
                            }))
                          }
                          className="px-2.5 h-full text-[#64748b] hover:bg-[#e0f2fe]/60 font-medium"
                          aria-label="Decrease quantity"
                        >
                          −
                        </button>
                        <span className="w-7 text-center text-xs font-semibold tabular-nums">{qty}</span>
                        <button
                          type="button"
                          onClick={() =>
                            setQuantities((prev) => ({
                              ...prev,
                              [item.id]: Math.min(item.stock || 1, (prev[item.id] || 1) + 1),
                            }))
                          }
                          disabled={out || qty >= item.stock}
                          className="px-2.5 h-full text-[#64748b] hover:bg-[#e0f2fe]/60 font-medium disabled:opacity-40"
                          aria-label="Increase quantity"
                        >
                          +
                        </button>
                      </div>

                      <motion.button
                        type="button"
                        disabled={out}
                        onClick={() => handleAddToCartClick(item)}
                        whileTap={out ? undefined : { scale: 0.97 }}
                        className={`flex-1 h-10 rounded-xl text-sm font-semibold inline-flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
                          out
                            ? 'bg-[#e8f0f6] dark:bg-[#1a242f] text-[#64748b]/50 cursor-not-allowed'
                            : 'bg-[#0284c7] hover:bg-[#0ea5e9] text-white'
                        }`}
                      >
                        <ShoppingCart className="w-4 h-4" />
                        Add
                      </motion.button>
                    </div>
                  </div>
                </div>
              </motion.article>
            );
          })}
        </div>
      )}
    </div>
  );
}
