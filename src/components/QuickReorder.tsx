'use client';

import React from 'react';
import { Plus } from 'lucide-react';
import { GroceryItem } from '@/types';
import { motion } from 'motion/react';
import ProductImage from '@/components/ProductImage';

interface QuickReorderProps {
  products: GroceryItem[];
  purchaseCounts: Record<string, number>;
  onAddToCart: (item: GroceryItem, qty: number, isSub: boolean) => boolean | void;
  onAddToast: (title: string, msg: string, type: 'success' | 'warning' | 'info') => void;
}

export default function QuickReorder({
  products,
  purchaseCounts,
  onAddToCart,
  onAddToast
}: QuickReorderProps) {
  const reorderItems = products
    .map(g => ({ ...g, count: purchaseCounts[g.id] || 0 }))
    .filter(g => g.count > 0)
    .sort((a, b) => b.count - a.count)
    .slice(0, 4);

  if (reorderItems.length === 0) return null;

  return (
    <section className="mb-10 sm:mb-12" aria-labelledby="recently-purchased-title">
      <div className="mb-4 sm:mb-5">
        <h3
          id="recently-purchased-title"
          className="font-display font-semibold text-lg sm:text-2xl text-[#0f172a] dark:text-[#e7eef5] tracking-tight"
        >
          Recently purchased
        </h3>
        <p className="mt-0.5 text-xs sm:text-sm text-[#64748b] dark:text-[#8a9eb0]">
          Quick picks from your past orders.
        </p>
      </div>

      {/* Full-bleed scroll on mobile so cards peek past the page gutter */}
      <div className="relative -mx-4 px-4 sm:mx-0 sm:px-0">
        <div className="flex gap-3 sm:gap-4 overflow-x-auto pb-2 snap-x snap-mandatory no-scrollbar">
          {reorderItems.map((item) => (
            <motion.article
              key={item.id}
              whileHover={{ y: -3 }}
              transition={{ type: 'spring', stiffness: 400, damping: 28 }}
              className="snap-start shrink-0 w-[136px] sm:w-[168px]"
            >
              <div className="relative aspect-square rounded-2xl bg-white dark:bg-white/5 ring-1 ring-black/[0.04] dark:ring-white/8 overflow-hidden mb-2.5 sm:mb-3">
                <ProductImage
                  src={item.imageUrl}
                  alt={item.name}
                  className="w-full h-full object-cover"
                />
                <button
                  type="button"
                  onClick={() => {
                    const added = onAddToCart(item, 1, false);
                    if (added === false) {
                      onAddToast('Out of stock', `${item.name} can’t be added right now.`, 'warning');
                      return;
                    }
                    onAddToast('Added', item.name, 'success');
                  }}
                  className="absolute bottom-2 right-2 inline-flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-full bg-[#0284c7] text-white shadow-market hover:bg-[#0ea5e9] active:scale-95 transition-[colors,transform] cursor-pointer"
                  title={`Add ${item.name}`}
                  aria-label={`Add ${item.name}`}
                >
                  <Plus className="w-3.5 h-3.5 sm:w-4 sm:h-4" strokeWidth={2.5} />
                </button>
              </div>
              <h4 className="font-medium text-xs sm:text-[13px] leading-snug text-[#0f172a] dark:text-[#e7eef5] line-clamp-2">
                {item.name}
              </h4>
              <p className="mt-1 text-[11px] sm:text-xs font-semibold tabular-nums text-[#0284c7] dark:text-sky-300">
                {item.price.toLocaleString()} MMK
              </p>
            </motion.article>
          ))}
          {/* Trailing spacer so last card isn’t flush against the screen edge */}
          <div className="shrink-0 w-1 sm:hidden" aria-hidden />
        </div>
      </div>
    </section>
  );
}
