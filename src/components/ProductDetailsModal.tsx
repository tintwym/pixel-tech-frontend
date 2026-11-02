'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { X, ShoppingCart, Star, MapPin, ChevronLeft, ChevronRight } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { GroceryItem } from '@/types';
import ProductImage from '@/components/ProductImage';
import { resolveProductGallery } from '@/lib/productGallery';
import {
  MOBILE_STORAGE_OPTIONS,
  isSmartphoneCategory,
  mobileStoragePrice,
} from '@/data/mobileOptions';
import {
  LAPTOP_MEMORY_OPTIONS,
  LAPTOP_STORAGE_OPTIONS,
  formatLaptopConfig,
  isLaptopCategory,
  laptopConfigPrice,
  laptopSizeOptions,
  type LaptopMemory,
} from '@/data/laptopOptions';
import {
  formatTabletConfig,
  isConfigurableIpad,
  isTabletCategory,
  tabletConfigPrice,
  tabletSizeOptions,
  tabletStorageOptions,
} from '@/data/tabletOptions';

interface ProductDetailsModalProps {
  item: GroceryItem | null;
  isOpen: boolean;
  onClose: () => void;
  onAddToCart: (
    item: GroceryItem,
    qty: number,
    isSub: boolean,
    freq?: 'weekly' | 'biweekly' | 'monthly',
    selectedColor?: string,
    selectedStorage?: string
  ) => boolean | void;
  onAddToast: (title: string, msg: string, type: 'success' | 'warning' | 'info') => void;
}

const chipClass = (selected: boolean) =>
  `rounded-lg px-3 py-2 text-xs font-semibold border transition-colors cursor-pointer ${
    selected
      ? 'border-[#0284c7] bg-[#e0f2fe] text-[#0c4a6e] dark:bg-[#0c4a6e] dark:text-[#e0f2fe]'
      : 'border-slate-200 dark:border-white/15 text-slate-600 dark:text-slate-300 hover:border-[#0284c7]/50'
  }`;

export default function ProductDetailsModal({
  item,
  isOpen,
  onClose,
  onAddToCart,
  onAddToast,
}: ProductDetailsModalProps) {
  const [selectedColorId, setSelectedColorId] = useState<string | null>(null);
  const [selectedStorage, setSelectedStorage] = useState<string | null>(null);
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [selectedMemory, setSelectedMemory] = useState<LaptopMemory | null>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [qty, setQty] = useState(1);

  const isPhone = isSmartphoneCategory(item?.category);
  const isLaptop = isLaptopCategory(item?.category);
  const isTablet = isTabletCategory(item?.category);
  const sizeOptions = useMemo(() => {
    if (!item) return [] as string[];
    if (isLaptop) return laptopSizeOptions(item.name, item.imageUrls || []);
    if (isTablet) return tabletSizeOptions(item.name, item.imageUrls || []);
    return [];
  }, [item, isLaptop, isTablet]);
  /** Configurable tablets: Apple iPads (size + storage) — fixed SKUs like Tab S9 do not. */
  const isConfigurableTablet =
    isTablet && !!item && (sizeOptions.length > 0 || isConfigurableIpad(item.name));
  const tabletStorage = useMemo(
    () => (item ? tabletStorageOptions(item.name) : []),
    [item]
  );

  const { colors, gallery } = useMemo(() => {
    if (!item) return { colors: [], gallery: [] as string[] };
    return resolveProductGallery(
      item.imageUrl,
      item.imageUrls,
      selectedColorId,
      isLaptop || (isConfigurableTablet && sizeOptions.length > 0) ? selectedSize : null
    );
  }, [item, selectedColorId, selectedSize, isLaptop, isConfigurableTablet, sizeOptions.length]);

  const activeColor = colors.find((c) => c.id === selectedColorId) || null;
  const displayPrice = item
    ? isPhone && selectedStorage
      ? mobileStoragePrice(item.price, selectedStorage)
      : isLaptop && selectedStorage && selectedMemory
        ? laptopConfigPrice(item.price, selectedSize, selectedMemory, selectedStorage)
        : isConfigurableTablet && (selectedSize || selectedStorage)
          ? tabletConfigPrice(
              item.price,
              selectedSize,
              selectedStorage || tabletStorage[0] || '256GB',
              item.name
            )
          : item.price
    : 0;

  useEffect(() => {
    if (!isOpen || !item) return;
    // Apple-style: nothing selected until the shopper chooses.
    setSelectedColorId(null);
    setSelectedStorage(null);
    setSelectedSize(null);
    setSelectedMemory(null);
    setActiveIndex(0);
    setQty(1);
  }, [isOpen, item?.id]);

  useEffect(() => {
    setActiveIndex(0);
  }, [selectedColorId, selectedSize]);

  // Apple buy flow: changing model/size clears finish (finish is size-specific).
  useEffect(() => {
    setSelectedColorId(null);
  }, [selectedSize]);

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight' && gallery.length > 1) {
        setActiveIndex((i) => (i + 1) % gallery.length);
      }
      if (e.key === 'ArrowLeft' && gallery.length > 1) {
        setActiveIndex((i) => (i - 1 + gallery.length) % gallery.length);
      }
    };
    window.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [isOpen, gallery.length, onClose]);

  if (!isOpen || !item) return null;

  const out = item.stock === 0;
  const low = item.stock > 0 && item.stock <= 5;
  const activeSrc = gallery[activeIndex] || item.imageUrl;
  const needsSizeFirst = sizeOptions.length > 0 && !selectedSize;

  const handleAdd = () => {
    if (out) return;
    if (item.stock < qty) {
      onAddToast('Insufficient Stock', `Only ${item.stock} items left in inventory.`, 'warning');
      return;
    }
    if ((isLaptop || isConfigurableTablet) && sizeOptions.length > 0 && !selectedSize) {
      onAddToast('Choose a size', 'Select a model size before adding to cart.', 'warning');
      return;
    }
    if (colors.length > 0 && !selectedColorId) {
      onAddToast(
        isLaptop || isConfigurableTablet ? 'Choose a finish' : 'Choose a color',
        isLaptop || isConfigurableTablet
          ? 'Select a finish before adding to cart.'
          : 'Select a color before adding to cart.',
        'warning'
      );
      return;
    }
    if (isLaptop && !selectedMemory) {
      onAddToast('Choose memory', 'Select memory before adding to cart.', 'warning');
      return;
    }
    if ((isPhone || isLaptop || isConfigurableTablet) && !selectedStorage) {
      onAddToast('Choose storage', 'Select storage before adding to cart.', 'warning');
      return;
    }
    const pricedItem: GroceryItem = {
      ...item,
      price: displayPrice,
      imageUrl: gallery[0] || item.imageUrl,
    };
    const configLabel = isLaptop
      ? formatLaptopConfig(selectedSize, selectedMemory || '', selectedStorage || '')
      : isConfigurableTablet
        ? formatTabletConfig(selectedSize, selectedStorage || '')
        : isPhone
          ? selectedStorage || undefined
          : undefined;
    const added = onAddToCart(
      pricedItem,
      qty,
      false,
      undefined,
      activeColor?.id,
      configLabel
    );
    if (added === false) {
      onAddToast('Cart limit reached', `You already have the max available stock of ${item.name}.`, 'warning');
      return;
    }
    const bits = [activeColor?.label, configLabel].filter(Boolean).join(' · ');
    onAddToast(
      'Added to Cart',
      bits ? `${qty}× ${item.name} · ${bits} added.` : `${qty}× ${item.name} added.`,
      'success'
    );
  };

  return (
    <AnimatePresence>
      <div
        className="fixed inset-0 z-999 flex items-end sm:items-center justify-center p-0 sm:p-5 font-sans"
        role="dialog"
        aria-modal="true"
        aria-labelledby="product-details-title"
      >
        <motion.button
          type="button"
          aria-label="Close product details"
          className="absolute inset-0 bg-black/70 backdrop-blur-xs cursor-pointer"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        />

        <motion.div
          initial={{ opacity: 0, y: 40, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 24, scale: 0.98 }}
          transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
          className="relative z-10 flex w-full max-w-5xl max-h-[min(94vh,100dvh)] flex-col overflow-hidden rounded-t-3xl sm:rounded-3xl bg-white dark:bg-[#0B1220] border border-slate-200/80 dark:border-white/10 shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Mobile title bar */}
          <div className="flex sm:hidden items-center justify-between gap-3 border-b border-slate-100 dark:border-white/10 px-4 py-3 pt-[max(0.875rem,env(safe-area-inset-top))]">
            <h2
              id="product-details-title"
              className="font-display font-semibold text-base text-[#0f172a] dark:text-[#e7eef5] truncate"
            >
              {item.name}
            </h2>
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-white/5 text-slate-400 hover:text-slate-700 dark:hover:text-white transition-colors cursor-pointer"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="overflow-y-auto flex-1 min-h-0">
            <div className="grid lg:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)]">
              {/* Gallery */}
              <div className="relative bg-[#e8f0f6] dark:bg-[#0a1018]">
                <button
                  type="button"
                  onClick={onClose}
                  className="hidden sm:inline-flex absolute top-4 right-4 z-10 p-2 rounded-full bg-white/90 dark:bg-[#121a24]/90 text-slate-500 hover:text-slate-800 dark:hover:text-white shadow-sm cursor-pointer"
                  aria-label="Close"
                >
                  <X className="w-5 h-5" />
                </button>

                <div className="relative aspect-[4/3] sm:aspect-square max-h-[46vh] sm:max-h-none">
                  <ProductImage
                    src={activeSrc}
                    alt={
                      activeColor
                        ? `${item.name} — ${activeColor.label}`
                        : item.name
                    }
                    className="h-full w-full object-contain p-6 sm:p-10"
                  />
                  {gallery.length > 1 && (
                    <>
                      <button
                        type="button"
                        onClick={() =>
                          setActiveIndex((i) => (i - 1 + gallery.length) % gallery.length)
                        }
                        className="hidden sm:inline-flex absolute left-3 top-1/2 -translate-y-1/2 p-2 rounded-full bg-white/90 dark:bg-[#121a24]/90 text-[#0f172a] dark:text-white shadow-sm cursor-pointer items-center justify-center"
                        aria-label="Previous image"
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setActiveIndex((i) => (i + 1) % gallery.length)}
                        className="hidden sm:inline-flex absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-full bg-white/90 dark:bg-[#121a24]/90 text-[#0f172a] dark:text-white shadow-sm cursor-pointer items-center justify-center"
                        aria-label="Next image"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </>
                  )}
                  {out && (
                    <span className="absolute inset-0 flex items-center justify-center bg-[#0B1220]/35">
                      <span className="rounded-full bg-[#0B1220]/80 px-4 py-1.5 text-sm font-semibold text-white">
                        Sold out
                      </span>
                    </span>
                  )}
                </div>

                {/* Mobile: dots · Desktop: thumbs */}
                {gallery.length > 1 && (
                  <>
                    <div className="flex sm:hidden justify-center gap-1.5 pb-4">
                      {gallery.map((src, index) => (
                        <button
                          key={`${src}-dot-${index}`}
                          type="button"
                          onClick={() => setActiveIndex(index)}
                          className={`h-1.5 rounded-full transition-all cursor-pointer ${
                            index === activeIndex
                              ? 'w-5 bg-[#0284c7]'
                              : 'w-1.5 bg-slate-300 dark:bg-white/25'
                          }`}
                          aria-label={`View image ${index + 1}`}
                          aria-current={index === activeIndex}
                        />
                      ))}
                    </div>
                    <div className="hidden sm:flex gap-2 overflow-x-auto px-5 pb-5 scrollbar-thin">
                      {gallery.map((src, index) => (
                        <button
                          key={`${src}-${index}`}
                          type="button"
                          onClick={() => setActiveIndex(index)}
                          className={`relative h-14 w-14 shrink-0 overflow-hidden rounded-lg border-2 transition-colors cursor-pointer bg-white/40 dark:bg-white/5 ${
                            index === activeIndex
                              ? 'border-[#0284c7]'
                              : 'border-transparent opacity-80 hover:opacity-100'
                          }`}
                          aria-label={`View image ${index + 1}`}
                          aria-current={index === activeIndex}
                        >
                          <ProductImage src={src} alt="" className="h-full w-full object-contain p-1" />
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>

              {/* Config column */}
              <div className="flex flex-col min-h-0">
                <div className="flex-1 p-5 sm:p-6 lg:p-7 space-y-5 pb-4">
                  <div className="hidden sm:block space-y-1">
                    <h2 className="font-display font-semibold text-xl lg:text-2xl text-[#0f172a] dark:text-[#e7eef5] leading-tight">
                      {item.name}
                    </h2>
                    <p className="text-sm text-[#64748b] dark:text-[#8a9eb0]">
                      From{' '}
                      <span className="font-semibold tabular-nums text-[#0f172a] dark:text-[#e7eef5]">
                        {displayPrice.toLocaleString()} MMK
                      </span>
                    </p>
                  </div>

                  <div className="sm:hidden">
                    <p className="font-semibold tabular-nums text-[#0f172a] dark:text-[#e7eef5]">
                      <span className="text-2xl tracking-tight">{displayPrice.toLocaleString()}</span>
                      <span className="ml-1.5 text-xs font-medium text-[#64748b]">MMK</span>
                    </p>
                  </div>

                  {!out && low && (
                    <p className="text-xs font-medium text-amber-600 dark:text-amber-400">
                      Only {item.stock} left in stock
                    </p>
                  )}

                  {/* Apple buy order: Model/size → Finish → Memory → Storage */}
                  {(isLaptop || isConfigurableTablet) && sizeOptions.length > 0 && (
                    <div>
                      <h3 className="text-[11px] font-semibold uppercase tracking-wide text-[#64748b] mb-2">
                        Model
                        <span className="ml-2 normal-case tracking-normal font-medium text-[#0f172a] dark:text-[#e7eef5]">
                          {selectedSize || 'Choose your size'}
                        </span>
                      </h3>
                      <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Choose size">
                        {sizeOptions.map((size) => {
                          const selected = selectedSize === size;
                          return (
                            <button
                              key={size}
                              type="button"
                              role="radio"
                              aria-checked={selected}
                              onClick={() => setSelectedSize(size)}
                              className={chipClass(selected)}
                            >
                              {size}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {colors.length > 0 && (
                    <div
                      className={needsSizeFirst ? 'opacity-45 pointer-events-none' : undefined}
                      aria-disabled={needsSizeFirst ? true : undefined}
                    >
                      <h3 className="text-[11px] font-semibold uppercase tracking-wide text-[#64748b] mb-2">
                        {isLaptop || isConfigurableTablet ? 'Finish' : 'Color'}
                        <span className="ml-2 normal-case tracking-normal font-medium text-[#0f172a] dark:text-[#e7eef5]">
                          {needsSizeFirst
                            ? 'Select a size first'
                            : activeColor?.label || 'Pick your favorite'}
                        </span>
                      </h3>
                      <div
                        className="flex flex-wrap gap-2.5"
                        role="radiogroup"
                        aria-label={isLaptop || isConfigurableTablet ? 'Choose finish' : 'Choose color'}
                      >
                        {colors.map((color) => {
                          const selected = selectedColorId === color.id;
                          return (
                            <button
                              key={color.id}
                              type="button"
                              role="radio"
                              aria-checked={selected}
                              aria-label={color.label}
                              title={color.label}
                              disabled={needsSizeFirst}
                              onClick={() => setSelectedColorId(color.id)}
                              className={`relative h-8 w-8 rounded-full border-2 transition-shadow cursor-pointer disabled:cursor-not-allowed ${
                                selected
                                  ? 'border-[#0284c7] shadow-[0_0_0_2px_rgba(2,132,199,0.25)]'
                                  : 'border-slate-200 dark:border-white/20 hover:border-[#0284c7]/50'
                              }`}
                              style={{ backgroundColor: color.swatch }}
                            />
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {isLaptop && (
                    <div>
                      <h3 className="text-[11px] font-semibold uppercase tracking-wide text-[#64748b] mb-2">
                        Memory
                        <span className="ml-2 normal-case tracking-normal font-medium text-[#0f172a] dark:text-[#e7eef5]">
                          {selectedMemory || 'Select'}
                        </span>
                      </h3>
                      <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Choose memory">
                        {LAPTOP_MEMORY_OPTIONS.map((memory) => {
                          const selected = selectedMemory === memory;
                          return (
                            <button
                              key={memory}
                              type="button"
                              role="radio"
                              aria-checked={selected}
                              onClick={() => setSelectedMemory(memory)}
                              className={chipClass(selected)}
                            >
                              {memory}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {(isPhone || isLaptop || isConfigurableTablet) && (
                    <div>
                      <h3 className="text-[11px] font-semibold uppercase tracking-wide text-[#64748b] mb-2">
                        Storage
                        <span className="ml-2 normal-case tracking-normal font-medium text-[#0f172a] dark:text-[#e7eef5]">
                          {selectedStorage || 'Select'}
                        </span>
                      </h3>
                      <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Choose storage">
                        {(isLaptop
                          ? LAPTOP_STORAGE_OPTIONS
                          : isConfigurableTablet
                            ? tabletStorage
                            : MOBILE_STORAGE_OPTIONS
                        ).map((storage) => {
                          const selected = selectedStorage === storage;
                          return (
                            <button
                              key={storage}
                              type="button"
                              role="radio"
                              aria-checked={selected}
                              onClick={() => setSelectedStorage(storage)}
                              className={chipClass(selected)}
                            >
                              {storage}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Secondary info below the fold */}
                  <div className="pt-2 space-y-4 border-t border-slate-100 dark:border-white/8">
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-[#64748b] dark:text-[#8a9eb0]">
                      {item.rating > 0 && (
                        <span className="inline-flex items-center gap-1 font-semibold text-[#0f172a] dark:text-[#e7eef5]">
                          <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                          {item.rating.toFixed(1)}
                        </span>
                      )}
                      {item.unit && <span>{item.unit}</span>}
                      {item.availabilityZone && (
                        <span className="inline-flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5" />
                          {item.availabilityZone}
                        </span>
                      )}
                      {!out && !low && (
                        <span>{item.stock} in stock</span>
                      )}
                    </div>

                    {item.description && (
                      <div>
                        <h3 className="text-[11px] font-semibold uppercase tracking-wide text-[#64748b] mb-1.5">
                          About
                        </h3>
                        <p className="text-sm leading-relaxed text-[#334155] dark:text-[#cbd5e1]">
                          {item.description}
                        </p>
                      </div>
                    )}

                    {item.featuresRestrictions?.length > 0 && (
                      <div>
                        <h3 className="text-[11px] font-semibold uppercase tracking-wide text-[#64748b] mb-1.5">
                          Specs
                        </h3>
                        <div className="flex flex-wrap gap-1.5">
                          {item.featuresRestrictions.map((feature) => (
                            <span
                              key={feature}
                              className="rounded-md bg-slate-100 dark:bg-white/5 px-2 py-1 text-[11px] font-medium text-[#475569] dark:text-slate-300"
                            >
                              {feature}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Sticky buy bar */}
                <div className="sticky bottom-0 border-t border-slate-100 dark:border-white/10 bg-white/95 dark:bg-[#0B1220]/95 backdrop-blur-md px-4 sm:px-6 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
                  <div className="flex items-center gap-2.5">
                    <div className="hidden sm:block min-w-0 flex-1">
                      <p className="text-[10px] font-medium uppercase tracking-wide text-[#64748b]">
                        Total
                      </p>
                      <p className="font-semibold tabular-nums text-[#0f172a] dark:text-[#e7eef5] leading-tight truncate">
                        <span className="text-lg tracking-tight">{displayPrice.toLocaleString()}</span>
                        <span className="ml-1 text-[10px] font-medium text-[#64748b]">MMK</span>
                      </p>
                    </div>

                    <div className="flex items-center rounded-xl border border-[#0284c7]/12 dark:border-white/10 overflow-hidden h-11 bg-[#eef4f8]/70 dark:bg-[#0B1220]">
                      <button
                        type="button"
                        onClick={() => setQty((q) => Math.max(1, q - 1))}
                        className="px-3.5 min-w-11 h-full text-[#64748b] hover:bg-[#e0f2fe]/60 font-medium cursor-pointer"
                        aria-label="Decrease quantity"
                      >
                        −
                      </button>
                      <span className="w-8 text-center text-sm font-semibold tabular-nums">{qty}</span>
                      <button
                        type="button"
                        onClick={() => setQty((q) => Math.min(item.stock || 1, q + 1))}
                        disabled={out || qty >= item.stock}
                        className="px-3.5 min-w-11 h-full text-[#64748b] hover:bg-[#e0f2fe]/60 font-medium disabled:opacity-40 cursor-pointer"
                        aria-label="Increase quantity"
                      >
                        +
                      </button>
                    </div>

                    <motion.button
                      type="button"
                      disabled={out}
                      onClick={handleAdd}
                      whileTap={out ? undefined : { scale: 0.97 }}
                      className={`flex-1 sm:flex-none sm:min-w-[9.5rem] h-11 min-h-11 rounded-xl text-sm font-semibold inline-flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
                        out
                          ? 'bg-[#e8f0f6] dark:bg-[#1a242f] text-[#64748b]/50 cursor-not-allowed'
                          : 'bg-[#0284c7] hover:bg-[#0ea5e9] text-white'
                      }`}
                    >
                      <ShoppingCart className="w-4 h-4 shrink-0" />
                      <span className="truncate">{out ? 'Sold out' : 'Add to cart'}</span>
                    </motion.button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
