'use client';

import React, { useState, useEffect, useRef, useTransition } from 'react';
import { Cpu, Clock, Package, BookOpen, Plus, Check, Loader2 } from 'lucide-react';
import { GroceryItem, CartItem } from '@/types';
import { motion, AnimatePresence } from 'motion/react';
import { fetchSmartBundles, SmartBundle } from '@/lib/aiApi';

interface SmartRecipesProps {
  cart: CartItem[];
  products: GroceryItem[];
  onAddToCart: (item: GroceryItem, qty: number, isSub: boolean) => void;
  onAddToast: (title: string, msg: string, type: 'success' | 'warning' | 'info') => void;
}

export default function SmartRecipes({
  cart,
  products,
  onAddToCart,
  onAddToast
}: SmartRecipesProps) {
  const [recipes, setRecipes] = useState<SmartBundle[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const abortRef = useRef<AbortController | null>(null);

  const cartItemNames = cart.map(c => c.item.name);

  // Load initial/default recipes or fetch when cart changes
  const fetchRecipes = async (items: string[], signal: AbortSignal) => {
    setLoading(true);
    setError(null);
    try {
      const bundles = await fetchSmartBundles(items, signal);
      if (signal.aborted) return;
      setRecipes(bundles);
    } catch (err) {
      if ((err as Error)?.name === 'AbortError') return;
      setError((err as Error)?.message || 'Couldn’t generate bundle ideas. Please try again.');
    } finally {
      if (!signal.aborted) setLoading(false);
    }
  };

  const refreshRecipes = () => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    fetchRecipes(cartItemNames, controller.signal);
  };

  useEffect(() => {
    if (cartItemNames.length === 0) {
      setRecipes([]);
      setError(null);
      setLoading(false);
      return;
    }
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    startTransition(() => {
      fetchRecipes(cartItemNames, controller.signal);
    });
    return () => controller.abort();
  }, [cartItemNames.join(',')]);

  // Find catalog matches for missing accessory names
  const findCatalogMatch = (ingredientName: string): GroceryItem | null => {
    const cleanName = ingredientName.toLowerCase().trim();
    
    // First pass: exact or substring match in name
    let match = products.find(g => 
      g.name.toLowerCase().includes(cleanName) || 
      cleanName.includes(g.name.toLowerCase())
    );
    if (match) return match;

    // Second pass: split words and match
    const words = cleanName.split(/\s+/).filter(w => w.length > 3);
    for (const word of words) {
      match = products.find(g => g.name.toLowerCase().includes(word));
      if (match) return match;
    }

    // Third pass: electronics category fallbacks
    if (cleanName.includes('case') || cleanName.includes('sleeve') || cleanName.includes('protector') || cleanName.includes('hub') || cleanName.includes('cable') || cleanName.includes('charger')) {
      match = products.find(g => g.category.toLowerCase().includes('accessories'));
    } else if (cleanName.includes('earbud') || cleanName.includes('headphone') || cleanName.includes('audio')) {
      match = products.find(g => g.category.toLowerCase().includes('audio'));
    } else if (cleanName.includes('ssd') || cleanName.includes('storage') || cleanName.includes('drive')) {
      match = products.find(g => g.name.toLowerCase().includes('ssd') || g.category.toLowerCase().includes('storage'));
    }

    return match || null;
  };

  const handleAddMissingIngredient = (ingredientName: string) => {
    const match = findCatalogMatch(ingredientName);
    if (match) {
      onAddToCart(match, 1, false);
      onAddToast(
        'Ingredient Added',
        `Matched "${ingredientName}" with "${match.name}" and added to cart.`,
        'success'
      );
    } else {
      onAddToast(
        'Product Not Found',
        `We couldn't find an exact match for "${ingredientName}" in our catalog.`,
        'warning'
      );
    }
  };

  const handleAddAllMissing = (missingIngredients: string[]) => {
    let addedCount = 0;
    const notFound: string[] = [];

    missingIngredients.forEach(ing => {
      const match = findCatalogMatch(ing);
      if (match) {
        onAddToCart(match, 1, false);
        addedCount++;
      } else {
        notFound.push(ing);
      }
    });

    if (addedCount > 0) {
      onAddToast(
        'Added Ingredients',
        `Successfully added ${addedCount} matching ingredients to your active cart!`,
        'success'
      );
    }
    if (notFound.length > 0) {
      onAddToast(
        'Some Items Unavailable',
        `Could not match: ${notFound.slice(0, 2).join(', ')}${notFound.length > 2 ? '...' : ''}`,
        'warning'
      );
    }
  };

  return (
    <section className="mt-16 pt-10 border-t border-[#0284c7]/12 dark:border-white/10">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6">
        <div>
          <h3 className="font-display font-semibold text-2xl text-[#0f172a] dark:text-[#e7eef5]">
            Smart bundles
          </h3>
          <p className="mt-1 text-sm text-[#64748b] dark:text-[#8a9eb0]">
            Setup kits from devices already in your cart.
          </p>
        </div>

        <button
          type="button"
          onClick={refreshRecipes}
          disabled={loading || cartItemNames.length === 0}
          className="px-4 py-2.5 bg-[#0284c7] hover:bg-[#0ea5e9] text-white rounded-2xl text-sm font-semibold transition-colors disabled:opacity-40 flex items-center justify-center gap-2 cursor-pointer"
        >
          {loading ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <Cpu className="w-3.5 h-3.5" />
          )}
          <span>Refresh ideas</span>
        </button>
      </div>

      <AnimatePresence mode="wait">
        {loading ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center justify-center py-12 space-y-3"
          >
            <div className="relative">
              <div className="w-12 h-12 border-4 border-[#0284c7]/20 border-t-[#0ea5e9] rounded-full animate-spin"></div>
              <Cpu className="w-6 h-6 text-[#0ea5e9] absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-bounce" />
            </div>
            <p className="text-xs font-medium text-[#0284c7] dark:text-sky-400 animate-pulse">
              Consulting Gemini tech specialist...
            </p>
            <p className="text-[10px] text-[#64748b] max-w-xs text-center">
              Analyzing devices in your cart to suggest compatible accessories and setup kits.
            </p>
          </motion.div>
        ) : error ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-center py-8"
          >
            <p className="text-xs text-red-500 font-semibold mb-2">{error}</p>
            <button
              onClick={refreshRecipes}
              className="text-xs font-bold text-[#0284c7] underline hover:text-[#0ea5e9]"
            >
              Retry generating bundles
            </button>
          </motion.div>
        ) : recipes.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="p-8 border border-dashed border-[#0284c7]/20 dark:border-white/10 rounded-2xl text-center py-12"
          >
            <Package className="w-10 h-10 text-slate-300 dark:text-slate-700 mx-auto mb-3" />
            <p className="text-sm font-semibold text-[#64748b]">Add a few devices first</p>
            <p className="text-xs text-[#64748b]/80 mt-1 max-w-sm mx-auto">
              We&apos;ll suggest accessory kits from what&apos;s in your cart.
            </p>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="grid grid-cols-1 lg:grid-cols-2 gap-6"
          >
            {recipes.map((recipe, idx) => (
              <div
                key={idx}
                className="bg-white/90 dark:bg-[#121a24] rounded-2xl p-5 shadow-market flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <h4 className="font-display font-semibold text-sm md:text-base text-[#0f172a] dark:text-[#e7eef5] leading-tight">
                      {recipe.name}
                    </h4>
                    <span className="shrink-0 text-[10px] font-semibold px-2 py-0.5 rounded-md bg-[#e0f2fe] text-[#0284c7] dark:bg-[#0c4a6e] dark:text-[#e0f2fe]">
                      {recipe.difficulty}
                    </span>
                  </div>

                  <p className="text-xs text-[#64748b] dark:text-[#8a9eb0] mb-4 line-clamp-2">
                    {recipe.description}
                  </p>

                  <div className="flex items-center gap-3 mb-4 text-[11px] font-mono text-[#64748b]">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 shrink-0" />
                      {recipe.setupTime}
                    </span>
                    <span className="w-1 h-1 bg-slate-300 dark:bg-white/10 rounded-full"></span>
                    <span className="flex items-center gap-1 text-[#0284c7] font-semibold">
                      <Check className="w-3.5 h-3.5" />
                      {recipe.cartItems.length} cart match
                    </span>
                  </div>

                  {recipe.cartItems.length > 0 && (
                    <div className="mb-3">
                      <span className="text-[10px] font-semibold text-[#64748b] uppercase tracking-wider block mb-1">In Your Cart</span>
                      <div className="flex flex-wrap gap-1.5">
                        {recipe.cartItems.map((item, i) => (
                          <span
                            key={i}
                            className="inline-flex items-center text-[10px] font-medium bg-[#e0f2fe] text-[#0284c7] dark:bg-[#0c4a6e]/40 dark:text-sky-300 px-2 py-0.5 rounded-full"
                          >
                            ✓ {item}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {recipe.suggestedAddOns.length > 0 && (
                    <div className="mb-4">
                      <span className="text-[10px] font-semibold text-[#64748b] uppercase tracking-wider block mb-1.5">Suggested add-ons</span>
                      <div className="flex flex-wrap gap-1.5">
                        {recipe.suggestedAddOns.map((item, i) => {
                          const catalogItem = findCatalogMatch(item);
                          return (
                            <button
                              key={i}
                              onClick={() => handleAddMissingIngredient(item)}
                              className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-1 rounded-lg transition-all cursor-pointer ${
                                catalogItem
                                  ? 'bg-[#e0f2fe] hover:bg-sky-200 text-[#0284c7] border border-[#0284c7]/20'
                                  : 'bg-white/60 dark:bg-[#0B1220] text-[#64748b] border border-transparent'
                              }`}
                              title={catalogItem ? `Add ${catalogItem.name}` : `Not available directly`}
                            >
                              <Plus className="w-2.5 h-2.5" />
                              <span>{item}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  <div className="border-t border-[#0284c7]/10 dark:border-white/5 pt-3 mb-4">
                    <span className="text-[10px] font-semibold text-[#64748b] uppercase tracking-wider mb-2 flex items-center gap-1">
                      <BookOpen className="w-3 h-3" /> Steps
                    </span>
                    <ol className="list-decimal list-inside space-y-1.5 text-xs text-[#64748b] dark:text-[#8a9eb0]">
                      {recipe.steps.map((step, i) => (
                        <li key={i} className="leading-relaxed">
                          <span className="font-medium text-[#0f172a] dark:text-[#e7eef5]">{step}</span>
                        </li>
                      ))}
                    </ol>
                  </div>
                </div>

                {recipe.suggestedAddOns.length > 0 && (
                  <button
                    onClick={() => handleAddAllMissing(recipe.suggestedAddOns)}
                    className="w-full mt-2 py-2.5 bg-[#0284c7] hover:bg-[#0ea5e9] text-white rounded-2xl text-xs font-semibold transition-colors flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Add available add-ons</span>
                  </button>
                )}
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
