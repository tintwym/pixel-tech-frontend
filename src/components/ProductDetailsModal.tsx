'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { X, ShoppingCart, Star, MapPin, ChevronLeft, ChevronRight } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { GroceryItem } from '@/types';
import ProductImage from '@/components/ProductImage';
import { resolveProductGallery } from '@/lib/productGallery';
import {
  MOBILE_STORAGE_OPTIONS,
  defaultMobileStorage,
  isSmartphoneCategory,
  mobileStoragePrice,
} from '@/data/mobileOptions';
import {
  LAPTOP_MEMORY_OPTIONS,
  LAPTOP_STORAGE_OPTIONS,
  defaultLaptopMemory,
  defaultLaptopSize,
  defaultLaptopStorage,
  formatLaptopConfig,
  isLaptopCategory,
  laptopConfigPrice,
  laptopSizeOptions,
  type LaptopMemory,
} from '@/data/laptopOptions';

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

export default function ProductDetailsModal({
  item,
  isOpen,
  onClose,
  onAddToCart,
  onAddToast,
}: ProductDetailsModalProps) {
  const [selectedColorId, setSelectedColorId] = useState<string | null>(null);
  const [selectedStorage, setSelectedStorage] = useState<string>('256GB');
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [selectedMemory, setSelectedMemory] = useState<LaptopMemory>('16GB');
  const [activeIndex, setActiveIndex] = useState(0);
  const [qty, setQty] = useState(1);

  const isPhone = isSmartphoneCategory(item?.category);
  const isLaptop = isLaptopCategory(item?.category);
  const sizeOptions = useMemo(
    () => (item && isLaptop ? laptopSizeOptions(item.name, item.imageUrls || []) : []),
    [item, isLaptop]
  );

  const { colors, gallery } = useMemo(() => {
    if (!item) return { colors: [], gallery: [] as string[] };
    return resolveProductGallery(
      item.imageUrl,
      item.imageUrls,
      selectedColorId,
      isLaptop ? selectedSize : null
    );
  }, [item, selectedColorId, selectedSize, isLaptop]);

  const activeColor = colors.find((c) => c.id === selectedColorId) || colors[0] || null;
  const displayPrice = item
    ? isPhone
      ? mobileStoragePrice(item.price, selectedStorage)
      : isLaptop
        ? laptopConfigPrice(item.price, selectedSize, selectedMemory, selectedStorage)
        : item.price
    : 0;

  useEffect(() => {
    if (!isOpen || !item) return;
    const next = resolveProductGallery(item.imageUrl, item.imageUrls, null);
    setSelectedColorId(next.colors[0]?.id ?? null);
    if (isLaptopCategory(item.category)) {
      const sizes = laptopSizeOptions(item.name, item.imageUrls || []);
      setSelectedSize(defaultLaptopSize(item.name, sizes));
      setSelectedMemory(defaultLaptopMemory(item.name));
      setSelectedStorage(defaultLaptopStorage(item.name));
    } else {
      setSelectedSize(null);
      setSelectedMemory('16GB');
      setSelectedStorage(defaultMobileStorage(item.name));
    }
    setActiveIndex(0);
    setQty(1);
  }, [isOpen, item?.id]);

  useEffect(() => {
    setActiveIndex(0);
  }, [selectedColorId, selectedSize]);

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

  const handleAdd = () => {
    if (out) return;
    if (item.stock < qty) {
      onAddToast('Insufficient Stock', `Only ${item.stock} items left in inventory.`, 'warning');
      return;
    }
    const pricedItem: GroceryItem = {
      ...item,
      price: displayPrice,
      imageUrl: gallery[0] || item.imageUrl,
    };
    const configLabel = isLaptop
      ? formatLaptopConfig(selectedSize, selectedMemory, selectedStorage)
      : isPhone
        ? selectedStorage
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
        className="fixed inset-0 z-999 flex items-end sm:items-center justify-center p-0 sm:p-4 font-sans"
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
          className="relative z-10 flex w-full max-w-3xl max-h-[92vh] flex-col overflow-hidden rounded-t-3xl sm:rounded-3xl bg-white dark:bg-[#0B1220] border border-slate-200 dark:border-white/10 shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between gap-3 border-b border-slate-100 dark:border-white/10 px-4 sm:px-5 py-3.5">
            <div className="min-w-0">
              <p className="text-[10px] font-medium uppercase tracking-wide text-[#0284c7] dark:text-sky-400">
                {item.brand} · {item.category}
              </p>
              <h2
                id="product-details-title"
                className="font-display font-semibold text-base sm:text-lg text-[#0f172a] dark:text-[#e7eef5] truncate"
              >
                {item.name}
              </h2>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-white/5 text-slate-400 hover:text-slate-700 dark:hover:text-white transition-colors cursor-pointer"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="overflow-y-auto flex-1">
            <div className="grid sm:grid-cols-2 gap-0 sm:gap-0">
              <div className="relative bg-[#e8f0f6] dark:bg-[#0a1018]">
                <div className="relative aspect-[4/3] sm:aspect-square">
                  <ProductImage
                    src={activeSrc}
                    alt={
                      activeColor
                        ? `${item.name} — ${activeColor.label}`
                        : item.name
                    }
                    className="h-full w-full object-cover"
                  />
                  {gallery.length > 1 && (
                    <>
                      <button
                        type="button"
                        onClick={() =>
                          setActiveIndex((i) => (i - 1 + gallery.length) % gallery.length)
                        }
                        className="absolute left-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-white/90 dark:bg-[#121a24]/90 text-[#0f172a] dark:text-white shadow-sm cursor-pointer"
                        aria-label="Previous image"
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setActiveIndex((i) => (i + 1) % gallery.length)}
                        className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-white/90 dark:bg-[#121a24]/90 text-[#0f172a] dark:text-white shadow-sm cursor-pointer"
                        aria-label="Next image"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </>
                  )}
                  {out && (
                    <span className="absolute inset-0 flex items-center justify-center bg-[#0B1220]/45 text-white text-sm font-semibold">
                      Sold out
                    </span>
                  )}
                </div>

                {gallery.length > 1 && (
                  <div className="flex gap-2 overflow-x-auto p-3 scrollbar-thin">
                    {gallery.map((src, index) => (
                      <button
                        key={`${src}-${index}`}
                        type="button"
                        onClick={() => setActiveIndex(index)}
                        className={`relative h-14 w-14 shrink-0 overflow-hidden rounded-lg border-2 transition-colors cursor-pointer ${
                          index === activeIndex
                            ? 'border-[#0284c7]'
                            : 'border-transparent opacity-80 hover:opacity-100'
                        }`}
                        aria-label={`View image ${index + 1}`}
                        aria-current={index === activeIndex}
                      >
                        <ProductImage src={src} alt="" className="h-full w-full object-cover" />
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex flex-col p-4 sm:p-5 gap-4">
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center gap-2 text-xs text-[#64748b] dark:text-[#8a9eb0]">
                    {item.rating > 0 && (
                      <span className="inline-flex items-center gap-1 font-semibold text-[#0f172a] dark:text-[#e7eef5]">
                        <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                        {item.rating.toFixed(1)}
                      </span>
                    )}
                    <span>{item.unit}</span>
                    <span className="inline-flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5" />
                      {item.availabilityZone}
                    </span>
                  </div>

                  <p className="font-semibold text-[#0f172a] dark:text-[#e7eef5] tabular-nums">
                    <span className="text-2xl tracking-tight">{displayPrice.toLocaleString()}</span>
                    <span className="ml-1.5 text-xs font-medium text-[#64748b]">MMK</span>
                  </p>

                  {!out && low && (
                    <p className="text-xs font-medium text-amber-600 dark:text-amber-400">
                      Only {item.stock} left in stock
                    </p>
                  )}
                  {!out && !low && (
                    <p className="text-xs text-[#64748b] dark:text-[#8a9eb0]">
                      {item.stock} in stock
                    </p>
                  )}
                </div>

                {colors.length > 0 && (
                  <div>
                    <h3 className="text-[11px] font-semibold uppercase tracking-wide text-[#64748b] mb-2">
                      Color
                      {activeColor && (
                        <span className="ml-2 normal-case tracking-normal font-medium text-[#0f172a] dark:text-[#e7eef5]">
                          {activeColor.label}
                        </span>
                      )}
                    </h3>
                    <div className="flex flex-wrap gap-2.5" role="radiogroup" aria-label="Choose color">
                      {colors.map((color) => {
                        const selected = activeColor?.id === color.id;
                        return (
                          <button
                            key={color.id}
                            type="button"
                            role="radio"
                            aria-checked={selected}
                            aria-label={color.label}
                            title={color.label}
                            onClick={() => setSelectedColorId(color.id)}
                            className={`relative h-9 w-9 rounded-full border-2 transition-shadow cursor-pointer ${
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

                {isLaptop && sizeOptions.length > 0 && (
                  <div>
                    <h3 className="text-[11px] font-semibold uppercase tracking-wide text-[#64748b] mb-2">
                      Size
                      {selectedSize && (
                        <span className="ml-2 normal-case tracking-normal font-medium text-[#0f172a] dark:text-[#e7eef5]">
                          {selectedSize}
                        </span>
                      )}
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
                            className={`rounded-xl px-3.5 py-2 text-xs font-semibold border transition-colors cursor-pointer ${
                              selected
                                ? 'border-[#0284c7] bg-[#e0f2fe] text-[#0c4a6e] dark:bg-[#0c4a6e] dark:text-[#e0f2fe]'
                                : 'border-slate-200 dark:border-white/15 text-slate-600 dark:text-slate-300 hover:border-[#0284c7]/50'
                            }`}
                          >
                            {size}
                          </button>
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
                        {selectedMemory}
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
                            className={`rounded-xl px-3.5 py-2 text-xs font-semibold border transition-colors cursor-pointer ${
                              selected
                                ? 'border-[#0284c7] bg-[#e0f2fe] text-[#0c4a6e] dark:bg-[#0c4a6e] dark:text-[#e0f2fe]'
                                : 'border-slate-200 dark:border-white/15 text-slate-600 dark:text-slate-300 hover:border-[#0284c7]/50'
                            }`}
                          >
                            {memory}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {(isPhone || isLaptop) && (
                  <div>
                    <h3 className="text-[11px] font-semibold uppercase tracking-wide text-[#64748b] mb-2">
                      Storage
                      <span className="ml-2 normal-case tracking-normal font-medium text-[#0f172a] dark:text-[#e7eef5]">
                        {selectedStorage}
                      </span>
                    </h3>
                    <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Choose storage">
                      {(isLaptop ? LAPTOP_STORAGE_OPTIONS : MOBILE_STORAGE_OPTIONS).map(
                        (storage) => {
                          const selected = selectedStorage === storage;
                          return (
                            <button
                              key={storage}
                              type="button"
                              role="radio"
                              aria-checked={selected}
                              onClick={() => setSelectedStorage(storage)}
                              className={`rounded-xl px-3.5 py-2 text-xs font-semibold border transition-colors cursor-pointer ${
                                selected
                                  ? 'border-[#0284c7] bg-[#e0f2fe] text-[#0c4a6e] dark:bg-[#0c4a6e] dark:text-[#e0f2fe]'
                                  : 'border-slate-200 dark:border-white/15 text-slate-600 dark:text-slate-300 hover:border-[#0284c7]/50'
                              }`}
                            >
                              {storage}
                            </button>
                          );
                        }
                      )}
                    </div>
                  </div>
                )}

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
                      Features
                    </h3>
                    <div className="flex flex-wrap gap-1.5">
                      {item.featuresRestrictions.map((feature) => (
                        <span
                          key={feature}
                          className="rounded-md bg-[#e0f2fe]/80 dark:bg-sky-950/40 px-2 py-1 text-[11px] font-medium text-[#0369a1] dark:text-sky-300"
                        >
                          {feature}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                <div className="mt-auto flex items-center gap-2 pt-2">
                  <div className="flex items-center rounded-xl border border-[#0284c7]/12 dark:border-white/10 overflow-hidden h-11 bg-[#eef4f8]/70 dark:bg-[#0B1220]">
                    <button
                      type="button"
                      onClick={() => setQty((q) => Math.max(1, q - 1))}
                      className="px-3 h-full text-[#64748b] hover:bg-[#e0f2fe]/60 font-medium cursor-pointer"
                      aria-label="Decrease quantity"
                    >
                      −
                    </button>
                    <span className="w-8 text-center text-sm font-semibold tabular-nums">{qty}</span>
                    <button
                      type="button"
                      onClick={() => setQty((q) => Math.min(item.stock || 1, q + 1))}
                      disabled={out || qty >= item.stock}
                      className="px-3 h-full text-[#64748b] hover:bg-[#e0f2fe]/60 font-medium disabled:opacity-40 cursor-pointer"
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
                    className={`flex-1 h-11 rounded-xl text-sm font-semibold inline-flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
                      out
                        ? 'bg-[#e8f0f6] dark:bg-[#1a242f] text-[#64748b]/50 cursor-not-allowed'
                        : 'bg-[#0284c7] hover:bg-[#0ea5e9] text-white'
                    }`}
                  >
                    <ShoppingCart className="w-4 h-4" />
                    {out ? 'Sold out' : 'Add to cart'}
                  </motion.button>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
