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
    <section className="mb-10">
      <div className="mb-4">
        <h3 className="font-display font-semibold text-xl text-[#0f172a] dark:text-[#e7eef5]">
          Buy again
        </h3>
        <p className="text-sm text-[#64748b] dark:text-[#8a9eb0]">Your usuals, one tap away.</p>
      </div>

      <div className="flex gap-3 overflow-x-auto pb-1 -mx-1 px-1 snap-x">
        {reorderItems.map((item) => (
          <motion.div
            key={item.id}
            whileHover={{ y: -2 }}
            className="snap-start shrink-0 w-[220px] flex items-center gap-3 p-2.5 rounded-2xl bg-white/80 dark:bg-[#121a24] shadow-market"
          >
            <ProductImage
              src={item.imageUrl}
              alt={item.name}
              className="w-12 h-12 rounded-xl object-cover shrink-0"
            />
            <div className="flex-1 min-w-0">
              <h4 className="font-medium text-xs text-[#0f172a] dark:text-[#e7eef5] leading-snug line-clamp-2">
                {item.name}
              </h4>
              <p className="text-[10px] text-[#64748b] mt-0.5 tabular-nums">
                {item.price.toLocaleString()} MMK
              </p>
            </div>
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
              className="p-2 bg-[#0284c7] hover:bg-[#0ea5e9] text-white rounded-xl cursor-pointer transition-colors shrink-0"
              title={`Add ${item.name}`}
              aria-label={`Add ${item.name}`}
            >
              <Plus className="w-4 h-4" strokeWidth={2.5} />
            </button>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
