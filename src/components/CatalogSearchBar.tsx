'use client';

import React, { useEffect, useRef, useState } from 'react';
import {
  Search,
  X,
  Mic,
  Sparkles,
  Loader2,
  CornerDownLeft,
  ShoppingCart,
  Check,
} from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { GroceryItem } from '@/types';
import { fetchAiSearch } from '@/lib/aiApi';
import ProductImage from '@/components/ProductImage';

type AiState =
  | { query: string; status: 'loading' }
  | {
      query: string;
      status: 'done';
      summary: string;
      matches: { item: GroceryItem; reason: string }[];
    }
  | { query: string; status: 'error'; message: string };

function normalizeName(name: string): string {
  return name.toLowerCase().replace(/["“”']/g, '').replace(/\s+/g, ' ').trim();
}

interface CatalogSearchBarProps {
  products: GroceryItem[];
  value: string;
  onChange: (value: string) => void;
  /** When AI returns matches, pass their ids to filter the grid; `null` clears. */
  onAiFilter: (productIds: string[] | null) => void;
  onAddToCart: (item: GroceryItem, qty: number, isSub: boolean) => boolean | void;
  onOpenProduct: (item: GroceryItem) => void;
  onAddToast: (title: string, msg: string, type: 'success' | 'warning' | 'info') => void;
  isListening: boolean;
  onToggleSpeech: () => void;
}

export default function CatalogSearchBar({
  products,
  value,
  onChange,
  onAiFilter,
  onAddToCart,
  onOpenProduct,
  onAddToast,
  isListening,
  onToggleSpeech,
}: CatalogSearchBarProps) {
  const [panelOpen, setPanelOpen] = useState(false);
  const [ai, setAi] = useState<AiState | null>(null);
  const [addedItems, setAddedItems] = useState<Record<string, boolean>>({});
  const containerRef = useRef<HTMLDivElement>(null);
  const aiAbort = useRef<AbortController | null>(null);

  const trimmed = value.trim();
  const aiForQuery = ai && ai.query === trimmed ? ai : null;

  useEffect(() => {
    const onOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setPanelOpen(false);
      }
    };
    document.addEventListener('mousedown', onOutside);
    return () => {
      document.removeEventListener('mousedown', onOutside);
      aiAbort.current?.abort();
    };
  }, []);

  const askAi = async () => {
    const q = trimmed;
    if (q.length < 2) return;
    if (aiForQuery && aiForQuery.status === 'loading') return;
    if (aiForQuery && aiForQuery.status === 'done') {
      setPanelOpen(true);
      return;
    }

    aiAbort.current?.abort();
    const controller = new AbortController();
    aiAbort.current = controller;
    setPanelOpen(true);
    setAi({ query: q, status: 'loading' });
    onAiFilter(null);

    try {
      const res = await fetchAiSearch(q, controller.signal);
      const seen = new Set<string>();
      const matches = res.results.flatMap((m) => {
        const item =
          products.find((p) => p.apiId === m.productId) ||
          products.find((p) => normalizeName(p.name) === normalizeName(m.name));
        if (!item || seen.has(item.id)) return [];
        seen.add(item.id);
        return [{ item, reason: m.reason }];
      });
      const summary =
        res.results.length > 0 && matches.length === 0
          ? 'Pixel AI found matches, but they aren’t in the catalog loaded on this page. Refresh and try again.'
          : res.summary;
      setAi({ query: q, status: 'done', summary, matches });
      onAiFilter(matches.length ? matches.map((m) => m.item.id) : []);
    } catch (err) {
      if ((err as Error)?.name === 'AbortError') return;
      setAi({
        query: q,
        status: 'error',
        message: (err as Error)?.message || 'Couldn’t search with AI right now.',
      });
      onAiFilter(null);
    }
  };

  const clearAll = () => {
    aiAbort.current?.abort();
    onChange('');
    setAi(null);
    onAiFilter(null);
    setPanelOpen(false);
  };

  const handleAdd = (e: React.MouseEvent, item: GroceryItem) => {
    e.stopPropagation();
    const added = onAddToCart(item, 1, false);
    if (added === false) {
      onAddToast('Out of stock', `${item.name} can’t be added right now.`, 'warning');
      return;
    }
    setAddedItems((prev) => ({ ...prev, [item.id]: true }));
    onAddToast('Added to Cart', `1× ${item.name} added to cart`, 'success');
    setTimeout(() => {
      setAddedItems((prev) => ({ ...prev, [item.id]: false }));
    }, 1500);
  };

  return (
    <div ref={containerRef} className="relative flex-1">
      <Search className="pointer-events-none absolute left-3.5 top-1/2 z-10 -translate-y-1/2 w-4.5 h-4.5 text-[#64748b]/70" />
      <input
        id="grocery-search"
        type="text"
        value={value}
        placeholder='Search, or ask AI: “phone with great camera under 4M”'
        aria-label="Search products or ask Pixel AI"
        onFocus={() => setPanelOpen(true)}
        onChange={(e) => {
          onChange(e.target.value);
          setPanelOpen(true);
          // Typing again leaves AI filter until they re-ask or clear.
          if (ai && ai.query !== e.target.value.trim()) {
            onAiFilter(null);
          }
        }}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault();
            void askAi();
          } else if (e.key === 'Escape') {
            setPanelOpen(false);
          }
        }}
        className="w-full pl-11 pr-24 py-3 border border-[#0284c7]/15 dark:border-white/10 bg-white/80 dark:bg-[#121a24] text-[#0f172a] dark:text-[#e7eef5] rounded-2xl text-sm placeholder:text-[#64748b]/60 focus:outline-hidden focus:ring-2 focus:ring-[#0ea5e9]/40 transition-shadow"
      />

      <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-0.5">
        {value && (
          <button
            type="button"
            onClick={clearAll}
            aria-label="Clear search"
            className="p-1.5 rounded-xl text-[#64748b] hover:text-[#0284c7] hover:bg-[#e0f2fe]/60 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        )}
        <button
          type="button"
          onClick={() => void askAi()}
          disabled={trimmed.length < 2 || aiForQuery?.status === 'loading'}
          title="Ask Pixel AI"
          className="p-1.5 rounded-xl text-[#0284c7] hover:bg-[#e0f2fe]/70 disabled:opacity-40 cursor-pointer"
        >
          {aiForQuery?.status === 'loading' ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Sparkles className="w-4 h-4" />
          )}
        </button>
        <button
          type="button"
          onClick={onToggleSpeech}
          className={`p-1.5 rounded-xl transition-colors cursor-pointer ${
            isListening
              ? 'bg-red-500/15 text-red-600'
              : 'text-[#64748b] hover:text-[#0284c7] hover:bg-[#e0f2fe]/60'
          }`}
          title={isListening ? 'Stop' : 'Voice search'}
        >
          <Mic className="w-4 h-4" />
        </button>
      </div>

      <AnimatePresence>
        {panelOpen && trimmed.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.98 }}
            className="absolute top-full left-0 right-0 mt-2 z-30 overflow-hidden rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#121a24] shadow-2xl max-h-[min(28rem,70vh)] overflow-y-auto"
          >
            {!aiForQuery && (
              <button
                type="button"
                onClick={() => void askAi()}
                disabled={trimmed.length < 2}
                className="w-full flex items-center gap-2.5 px-3.5 py-3 text-left hover:bg-sky-50 dark:hover:bg-sky-500/10 transition-colors cursor-pointer disabled:opacity-60 border-b border-slate-100 dark:border-white/5"
              >
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-linear-to-br from-[#0284c7] to-[#6366f1] text-white">
                  <Sparkles className="h-3.5 w-3.5" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-semibold text-[#0f172a] dark:text-white truncate">
                    Ask Pixel AI: “{trimmed}”
                  </span>
                  <span className="block text-[11px] text-[#64748b] truncate">
                    Describe needs and budget — English or Burmese
                  </span>
                </span>
                <span className="hidden sm:inline-flex items-center gap-1 rounded-lg border border-slate-200 dark:border-white/10 px-1.5 py-0.5 text-[10px] font-semibold text-[#64748b]">
                  <CornerDownLeft className="h-3 w-3" /> Enter
                </span>
              </button>
            )}

            {aiForQuery?.status === 'loading' && (
              <div
                className="flex items-center gap-2.5 px-3.5 py-3.5 text-sm text-[#64748b]"
                role="status"
              >
                <Loader2 className="h-4 w-4 animate-spin text-sky-500" />
                Pixel AI is finding the best matches…
              </div>
            )}

            {aiForQuery?.status === 'error' && (
              <div className="px-3.5 py-3.5 text-sm" role="alert">
                <p className="font-medium text-rose-600 dark:text-rose-400">
                  {aiForQuery.message}
                </p>
                <button
                  type="button"
                  onClick={() => void askAi()}
                  className="mt-1.5 font-semibold text-[#0284c7] underline cursor-pointer"
                >
                  Try again
                </button>
              </div>
            )}

            {aiForQuery?.status === 'done' && (
              <div>
                <div className="flex items-start gap-2 px-3.5 pt-3.5 pb-2 border-b border-slate-100 dark:border-white/5">
                  <Sparkles className="mt-0.5 h-3.5 w-3.5 shrink-0 text-sky-500" />
                  <p className="text-sm leading-relaxed text-[#334155] dark:text-slate-200">
                    {aiForQuery.summary || 'Here are the best matches from the catalog.'}
                  </p>
                </div>
                {aiForQuery.matches.length === 0 ? (
                  <p className="px-3.5 py-4 text-sm text-[#64748b]">
                    No catalog matches for this request. Try a different description.
                  </p>
                ) : (
                  <div className="divide-y divide-slate-100 dark:divide-white/5">
                    {aiForQuery.matches.map(({ item, reason }) => (
                      <div
                        key={item.id}
                        className="flex items-center gap-3 p-3 hover:bg-slate-50 dark:hover:bg-[#1a242f] transition-colors"
                      >
                        <button
                          type="button"
                          onClick={() => {
                            onOpenProduct(item);
                            setPanelOpen(false);
                          }}
                          className="flex min-w-0 flex-1 items-center gap-3 text-left cursor-pointer"
                        >
                          <ProductImage
                            src={item.imageUrl}
                            alt={item.name}
                            className="h-11 w-11 shrink-0 rounded-xl object-cover border border-slate-200 dark:border-white/10"
                          />
                          <span className="min-w-0">
                            <span className="block truncate text-sm font-semibold text-[#0f172a] dark:text-white">
                              {item.name}
                            </span>
                            <span className="mt-0.5 block text-[11px] text-[#64748b]">
                              {item.brand} · {item.price.toLocaleString()} MMK
                            </span>
                            {reason && (
                              <span className="mt-0.5 block text-[11px] leading-snug text-slate-500 dark:text-slate-400 line-clamp-2">
                                {reason}
                              </span>
                            )}
                          </span>
                        </button>
                        <button
                          type="button"
                          onClick={(e) => handleAdd(e, item)}
                          className={`shrink-0 rounded-xl px-3 py-1.5 text-xs font-semibold text-white cursor-pointer ${
                            addedItems[item.id]
                              ? 'bg-sky-600'
                              : 'bg-[#0284c7] hover:bg-[#0ea5e9]'
                          }`}
                        >
                          {addedItems[item.id] ? (
                            <span className="inline-flex items-center gap-1">
                              <Check className="w-3.5 h-3.5" /> Added
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1">
                              <ShoppingCart className="w-3.5 h-3.5" /> Add
                            </span>
                          )}
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
