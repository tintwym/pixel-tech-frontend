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
    <section className="mb-12" aria-labelledby="recently-purchased-title">
      <div className="mb-5 flex items-end justify-between gap-4">
        <div>
          <h3
            id="recently-purchased-title"
            className="font-display font-semibold text-xl sm:text-2xl text-[#0f172a] dark:text-[#e7eef5] tracking-tight"
          >
            Recently purchased
          </h3>
          <p className="mt-0.5 text-sm text-[#64748b] dark:text-[#8a9eb0]">
            Quick picks from your past orders.
          </p>
        </div>
      </div>

      <div className="flex gap-4 overflow-x-auto pb-2 -mx-1 px-1 snap-x snap-mandatory no-scrollbar">
        {reorderItems.map((item) => (
          <motion.article
            key={item.id}
            whileHover={{ y: -3 }}
            transition={{ type: 'spring', stiffness: 400, damping: 28 }}
            className="snap-start shrink-0 w-[148px] sm:w-[168px] group"
          >
            <div className="relative aspect-square rounded-2xl bg-white/50 dark:bg-white/5 ring-1 ring-[#0284c7]/10 dark:ring-white/8 overflow-hidden mb-3">
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
                className="absolute bottom-2.5 right-2.5 inline-flex h-9 w-9 items-center justify-center rounded-full bg-[#0284c7] text-white shadow-market hover:bg-[#0ea5e9] active:scale-95 transition-[colors,transform] cursor-pointer"
                title={`Add ${item.name}`}
                aria-label={`Add ${item.name}`}
              >
                <Plus className="w-4 h-4" strokeWidth={2.5} />
              </button>
            </div>
            <h4 className="font-medium text-[13px] leading-snug text-[#0f172a] dark:text-[#e7eef5] line-clamp-2">
              {item.name}
            </h4>
            <p className="mt-1 text-xs font-semibold tabular-nums text-[#0284c7] dark:text-sky-300">
              {item.price.toLocaleString()} MMK
            </p>
          </motion.article>
        ))}
      </div>
    </section>
  );
}
