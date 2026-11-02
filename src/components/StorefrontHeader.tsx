'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { AnimatePresence, motion } from 'motion/react';
import {
  Bell,
  ShoppingCart,
  Moon,
  Sun,
  FileText,
  LogIn,
  Monitor,
  Cpu,
  Search,
  X,
} from 'lucide-react';
import CatalogSearchBar from '@/components/CatalogSearchBar';
import ProfileMenu from '@/components/ProfileMenu';
import { GroceryItem } from '@/types';
import { isSmartphoneCategory } from '@/data/mobileOptions';
import { isLaptopCategory } from '@/data/laptopOptions';
import { isConfigurableIpad, isTabletCategory } from '@/data/tabletOptions';

export const NAV_CATEGORIES: { label: string; category: string }[] = [
  { label: 'Phones', category: 'Smartphones' },
  { label: 'Laptops', category: 'Laptops' },
  { label: 'Tablets', category: 'Tablets' },
  { label: 'Audio', category: 'Audio / Headphones' },
  { label: 'Watches', category: 'Smartwatches / Wearables' },
];

export function jumpToCatalogCategory(category: string) {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(
    new CustomEvent('pixel-filter-category', { detail: category })
  );
  document
    .getElementById('catalog-section')
    ?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

type ThemePref = 'system' | 'light' | 'dark';

type StorefrontHeaderProps = {
  products: GroceryItem[];
  searchQuery: string;
  onSearchChange: (value: string) => void;
  onAiFilter: (productIds: string[] | null) => void;
  selectedCategory: string;
  onSelectCategory: (category: string) => void;
  cartCount: number;
  unreadNotifications: number;
  themePref: ThemePref;
  isDarkMode: boolean;
  themeLabel: string;
  onToggleTheme: () => void;
  onOpenOrders: () => void;
  onOpenNotifications: () => void;
  onOpenCart: () => void;
  onOpenAuth: () => void;
  isSignedIn: boolean;
  profileName: string;
  profileAvatarUrl?: string;
  profileActive: boolean;
  onOpenProfile: () => void;
  onSignOut: () => void;
  onAddToCart: (
    item: GroceryItem,
    qty: number,
    isSub: boolean
  ) => boolean | void;
  onAddToast: (title: string, msg: string, type: 'success' | 'warning' | 'info') => void;
  isListening: boolean;
  onToggleSpeech: () => void;
  onBrandClick: () => void;
};

function openProductDetails(item: GroceryItem) {
  window.dispatchEvent(new CustomEvent('pixel-open-product', { detail: item }));
  document
    .getElementById('catalog-section')
    ?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

export default function StorefrontHeader({
  products,
  searchQuery,
  onSearchChange,
  onAiFilter,
  selectedCategory,
  onSelectCategory,
  cartCount,
  unreadNotifications,
  themePref,
  isDarkMode,
  themeLabel,
  onToggleTheme,
  onOpenOrders,
  onOpenNotifications,
  onOpenCart,
  onOpenAuth,
  isSignedIn,
  profileName,
  profileAvatarUrl,
  profileActive,
  onOpenProfile,
  onSignOut,
  onAddToCart,
  onAddToast,
  isListening,
  onToggleSpeech,
  onBrandClick,
}: StorefrontHeaderProps) {
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);

  useEffect(() => {
    if (!mobileSearchOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMobileSearchOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [mobileSearchOpen]);

  const handleQuickAdd = (item: GroceryItem, qty: number, isSub: boolean) => {
    const needsConfig =
      isSmartphoneCategory(item.category) ||
      isLaptopCategory(item.category) ||
      (isTabletCategory(item.category) && isConfigurableIpad(item.name));
    if (needsConfig) {
      openProductDetails(item);
      onAddToast('Choose options', 'Pick finish and storage before adding to cart.', 'info');
      return;
    }
    return onAddToCart(item, qty, isSub);
  };

  const selectDepartment = (category: string) => {
    onSelectCategory(category);
    jumpToCatalogCategory(category);
    setMobileSearchOpen(false);
  };

  const searchBar = (
    <CatalogSearchBar
      products={products}
      value={searchQuery}
      onChange={onSearchChange}
      onAiFilter={onAiFilter}
      onAddToCart={handleQuickAdd}
      onOpenProduct={(item) => {
        openProductDetails(item);
        setMobileSearchOpen(false);
      }}
      onAddToast={onAddToast}
      isListening={isListening}
      onToggleSpeech={onToggleSpeech}
      variant="header"
    />
  );

  return (
    <header className="sticky top-0 z-40 bg-[#eef4f8]/92 dark:bg-[#0B1220]/94 backdrop-blur-xl border-b border-[#0284c7]/10 dark:border-white/8 transition-colors pt-[env(safe-area-inset-top)]">
      {/* Row 1 — brand · search · utilities */}
      <div className="max-w-7xl mx-auto px-3 sm:px-5">
        <div className="h-14 sm:h-16 flex items-center gap-2 sm:gap-3">
          <Link
            href="/"
            onClick={onBrandClick}
            className="flex items-center gap-2.5 shrink-0 no-underline min-w-0"
          >
            <div className="w-9 h-9 rounded-2xl bg-[#0284c7] text-white flex items-center justify-center ring-1 ring-[#0284c7]/20 shadow-market shrink-0">
              <Cpu className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <h1 className="font-display font-semibold text-[1.05rem] sm:text-xl tracking-tight leading-none text-[#0f172a] dark:text-[#e7eef5] truncate">
                Pixel Tech
              </h1>
              <span className="hidden sm:block text-[10px] font-medium text-[#64748b] dark:text-[#8a9eb0] mt-0.5 truncate">
                Electronics · Yangon
              </span>
            </div>
          </Link>

          <div className="hidden md:block flex-1 min-w-0 max-w-xl mx-auto px-2">
            {searchBar}
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0 ml-auto">
            <button
              type="button"
              className="md:hidden inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-[#0284c7]/15 dark:border-white/10 bg-white/85 dark:bg-[#121a24] text-[#0f172a] dark:text-[#e7eef5] cursor-pointer"
              aria-label={mobileSearchOpen ? 'Close search' : 'Search products'}
              aria-expanded={mobileSearchOpen}
              onClick={() => setMobileSearchOpen((v) => !v)}
            >
              {mobileSearchOpen ? <X className="w-4 h-4" /> : <Search className="w-4 h-4" />}
            </button>

            <div className="hidden sm:flex items-center rounded-2xl border border-[#0284c7]/12 dark:border-white/10 bg-white/75 dark:bg-[#121a24]/90 p-0.5">
              <button
                type="button"
                onClick={onOpenOrders}
                className="inline-flex h-9 items-center gap-1.5 rounded-[0.85rem] px-2.5 text-[#0f172a] dark:text-[#e7eef5] hover:bg-[#e0f2fe]/80 dark:hover:bg-white/5 transition-colors cursor-pointer"
                title="Orders"
                aria-label="View orders"
              >
                <FileText className="w-4 h-4 text-[#0ea5e9]" />
                <span className="hidden lg:inline text-xs font-semibold">Orders</span>
              </button>
              <button
                type="button"
                onClick={onToggleTheme}
                className="inline-flex h-9 w-9 items-center justify-center rounded-[0.85rem] text-[#64748b] dark:text-[#8a9eb0] hover:bg-[#e0f2fe]/80 dark:hover:bg-white/5 transition-colors cursor-pointer"
                aria-label={themeLabel}
                title={themeLabel}
              >
                {themePref === 'system' ? (
                  <Monitor className="w-4 h-4 text-[#0284c7]" />
                ) : isDarkMode ? (
                  <Sun className="w-4 h-4 text-amber-400" />
                ) : (
                  <Moon className="w-4 h-4" />
                )}
              </button>
              <button
                type="button"
                id="notif-toggle-btn"
                onClick={onOpenNotifications}
                className="relative inline-flex h-9 w-9 items-center justify-center rounded-[0.85rem] text-[#64748b] dark:text-[#8a9eb0] hover:bg-[#e0f2fe]/80 dark:hover:bg-white/5 transition-colors cursor-pointer"
                aria-label="Open notifications"
              >
                <Bell className="w-4 h-4" />
                {unreadNotifications > 0 && (
                  <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-[#c45c26] rounded-full" />
                )}
              </button>
            </div>

            <motion.button
              type="button"
              id="cart-toggle-btn"
              onClick={onOpenCart}
              whileTap={{ scale: 0.97 }}
              className="inline-flex h-10 sm:h-9 items-center gap-1.5 rounded-2xl bg-[#0284c7] px-3 sm:px-3.5 text-white font-semibold hover:bg-[#0ea5e9] transition-colors relative cursor-pointer shadow-market"
              aria-label="View shopping cart"
            >
              <ShoppingCart className="w-4 h-4" />
              <span className="hidden sm:inline text-xs tracking-wide">Cart</span>
              <AnimatePresence>
                {cartCount > 0 && (
                  <motion.span
                    key={cartCount}
                    initial={{ scale: 0.6, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.6, opacity: 0 }}
                    className="absolute -top-1.5 -right-1.5 sm:static sm:ml-0.5 min-w-5 h-5 px-1.5 bg-white text-[#0284c7] text-[10px] font-bold rounded-full inline-flex items-center justify-center"
                  >
                    {cartCount > 99 ? '99+' : cartCount}
                  </motion.span>
                )}
              </AnimatePresence>
            </motion.button>

            {isSignedIn ? (
              <ProfileMenu
                name={profileName}
                avatarUrl={profileAvatarUrl}
                active={profileActive}
                onOpenProfile={onOpenProfile}
                onSignOut={onSignOut}
              />
            ) : (
              <button
                type="button"
                onClick={onOpenAuth}
                className="inline-flex h-10 sm:h-9 items-center gap-1.5 rounded-2xl border border-[#0284c7]/20 bg-white/85 dark:bg-[#121a24] px-2.5 sm:px-3 text-[#0f172a] dark:text-[#e7eef5] text-xs font-semibold hover:bg-white dark:hover:bg-[#1a242f] transition-colors cursor-pointer"
                aria-label="Sign in or create account"
              >
                <LogIn className="w-4 h-4" />
                <span className="hidden sm:inline">Sign in</span>
              </button>
            )}
          </div>
        </div>

        {/* Mobile expandable search — no height clip so AI results panel can overflow */}
        <AnimatePresence>
          {mobileSearchOpen && (
            <motion.div
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.18 }}
              className="md:hidden relative z-50 pb-3"
            >
              {searchBar}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Row 2 — department rail */}
      <nav
        className="hidden md:block border-t border-[#0284c7]/8 dark:border-white/6"
        aria-label="Shop by department"
      >
        <div className="max-w-7xl mx-auto px-3 sm:px-5">
          <div className="flex items-center gap-0.5 h-11 overflow-x-auto no-scrollbar">
            <button
              type="button"
              onClick={() => selectDepartment('All Categories')}
              className={`relative px-3.5 h-full text-[13px] font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                selectedCategory === 'All Categories'
                  ? 'text-[#0284c7] dark:text-sky-300'
                  : 'text-[#475569] dark:text-[#94a3b8] hover:text-[#0284c7] dark:hover:text-sky-300'
              }`}
            >
              All
              {selectedCategory === 'All Categories' && (
                <motion.span
                  layoutId="dept-underline"
                  className="absolute inset-x-2 bottom-0 h-0.5 rounded-full bg-[#0284c7] dark:bg-sky-400"
                />
              )}
            </button>
            {NAV_CATEGORIES.map(({ label, category }) => {
              const active = selectedCategory === category;
              return (
                <button
                  key={category}
                  type="button"
                  onClick={() => selectDepartment(category)}
                  className={`relative px-3.5 h-full text-[13px] font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                    active
                      ? 'text-[#0284c7] dark:text-sky-300'
                      : 'text-[#475569] dark:text-[#94a3b8] hover:text-[#0284c7] dark:hover:text-sky-300'
                  }`}
                >
                  {label}
                  {active && (
                    <motion.span
                      layoutId="dept-underline"
                      className="absolute inset-x-2 bottom-0 h-0.5 rounded-full bg-[#0284c7] dark:bg-sky-400"
                    />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </nav>
    </header>
  );
}
