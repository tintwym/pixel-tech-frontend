'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Search, X, Mic, ShoppingCart, Sparkles, Check, Loader2, CornerDownLeft } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { GroceryItem } from '@/types';
import { fuzzySearchProducts } from '@/utils/fuzzySearch';
import { fetchAiSearch } from '@/lib/aiApi';
import ProductImage from '@/components/ProductImage';

interface NavbarSearchProps {
  products: GroceryItem[];
  onAddToCart: (item: GroceryItem, qty: number, isSub: boolean) => boolean | void;
  onOpenVoiceModal: () => void;
  onAddToast: (title: string, msg: string, type: 'success' | 'warning' | 'info') => void;
}

type AiState =
  | { query: string; status: 'loading' }
  | { query: string; status: 'done'; summary: string; matches: { item: GroceryItem; reason: string }[] }
  | { query: string; status: 'error'; message: string };

function normalizeName(name: string): string {
  return name.toLowerCase().replace(/["“”']/g, '').replace(/\s+/g, ' ').trim();
}

export default function NavbarSearch({
  products,
  onAddToCart,
  onOpenVoiceModal,
  onAddToast
}: NavbarSearchProps) {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [addedItems, setAddedItems] = useState<Record<string, boolean>>({});
  const [ai, setAi] = useState<AiState | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const aiAbort = useRef<AbortController | null>(null);

  const trimmed = query.trim();
  const results = fuzzySearchProducts(query, products);
  /** Only show the AI answer for the exact text it was asked about. */
  const aiForQuery = ai && ai.query === trimmed ? ai : null;

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      aiAbort.current?.abort();
    };
  }, []);

  const askAi = async () => {
    const q = trimmed;
    if (q.length < 2 || (aiForQuery && aiForQuery.status !== 'error')) return;
    aiAbort.current?.abort();
    const controller = new AbortController();
    aiAbort.current = controller;
    setIsOpen(true);
    setAi({ query: q, status: 'loading' });
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
    } catch (err) {
      if ((err as Error)?.name === 'AbortError') return;
      setAi({ query: q, status: 'error', message: (err as Error)?.message || 'Couldn’t search with AI right now.' });
    }
  };

  const handleAddToCartQuick = (e: React.MouseEvent, item: GroceryItem) => {
    e.stopPropagation();
    const added = onAddToCart(item, 1, false);
    if (added === false) {
      onAddToast('Out of stock', `${item.name} can’t be added right now.`, 'warning');
      return;
    }
    setAddedItems(prev => ({ ...prev, [item.id]: true }));
    onAddToast('Added to Cart', `1x ${item.name} added to cart`, 'success');
    setTimeout(() => {
      setAddedItems(prev => ({ ...prev, [item.id]: false }));
    }, 1500);
  };

  const productRow = (item: GroceryItem, reason?: string) => (
    <div
      key={item.id}
      className="p-2.5 hover:bg-slate-50 dark:hover:bg-[#1a242f] transition-colors flex items-center justify-between gap-3 group"
    >
      <div className="flex items-center gap-3 min-w-0">
        <ProductImage
          src={item.imageUrl}
          alt={item.name}
          className="w-10 h-10 rounded-xl object-cover border border-slate-200 dark:border-white/10 shrink-0"
        />
        <div className="min-w-0">
          <h4 className="font-bold text-xs text-slate-800 dark:text-white truncate">{item.name}</h4>
          <div className="flex flex-wrap items-center gap-1.5 mt-0.5">
            <span className="text-[10px] text-slate-400 font-medium">{item.category}</span>
            <span className="text-[10px] text-slate-300 dark:text-slate-600">•</span>
            <span className="text-[10px] font-semibold text-sky-600 dark:text-sky-400">
              {item.price.toLocaleString()} MMK
            </span>
            {!reason &&
              item.featuresRestrictions.slice(0, 2).map((d, i) => (
                <span key={i} className="text-[9px] px-1.5 py-0.2 bg-sky-500/10 text-sky-600 dark:text-sky-400 rounded-md font-semibold">
                  {d}
                </span>
              ))}
          </div>
          {reason && (
            <p className="mt-0.5 text-[11px] leading-snug text-slate-500 dark:text-slate-400 line-clamp-2">{reason}</p>
          )}
        </div>
      </div>

      <button
        onClick={(e) => handleAddToCartQuick(e, item)}
        className={`px-3 py-1.5 text-xs font-semibold rounded-xl transition-all flex items-center gap-1 cursor-pointer shrink-0 ${
          addedItems[item.id] ? 'bg-sky-600 text-white' : 'bg-[#0284c7] hover:bg-[#0ea5e9] text-white shadow-xs'
        }`}
      >
        {addedItems[item.id] ? (
          <>
            <Check className="w-3.5 h-3.5" /> Added
          </>
        ) : (
          <>
            <ShoppingCart className="w-3.5 h-3.5" /> Add
          </>
        )}
      </button>
    </div>
  );

  const aiPanel = () => {
    if (!aiForQuery) {
      return (
        <button
          type="button"
          onClick={askAi}
          disabled={trimmed.length < 2}
          className="w-full flex items-center gap-2.5 px-3 py-2.5 text-left hover:bg-sky-50 dark:hover:bg-sky-500/10 transition-colors cursor-pointer disabled:cursor-default disabled:opacity-60"
        >
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-linear-to-br from-[#0284c7] to-[#a78bfa] text-white">
            <Sparkles className="h-3.5 w-3.5" />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-xs font-semibold text-slate-800 dark:text-white truncate">
              Ask Pixel AI: “{trimmed}”
            </span>
            <span className="block text-[10px] text-slate-400 truncate">Describe needs and budget — English or Burmese</span>
          </span>
          <span className="hidden sm:inline-flex items-center gap-1 rounded-md border border-slate-200 dark:border-white/10 px-1.5 py-0.5 text-[10px] font-semibold text-slate-400">
            <CornerDownLeft className="h-3 w-3" /> Enter
          </span>
        </button>
      );
    }

    if (aiForQuery.status === 'loading') {
      return (
        <div className="flex items-center gap-2.5 px-3 py-3 text-xs text-slate-500 dark:text-slate-400" role="status">
          <Loader2 className="h-4 w-4 animate-spin text-sky-500" />
          Pixel AI is finding the best matches…
        </div>
      );
    }

    if (aiForQuery.status === 'error') {
      return (
        <div className="px-3 py-3 text-xs" role="alert">
          <p className="font-medium text-rose-600 dark:text-rose-400">{aiForQuery.message}</p>
          <button type="button" onClick={askAi} className="mt-1 font-semibold text-[#0284c7] underline cursor-pointer">
            Try again
          </button>
        </div>
      );
    }

    return (
      <div>
        <div className="flex items-start gap-2 px-3 pt-3 pb-2">
          <Sparkles className="mt-0.5 h-3.5 w-3.5 shrink-0 text-sky-500" />
          <p className="text-xs leading-relaxed text-slate-700 dark:text-slate-200">{aiForQuery.summary}</p>
        </div>
        {aiForQuery.matches.length > 0 && (
          <div className="divide-y divide-slate-100 dark:divide-white/5">
            {aiForQuery.matches.map(({ item, reason }) => productRow(item, reason))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div ref={containerRef} className="relative flex-1 max-w-md mx-2 sm:mx-4 font-sans">
      <div className="relative flex items-center">
        <input
          type="text"
          value={query}
          onFocus={() => setIsOpen(true)}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              askAi();
            } else if (e.key === 'Escape') {
              setIsOpen(false);
            }
          }}
          aria-label="Search products or ask Pixel AI"
          placeholder="Search, or ask AI: “phone with great camera under 4M”"
          className="w-full pl-9 pr-16 py-1.5 sm:py-2 bg-white/70 dark:bg-[#121a24] hover:bg-white dark:hover:bg-[#1a242f] border border-[#0284c7]/15 dark:border-white/10 rounded-2xl text-xs font-medium text-[#0f172a] dark:text-[#e7eef5] placeholder-[#64748b]/70 focus:outline-none focus:border-[#0ea5e9] focus:ring-2 focus:ring-[#0ea5e9]/25 transition-all"
        />
        <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />

        <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
          {query && (
            <button
              onClick={() => {
                aiAbort.current?.abort();
                setQuery('');
                setAi(null);
                setIsOpen(false);
              }}
              aria-label="Clear search"
              className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-white rounded-full hover:bg-slate-200 dark:hover:bg-white/10 transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}

          <button
            onClick={onOpenVoiceModal}
            className="p-1.5 bg-sky-500/10 hover:bg-sky-500/20 text-sky-600 dark:text-sky-400 rounded-xl transition-colors cursor-pointer"
            title="Voice Search & Commands"
          >
            <Mic className="w-3.5 h-3.5 animate-pulse" />
          </button>
        </div>
      </div>

      <AnimatePresence>
        {isOpen && trimmed.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.98 }}
            className="absolute top-full left-0 mt-2 z-90 w-full min-w-[min(28rem,calc(100vw-1.5rem))] bg-white dark:bg-[#121a24] border border-slate-200 dark:border-white/10 rounded-2xl shadow-2xl overflow-hidden max-h-[28rem] overflow-y-auto"
          >
            <div className="border-b border-slate-100 dark:border-white/5">{aiPanel()}</div>

            <div className="p-2 border-b border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-[#1a242f] flex items-center justify-between gap-2 whitespace-nowrap text-[11px] text-slate-400 font-bold">
              <span>Instant matches ({results.length})</span>
              <span className="text-[10px] text-sky-500 font-mono">Name / Features / Category</span>
            </div>

            {results.length === 0 ? (
              <div className="p-5 text-center text-xs text-slate-400">
                No instant matches for “{trimmed}”. Press Enter to ask Pixel AI.
              </div>
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-white/5">
                {results.map((item) => productRow(item))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
