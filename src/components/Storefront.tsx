'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Bell, ShoppingCart, Moon, Sun, MapPin, TrendingUp, Home, Truck,
  Mic, FileText, LogIn, Monitor, Cpu, ArrowDown
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

import { GroceryItem, CartItem, Order, UserProfile, OrderStatus } from '@/types';
import { INITIAL_GROCERIES } from '@/data/products';

import GroceryCatalog from '@/components/GroceryCatalog';
import CartAndCheckout from '@/components/CartAndCheckout';
import OrderTracker from '@/components/OrderTracker';
import UserProfileModal from '@/components/UserProfileModal';
import AuthModal from '@/components/AuthModal';
import NotificationCenter, { NotificationMsg } from '@/components/NotificationCenter';
import ToastContainer, { ToastMessage } from '@/components/ToastContainer';
import QuickReorder from '@/components/QuickReorder';
import SmartRecipes from '@/components/SmartRecipes';
import FeedbackModal from '@/components/FeedbackModal';
import VoiceSearchModal from '@/components/VoiceSearchModal';
import OrderCelebrationModal from '@/components/OrderCelebrationModal';
import OrderDetailsModal from '@/components/OrderDetailsModal';
import NavbarSearch from '@/components/NavbarSearch';
import {
  displayNameFromUser,
  fetchCurrentUser,
  getStoredToken,
  storeToken,
} from '@/lib/authApi';
import { fetchCatalogProducts } from '@/lib/productsApi';
import {
  applyStockOverrides,
  loadPersistedOrders,
  persistOrders,
  persistStockLevels,
} from '@/lib/commerceSync';

export default function Storefront() {

  type ThemePref = 'system' | 'light' | 'dark';
  const THEME_KEY = 'pixel-tech-theme';

  const readThemePref = (): ThemePref => {
    if (typeof window === 'undefined') return 'system';
    const migrated = window.localStorage.getItem('pixel-tech-theme-v2');
    if (!migrated) {
      window.localStorage.setItem('pixel-tech-theme-v2', '1');
    }
    const saved = window.localStorage.getItem(THEME_KEY);
    if (saved === 'light' || saved === 'dark' || saved === 'system') return saved;
    window.localStorage.setItem(THEME_KEY, 'system');
    return 'system';
  };

  // SSR-safe defaults — hydrate from localStorage only after mount to avoid mismatches.
  const [themePref, setThemePref] = useState<ThemePref>('system');
  const [systemDark, setSystemDark] = useState(false);
  const [gdprBannerAccepted, setGdprBannerAccepted] = useState(true);
  const [gdprReady, setGdprReady] = useState(false);

  const isDarkMode = themePref === 'system' ? systemDark : themePref === 'dark';

  const dismissGdprBanner = () => {
    setGdprBannerAccepted(true);
    if (typeof window !== 'undefined') {
      window.localStorage.setItem('pixel-tech-gdpr-consent', '1');
    }
  };

  useEffect(() => {
    setThemePref(readThemePref());
    setSystemDark(window.matchMedia?.('(prefers-color-scheme: dark)').matches ?? false);
    setGdprBannerAccepted(window.localStorage.getItem('pixel-tech-gdpr-consent') === '1');
    setGdprReady(true);
  }, []);

  // Always track OS preference so “system” mode stays in sync
  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const onChange = (e: MediaQueryListEvent) => setSystemDark(e.matches);
    setSystemDark(mediaQuery.matches);
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', onChange);
    } else {
      mediaQuery.addListener(onChange);
    }
    return () => {
      if (mediaQuery.removeEventListener) {
        mediaQuery.removeEventListener('change', onChange);
      } else {
        mediaQuery.removeListener(onChange);
      }
    };
  }, []);

  // Drive Tailwind `dark:` via <html class="dark"> (class strategy)
  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle('dark', isDarkMode);
    root.style.colorScheme = isDarkMode ? 'dark' : 'light';
  }, [isDarkMode]);

  // Cycle: System (auto) → Light → Dark → System
  const toggleTheme = () => {
    setThemePref((prev) => {
      const next: ThemePref =
        prev === 'system' ? 'light' : prev === 'light' ? 'dark' : 'system';
      window.localStorage.setItem(THEME_KEY, next);
      return next;
    });
  };

  const themeLabel =
    themePref === 'system'
      ? `Theme: System (${isDarkMode ? 'dark' : 'light'})`
      : themePref === 'dark'
        ? 'Theme: Dark'
        : 'Theme: Light';

  const [selectedZone, setSelectedZone] = useState('All Zones');

  // Modal Open/Close States
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  // Only treat as signed-in after JWT validation succeeds (avoids flash on expired tokens).
  const [isSignedIn, setIsSignedIn] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [activeTrackingOrder, setActiveTrackingOrder] = useState<Order | null>(null);
  const [showFeedbackOrder, setShowFeedbackOrder] = useState<Order | null>(null);
  const [isVoiceModalOpen, setIsVoiceModalOpen] = useState(false);
  const [celebratingOrder, setCelebratingOrder] = useState<Order | null>(null);
  const [isOrderDetailsOpen, setIsOrderDetailsOpen] = useState(false);

  // Core Data States
  const [products, setProducts] = useState<GroceryItem[]>(INITIAL_GROCERIES);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [purchaseCounts, setPurchaseCounts] = useState<Record<string, number>>({
    'p1': 5, // iPhone 16 Pro
    'p2': 4, // iPhone 16
    'p8': 3, // AirPods Pro 2
    'p5': 2 // MacBook Air M3
  });

  // Customer Profile Initialization with preloaded test parameters
  const [profile, setProfile] = useState<UserProfile>({
    id: 'USR_882910',
    name: 'Thura Kyaw',
    email: 'thurakyaw@example.com',
    avatarUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80',
    loyaltyPoints: 180, // Preloaded points to allow instant rewards tests!
    balance: 150000,   // Preloaded 150,000 MMK to allow instant checkout testing!
    orderHistory: [],
    redeemedCoupons: [],
    walletTopUpsUsed: 0,
    addresses: [
      {
        id: 'addr_default',
        name: 'My Penthouse',
        addressLine: 'Room 1402, Yankin Tower A (Yankin)',
        city: 'Yangon',
        state: 'Yangon Region',
        zipCode: '11201',
        phone: '09975112233',
        isDefault: true
      },
      {
        id: 'addr_office',
        name: 'Downtown Office',
        addressLine: 'Level 18, Junction City Office Tower (Downtown Yangon)',
        city: 'Yangon',
        state: 'Yangon Region',
        zipCode: '11181',
        phone: '09450001122',
        isDefault: false
      }
    ],
    paymentMethods: [
      {
        id: 'pay_default',
        type: 'kbzpay',
        accountName: 'Thura Kyaw',
        accountNumber: '09975112233',
        isDefault: true
      },
      {
        id: 'pay_wave',
        type: 'wavepay',
        accountName: 'Thura Kyaw',
        accountNumber: '09450001122',
        isDefault: false
      },
      {
        id: 'pay_mmqr',
        type: 'mmqr',
        accountName: 'Thura Kyaw (MMQR Interoperable)',
        accountNumber: 'MMQR-09975112233',
        isDefault: false
      }
    ]
  });

  const router = useRouter();

  // Restore session from stored JWT (Spring API)
  useEffect(() => {
    const token = getStoredToken();
    if (!token) {
      setIsSignedIn(false);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const user = await fetchCurrentUser(token);
        if (cancelled) return;
        setIsSignedIn(true);
        setProfile((prev) => ({
          ...prev,
          id: user.id || prev.id,
          name: displayNameFromUser(user),
          email: user.email || prev.email,
        }));
      } catch {
        if (cancelled) return;
        storeToken(null);
        setIsSignedIn(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // Prefer Spring catalog when API is up; keep static electronics catalog offline.
  useEffect(() => {
    const controller = new AbortController();
    (async () => {
      const catalog = await fetchCatalogProducts(controller.signal);
      if (!controller.signal.aborted) {
        setProducts(applyStockOverrides(catalog));
      }
    })();
    return () => controller.abort();
  }, []);

  useEffect(() => {
    const saved = loadPersistedOrders();
    if (saved.length) setOrders(saved);
  }, []);

  useEffect(() => {
    persistOrders(orders);
  }, [orders]);

  useEffect(() => {
    persistStockLevels(products);
  }, [products]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    if (params.get('open') === 'cart') {
      setIsCartOpen(true);
      params.delete('open');
      const qs = params.toString();
      window.history.replaceState({}, '', qs ? `/?${qs}` : '/');
    }
  }, []);

  const openAccount = () => {
    if (isSignedIn) setIsProfileOpen(true);
    else setIsAuthOpen(true);
  };

  // Push notifications inbox
  const [notifications, setNotifications] = useState<NotificationMsg[]>([
    {
      id: 'notif_welcome',
      title: 'Welcome to Pixel Tech! 🎉',
      message: 'Earn points on iPhone 16/17 and MacBook Air purchases. Your GDPR cookies are securely stored.',
      type: 'info',
      timestamp: 'Just now',
      read: false
    },
    {
      id: 'notif_low_stock',
      title: '⚡ Critical Stock Alert',
      message: 'Only a few iPhone 17 Pro Max units left. Set a restock alert or buy now while stock lasts!',
      type: 'inventory',
      timestamp: '2 hours ago',
      read: false
    }
  ]);

  // Floating toasts stack
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  // Handle Toasts & Notifications
  const handleAddToast = (title: string, message: string, type: 'success' | 'warning' | 'info' | 'inventory') => {
    const id = 'toast_' + Date.now();
    setToasts(prev => [...prev, { id, title, message, type }]);
    // Auto clear toast in 4 seconds
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4000);
  };

  const handleAddNotification = (
    title: string,
    message: string,
    type: 'info' | 'success' | 'warning' | 'order' | 'inventory'
  ) => {
    const newMsg: NotificationMsg = {
      id: 'notif_' + Date.now(),
      title,
      message,
      type,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      read: false
    };
    setNotifications(prev => [newMsg, ...prev]);
  };

  // Cart operations — always resolve live stock from the products catalog
  // Caps by aggregated qty across one-time + subscription lines for the same SKU.
  const handleAddToCart = (item: GroceryItem, qty: number, isSub: boolean, freq?: 'weekly' | 'biweekly' | 'monthly'): boolean => {
    const live = products.find(g => g.id === item.id) || item;
    if (live.stock <= 0 || qty <= 0) return false;

    const otherQty = cart
      .filter(i => i.item.id === live.id && i.isSubscription !== isSub)
      .reduce((sum, i) => sum + i.quantity, 0);
    const maxForThisLine = Math.max(0, live.stock - otherQty);
    const existing = cart.find(i => i.item.id === live.id && i.isSubscription === isSub);
    const currentLineQty = existing?.quantity ?? 0;
    if (maxForThisLine <= 0 || currentLineQty >= maxForThisLine) return false;

    // Haptic vibration feedback on supported mobile devices
    if (typeof window !== 'undefined' && 'vibrate' in navigator) {
      try {
        navigator.vibrate(40);
      } catch (e) {
        // Ignore restricted vibration permissions
      }
    }

    setCart(prev => {
      const other = prev
        .filter(i => i.item.id === live.id && i.isSubscription !== isSub)
        .reduce((sum, i) => sum + i.quantity, 0);
      const maxLine = Math.max(0, live.stock - other);
      if (maxLine <= 0) return prev;

      const line = prev.find(i => i.item.id === live.id && i.isSubscription === isSub);
      if (line) {
        const nextQty = Math.min(maxLine, line.quantity + qty);
        if (nextQty === line.quantity) return prev;
        return prev.map(i =>
          (i.item.id === live.id && i.isSubscription === isSub)
            ? { ...i, item: live, quantity: nextQty }
            : i
        );
      }
      return [...prev, { item: live, quantity: Math.min(maxLine, qty), isSubscription: isSub, frequency: freq }];
    });
    return true;
  };

  const handleUpdateCartQty = (itemId: string, isSub: boolean, qty: number) => {
    if (qty <= 0) {
      handleRemoveFromCart(itemId, isSub);
      return;
    }
    const liveStock = products.find(g => g.id === itemId)?.stock ?? 0;
    setCart(prev => {
      const otherQty = prev
        .filter(i => i.item.id === itemId && i.isSubscription !== isSub)
        .reduce((sum, i) => sum + i.quantity, 0);
      const maxForThisLine = Math.max(0, liveStock - otherQty);
      return prev.map(i =>
        (i.item.id === itemId && i.isSubscription === isSub)
          ? {
              ...i,
              item: products.find(g => g.id === itemId) || i.item,
              quantity: Math.min(maxForThisLine, qty)
            }
          : i
      );
    });
  };

  const handleRemoveFromCart = (itemId: string, isSub: boolean) => {
    setCart(prev => prev.filter(i => !(i.item.id === itemId && i.isSubscription === isSub)));
    handleAddToast('Item Removed', 'Product subtracted from cart.', 'info');
  };

  const handleClearCart = () => {
    setCart([]);
  };

  // Order status management
  const handleAddOrder = (order: Order) => {
    // Haptic vibration pulse for successful purchase completion on mobile devices
    if (typeof window !== 'undefined' && 'vibrate' in navigator) {
      try {
        navigator.vibrate([60, 40, 120]);
      } catch (e) {
        // Ignore restricted vibration permissions
      }
    }

    setOrders(prev => [order, ...prev]);
    // Deduct stock levels in local store (sum all cart lines for the same SKU)
    setProducts(prevProducts =>
      prevProducts.map(gItem => {
        const totalQty = order.items
          .filter(cItem => cItem.item.id === gItem.id)
          .reduce((sum, cItem) => sum + cItem.quantity, 0);
        if (totalQty > 0) {
          const newStock = Math.max(0, gItem.stock - totalQty);
          if (newStock <= 5 && newStock > 0) {
            // Trigger automatic low inventory warning
            handleAddNotification(
              '⚠️ Critical Inventory warning',
              `Stock levels for ${gItem.name} have collapsed to ${newStock} units left!`,
              'inventory'
            );
          }
          return { ...gItem, stock: newStock };
        }
        return gItem;
      })
    );
    // Update purchase counts for Quick Reorder
    setPurchaseCounts(prev => {
      const updated = { ...prev };
      order.items.forEach(cItem => {
        updated[cItem.item.id] = (updated[cItem.item.id] || 0) + cItem.quantity;
      });
      return updated;
    });
    // Set active tracking modal & trigger celebratory animation
    setActiveTrackingOrder(order);
    setCelebratingOrder(order);
  };

  const handleUpdateOrderStatus = (orderId: string, status: OrderStatus, step: number) => {
    let deliveredTarget: Order | undefined;
    setOrders(prev => prev.map(o => {
      if (o.id !== orderId) return o;
      const updated = { ...o, status, step };
      if (status === 'delivered' && !o.feedback) deliveredTarget = updated;
      return updated;
    }));
    setProfile(prev => ({
      ...prev,
      orderHistory: (prev.orderHistory || []).map(o =>
        o.id === orderId ? { ...o, status, step } : o
      ),
    }));
    setActiveTrackingOrder(prev => {
      if (prev && prev.id === orderId) {
        return { ...prev, status, step };
      }
      return prev;
    });
    if (deliveredTarget) {
      setShowFeedbackOrder(prev => (prev?.id === orderId ? prev : deliveredTarget!));
    }
  };

  const handleSubmitFeedback = (orderId: string, rating: number, comment: string) => {
    const feedback = { rating, comment };
    setOrders(prev => prev.map(o => o.id === orderId ? { ...o, feedback } : o));
    setProfile(prev => ({
      ...prev,
      orderHistory: (prev.orderHistory || []).map(o =>
        o.id === orderId ? { ...o, feedback } : o
      ),
    }));
    handleAddToast('Review Shared! ⭐', 'Your feedback was dispatched to store supervisors.', 'success');
  };

  // Restocking (Admin Action)
  const handleRestockItem = (itemId: string, amount: number) => {
    setProducts(prev => prev.map(item =>
      item.id === itemId
        ? { ...item, stock: Math.min(item.maxStock, item.stock + amount) }
        : item
    ));
  };

  return (
    <>
      <ToastContainer toasts={toasts} onRemove={(id) => setToasts(prev => prev.filter(t => t.id !== id))} />
<div className="min-h-screen pb-20 sm:pb-8 text-[#0f172a] dark:text-[#e7eef5] transition-colors duration-300">
      {/* HEADER NAVBAR */}
      <header className="sticky top-0 z-40 bg-[#eef4f8]/85 dark:bg-[#0B1220]/90 backdrop-blur-md border-b border-[#0284c7]/12 dark:border-white/8 transition-colors">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 h-16 flex items-center justify-between gap-2 sm:gap-4">
          <Link href="/" className="flex items-center gap-2.5 sm:gap-3 shrink-0 no-underline">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-[#0284c7] text-white flex items-center justify-center ring-1 ring-[#0284c7]/20 shadow-market">
              <Cpu className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div className="hidden min-[380px]:block">
              <h1 className="font-display font-semibold text-lg sm:text-xl tracking-tight leading-none text-[#0f172a] dark:text-[#e7eef5]">
                Pixel Tech
              </h1>
              <span className="text-[10px] font-medium text-[#64748b] dark:text-[#8a9eb0] block mt-0.5">
                Electronics · Yangon
              </span>
            </div>
          </Link>

          <NavbarSearch
            products={products}
            onAddToCart={(item, qty) => handleAddToCart(item, qty, false)}
            onOpenVoiceModal={() => setIsVoiceModalOpen(true)}
            onAddToast={handleAddToast}
          />

          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            <button
              onClick={() => setIsVoiceModalOpen(true)}
              className="flex sm:hidden p-2 bg-sky-500/10 hover:bg-sky-500/20 text-sky-600 dark:text-sky-400 rounded-xl transition-colors cursor-pointer"
              title="Voice Search & Commands"
            >
              <Mic className="w-4 h-4 animate-pulse" />
            </button>

            <button
              onClick={() => setIsOrderDetailsOpen(true)}
              className="p-2 sm:px-3 sm:py-1.5 bg-white/70 hover:bg-white dark:bg-[#121a24] dark:hover:bg-[#1a242f] border border-[#0284c7]/12 dark:border-white/10 text-[#0f172a] dark:text-[#e7eef5] font-semibold text-xs rounded-2xl flex items-center gap-1.5 cursor-pointer transition-colors"
              title="View past order receipts & reorder"
            >
              <FileText className="w-4 h-4 text-[#0ea5e9]" />
              <span className="hidden lg:inline">Orders</span>
            </button>

            <button
              onClick={toggleTheme}
              className="p-2 rounded-2xl border border-[#0284c7]/15 dark:border-white/10 bg-white/70 dark:bg-[#121a24] hover:bg-white dark:hover:bg-[#1a242f] text-[#64748b] dark:text-[#8a9eb0] cursor-pointer transition-colors"
              aria-label={themeLabel}
              title={themeLabel}
            >
              {themePref === 'system' ? (
                <Monitor className="w-4.5 h-4.5 text-[#0284c7]" />
              ) : isDarkMode ? (
                <Sun className="w-4.5 h-4.5 text-amber-300" />
              ) : (
                <Moon className="w-4.5 h-4.5 text-[#64748b]" />
              )}
            </button>

            <button
              onClick={() => router.push('/admin')}
              className="px-2.5 sm:px-3 py-1.5 bg-white/70 hover:bg-white dark:bg-[#121a24] dark:hover:bg-[#1a242f] border border-[#0284c7]/15 dark:border-white/10 text-[#0284c7] dark:text-sky-400 font-semibold text-xs rounded-2xl flex items-center gap-1 cursor-pointer transition-colors"
            >
              <TrendingUp className="w-4 h-4" />
              <span className="hidden md:inline">Admin</span>
            </button>

            <button
              id="notif-toggle-btn"
              onClick={() => setIsNotificationOpen(true)}
              className="hidden sm:flex p-2 rounded-2xl border border-[#0284c7]/12 dark:border-white/10 hover:bg-white/80 dark:hover:bg-[#121a24] text-[#64748b] dark:text-[#8a9eb0] relative cursor-pointer"
              aria-label="Open notifications box"
            >
              <Bell className="w-4.5 h-4.5" />
              {notifications.filter(n => !n.read).length > 0 && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-[#c45c26] rounded-full" />
              )}
            </button>

            <button
              id="cart-toggle-btn"
              onClick={() => setIsCartOpen(true)}
              className="p-2 sm:px-3.5 sm:py-2 bg-[#0284c7] text-white font-semibold rounded-2xl hover:bg-[#0ea5e9] transition-colors relative flex items-center gap-1.5 cursor-pointer shadow-market"
              aria-label="View shopping cart"
            >
              <ShoppingCart className="w-4.5 h-4.5" />
              <span className="hidden sm:inline text-xs font-semibold tracking-wide">Cart</span>
              {cart.length > 0 && (
                <span className="bg-white text-[#0284c7] text-[10px] font-bold px-1.5 py-0.5 rounded-md">
                  {cart.reduce((sum, item) => sum + item.quantity, 0)}
                </span>
              )}
            </button>

            {isSignedIn ? (
              <button
                id="profile-toggle-btn"
                onClick={() => setIsProfileOpen(true)}
                className="hidden sm:flex items-center gap-2 border border-[#0284c7]/15 dark:border-white/10 p-1 rounded-full hover:bg-white/80 dark:hover:bg-[#121a24] transition-colors cursor-pointer"
                aria-label="Open customer profile"
              >
                {profile.avatarUrl ? (
                  <img
                    src={profile.avatarUrl}
                    alt=""
                    className="w-7 h-7 rounded-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#e0f2fe] text-xs font-semibold text-[#0284c7]">
                    {(profile.name || 'A').charAt(0).toUpperCase()}
                  </span>
                )}
              </button>
            ) : (
              <button
                id="profile-toggle-btn"
                onClick={() => setIsAuthOpen(true)}
                className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-2 rounded-2xl border border-[#0284c7]/25 bg-white/80 dark:bg-[#121a24] text-[#0f172a] dark:text-[#e7eef5] text-xs font-semibold hover:bg-white dark:hover:bg-[#1a242f] transition-colors cursor-pointer"
                aria-label="Sign in or create account"
              >
                <LogIn className="w-4 h-4" />
                Sign in
              </button>
            )}
          </div>
        </div>
      </header>

      {/* FULL-BLEED HERO — brand first */}
      <section className="relative isolate min-h-[88vh] sm:min-h-[92vh] w-full overflow-hidden">
        <motion.img
          initial={{ scale: 1.08, opacity: 0.85 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 1.4, ease: [0.22, 1, 0.36, 1] }}
          src="https://images.unsplash.com/photo-1519389950473-47ba0277781c?auto=format&fit=crop&w=2400&q=80"
          alt="Laptops and devices on a modern desk"
          className="absolute inset-0 h-full w-full object-cover"
          fetchPriority="high"
        />
        <div
          className="absolute inset-0 bg-linear-to-t from-[#0B1220]/92 via-[#0B1220]/45 to-[#0B1220]/25"
          aria-hidden
        />
        <div className="relative z-10 flex min-h-[88vh] sm:min-h-[92vh] flex-col justify-end px-5 pb-16 pt-28 sm:px-10 sm:pb-20 lg:px-16">
          <motion.div
            initial={{ opacity: 0, y: 28 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
            className="max-w-2xl"
          >
            <p className="font-display text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-semibold tracking-tight text-white text-balance leading-[0.95]">
              Pixel Tech
            </p>
            <h2 className="mt-5 font-display text-xl sm:text-2xl md:text-3xl font-medium text-[#e0f2fe] text-balance leading-snug">
              Flagship gadgets, delivered across Yangon.
            </h2>
            <p className="mt-3 max-w-md text-sm sm:text-base text-white/75 leading-relaxed">
              Mobiles, laptops, and accessories — paid securely in MMK.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <a
                href="#catalog-section"
                className="inline-flex items-center gap-2 rounded-2xl bg-[#0ea5e9] px-5 py-3 text-sm font-semibold text-white shadow-market hover:bg-[#38bdf8] transition-colors"
              >
                Shop devices
                <ArrowDown className="w-4 h-4" />
              </a>
            </div>
          </motion.div>
        </div>
      </section>

      {orders.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-[#0284c7]/15 dark:border-white/10 pb-5">
            <div>
              <h3 className="font-display font-semibold text-lg text-[#0f172a] dark:text-[#e7eef5]">Your deliveries</h3>
              <p className="text-sm text-[#64748b] dark:text-[#8a9eb0]">Track an active order anytime.</p>
            </div>
            <div className="flex flex-wrap gap-2">
              {orders.map(o => (
                <button
                  key={o.id}
                  onClick={() => setActiveTrackingOrder(o)}
                  className="px-3 py-1.5 bg-white/80 dark:bg-[#121a24] hover:bg-white dark:hover:bg-[#1a242f] text-[#0f172a] dark:text-[#e7eef5] border border-[#0284c7]/15 dark:border-white/10 rounded-xl text-xs font-semibold cursor-pointer flex items-center gap-1.5"
                >
                  <MapPin className="w-3.5 h-3.5 text-[#0ea5e9]" />
                  <span>{o.id} · {o.status}</span>
                </button>
              ))}
            </div>
          </div>
        </section>
      )}

      <main className="max-w-7xl mx-auto px-4 pt-8 pb-20">
        <QuickReorder
          products={products}
          purchaseCounts={purchaseCounts}
          onAddToCart={handleAddToCart}
          onAddToast={handleAddToast}
        />
        <GroceryCatalog
          products={products}
          onAddToCart={handleAddToCart}
          selectedZone={selectedZone}
          setSelectedZone={setSelectedZone}
          onAddToast={handleAddToast}
        />
        <SmartRecipes
          cart={cart}
          products={products}
          onAddToCart={handleAddToCart}
          onAddToast={handleAddToast}
        />
      </main>

      <AnimatePresence>
        {gdprReady && !gdprBannerAccepted && (
          <motion.div
            initial={{ y: 40, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 40, opacity: 0 }}
            className="fixed bottom-4 inset-x-4 sm:inset-x-auto sm:left-1/2 sm:-translate-x-1/2 sm:max-w-xl z-999 rounded-2xl bg-[#0f172a]/95 backdrop-blur-md text-white p-4 shadow-market border border-white/10 flex flex-col sm:flex-row items-start sm:items-center gap-3"
          >
            <p className="text-xs text-white/80 leading-relaxed flex-1">
              We use your delivery details to fulfill orders and process local payments. By continuing, you agree to our privacy policy.
            </p>
            <div className="flex gap-2 shrink-0 w-full sm:w-auto">
              <button
                type="button"
                onClick={dismissGdprBanner}
                className="flex-1 sm:flex-none px-3 py-1.5 text-xs font-medium text-white/60 hover:text-white transition-colors"
              >
                Dismiss
              </button>
              <button
                type="button"
                onClick={() => {
                  dismissGdprBanner();
                  handleAddToast('Privacy noted', 'Thanks — you can shop with confidence.', 'success');
                }}
                className="flex-1 sm:flex-none px-4 py-1.5 bg-[#0ea5e9] hover:bg-[#38bdf8] text-white text-xs font-semibold rounded-xl transition-colors cursor-pointer"
              >
                Got it
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* MODALS LAYER */}

      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        onAddToast={handleAddToast}
        onAuthenticated={(user, displayName) => {
          setIsSignedIn(true);
          // Keep demo wallet/addresses so checkout still works after sign-in.
          setProfile((prev) => ({
            ...prev,
            id: user.id || prev.id || `USR_${Date.now()}`,
            name: displayName,
            email: user.email || prev.email,
            avatarUrl:
              prev.avatarUrl ||
              'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80',
          }));
        }}
      />

      {/* User Profile Preferences Modal */}
      <UserProfileModal
        profile={profile}
        orders={orders}
        isOpen={isProfileOpen}
        onClose={() => setIsProfileOpen(false)}
        onUpdateProfile={(updater) => {
          if (typeof updater === 'function') {
            setProfile(updater);
          } else {
            setProfile(updater);
          }
        }}
        onClearOrders={() => setOrders([])}
        onAddToast={handleAddToast}
        onSignOut={() => {
          storeToken(null);
          setIsSignedIn(false);
          setIsProfileOpen(false);
          setCart([]);
          setOrders([]);
          handleAddToast('Signed out', 'Come back anytime for fresh products.', 'info');
        }}
      />

      {/* Post-order feedback modal */}
      {showFeedbackOrder && (
        <FeedbackModal
          order={showFeedbackOrder}
          isOpen={!!showFeedbackOrder}
          onClose={() => setShowFeedbackOrder(null)}
          onSubmitFeedback={handleSubmitFeedback}
        />
      )}

      {/* Secure Cart and Checkout Side-Drawer */}
      <AnimatePresence>
        {isCartOpen && (
          <CartAndCheckout
            cart={cart}
            products={products}
            onUpdateCartQty={handleUpdateCartQty}
            onRemoveFromCart={handleRemoveFromCart}
            onClearCart={handleClearCart}
            profile={profile}
            onUpdateProfile={setProfile}
            onAddOrder={handleAddOrder}
            onAddToast={handleAddToast}
            onClose={() => setIsCartOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Active Order Tracker live SVG map modal */}
      <AnimatePresence>
        {activeTrackingOrder && (
          <OrderTracker
            order={activeTrackingOrder}
            onUpdateOrderStatus={handleUpdateOrderStatus}
            onAddToast={handleAddToast}
            onAddNotification={handleAddNotification}
            onClose={() => setActiveTrackingOrder(null)}
          />
        )}
      </AnimatePresence>

      {/* Push Bell Notifications Inbox Drawer */}
      <NotificationCenter
        notifications={notifications}
        onMarkAllAsRead={() => {
          setNotifications(prev => prev.map(n => ({ ...n, read: true })));
          handleAddToast('Inbox Cleared', 'Marked all notifications as read.', 'success');
        }}
        onClearAll={() => {
          setNotifications([]);
          handleAddToast('Inbox Emptied', 'All notifications cleared.', 'info');
        }}
        onToggleRead={(id) => {
          setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: !n.read } : n));
        }}
        isOpen={isNotificationOpen}
        onClose={() => setIsNotificationOpen(false)}
      />

      {/* Administration Hub lives at /admin */}

      {/* Voice Assistant & Command Search Modal */}
      <VoiceSearchModal
        isOpen={isVoiceModalOpen}
        onClose={() => setIsVoiceModalOpen(false)}
        products={products}
        onAddToCart={handleAddToCart}
        onAddToast={handleAddToast}
      />

      {/* Order Celebration Animation Modal */}
      <OrderCelebrationModal
        order={celebratingOrder}
        onClose={() => setCelebratingOrder(null)}
        onTrackOrder={(o) => setActiveTrackingOrder(o)}
      />

      {/* Order History Details & Reorder Basket Modal */}
      <OrderDetailsModal
        isOpen={isOrderDetailsOpen}
        onClose={() => setIsOrderDetailsOpen(false)}
        orders={orders}
        products={products}
        onAddToCart={handleAddToCart}
        onOpenCart={() => setIsCartOpen(true)}
        onAddToast={handleAddToast}
      />

      <nav className="fixed bottom-0 left-0 right-0 z-40 bg-[#eef4f8]/95 dark:bg-[#0B1220]/95 backdrop-blur-md border-t border-[#0284c7]/12 dark:border-white/10 sm:hidden flex justify-around items-center py-1.5 px-1">
        <button
          onClick={() => {
            setIsProfileOpen(false);
            setIsCartOpen(false);
            setIsNotificationOpen(false);
            setActiveTrackingOrder(null);
            setIsVoiceModalOpen(false);
            setIsOrderDetailsOpen(false);
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          className={`flex flex-col items-center justify-center p-1.5 rounded-xl transition-colors min-w-12 min-h-11 ${
            !isCartOpen && !isProfileOpen && !isNotificationOpen && !activeTrackingOrder && !isVoiceModalOpen && !isOrderDetailsOpen
              ? 'text-sky-500 dark:text-sky-400 font-extrabold'
              : 'text-slate-500 dark:text-slate-400 hover:text-sky-500'
          }`}
        >
          <Home className="w-5 h-5" />
          <span className="text-[9px] font-bold mt-0.5">Catalog</span>
        </button>

        <button
          onClick={() => setIsVoiceModalOpen(true)}
          className={`flex flex-col items-center justify-center p-1.5 rounded-xl transition-colors min-w-12 min-h-11 ${
            isVoiceModalOpen
              ? 'text-sky-500 dark:text-sky-400 font-extrabold'
              : 'text-slate-500 dark:text-slate-400 hover:text-sky-500'
          }`}
        >
          <div className="relative">
            <Mic className="w-5 h-5 text-sky-500" />
            <span className="absolute -top-1 -right-1 w-2 h-2 bg-sky-500 rounded-full animate-ping" />
          </div>
          <span className="text-[9px] font-bold mt-0.5">Voice Order</span>
        </button>

        <button
          onClick={() => setIsOrderDetailsOpen(true)}
          className={`flex flex-col items-center justify-center p-1.5 rounded-xl transition-colors min-w-12 min-h-11 ${
            isOrderDetailsOpen
              ? 'text-sky-500 dark:text-sky-400 font-extrabold'
              : 'text-slate-500 dark:text-slate-400 hover:text-sky-500'
          }`}
        >
          <FileText className="w-5 h-5" />
          <span className="text-[9px] font-bold mt-0.5">Reorder</span>
        </button>

        <button
          onClick={() => {
            if (orders.length > 0) {
              setActiveTrackingOrder(orders[0]);
            } else {
              const demoAddress = profile.addresses[0] ?? {
                id: 'addr_demo',
                name: profile.name || 'Guest',
                addressLine: 'Yankin Tower A (Yankin)',
                city: 'Yangon',
                state: 'Yangon Region',
                zipCode: '11201',
                phone: '09000000000',
                isDefault: true
              };
              const demoPayment = profile.paymentMethods[0] ?? {
                id: 'pay_demo',
                type: 'mmqr' as const,
                accountName: profile.name || 'Guest',
                accountNumber: 'MMQR-DEMO',
                isDefault: true
              };
              const demoItems = [
                { item: INITIAL_GROCERIES[0], quantity: 2, isSubscription: false },
                { item: INITIAL_GROCERIES[1], quantity: 1, isSubscription: false },
              ];
              const demoOrder: Order = {
                id: `ORD_${Date.now().toString().slice(-6)}`,
                items: demoItems,
                totalAmount: demoItems.reduce((sum, line) => sum + line.item.price * line.quantity, 0),
                currency: 'MMK',
                deliveryAddress: demoAddress,
                paymentMethod: demoPayment,
                status: 'out_for_delivery',
                createdAt: new Date().toISOString(),
                deliveryLat: 16.8123,
                deliveryLng: 96.1543,
                step: 2,
                estimatedDeliveryWindow: '18 mins'
              };
              setOrders([demoOrder]);
              setActiveTrackingOrder(demoOrder);
              handleAddToast('Live Delivery Tracking', 'Tracking active dispatch rider in Yangon Zone.', 'info');
            }
          }}
          className={`flex flex-col items-center justify-center p-1.5 rounded-xl transition-colors relative min-w-12 min-h-11 ${
            activeTrackingOrder
              ? 'text-sky-500 dark:text-sky-400 font-extrabold'
              : 'text-slate-500 dark:text-slate-400 hover:text-sky-500'
          }`}
        >
          <div className="relative">
            <Truck className="w-5 h-5 text-sky-500" />
            <span className="absolute -top-1 -right-1 w-2 h-2 bg-sky-500 rounded-full border border-white dark:border-slate-900 animate-pulse" />
          </div>
          <span className="text-[9px] font-bold mt-0.5">Track</span>
        </button>

        <button
          onClick={() => setIsCartOpen(true)}
          className={`flex flex-col items-center justify-center p-1.5 rounded-xl transition-colors relative min-w-12 min-h-11 ${
            isCartOpen
              ? 'text-sky-500 dark:text-sky-400 font-extrabold'
              : 'text-slate-500 dark:text-slate-400 hover:text-sky-500'
          }`}
        >
          <div className="relative">
            <ShoppingCart className="w-5 h-5" />
            {cart.length > 0 && (
              <span className="absolute -top-1.5 -right-2 bg-sky-500 text-white text-[9px] font-bold px-1.5 py-0.2 rounded-full">
                {cart.reduce((sum, item) => sum + item.quantity, 0)}
              </span>
            )}
          </div>
          <span className="text-[9px] font-bold mt-0.5">Cart</span>
        </button>

        <button
          onClick={openAccount}
          className={`flex flex-col items-center justify-center p-1.5 rounded-xl transition-colors min-w-12 min-h-11 ${
            isProfileOpen || isAuthOpen
              ? 'text-sky-500 dark:text-sky-400 font-extrabold'
              : 'text-slate-500 dark:text-slate-400 hover:text-sky-500'
          }`}
        >
          {isSignedIn ? (
            <img
              src={profile.avatarUrl}
              alt="Profile"
              className={`w-5 h-5 rounded-full object-cover border ${
                isProfileOpen ? 'border-sky-500' : 'border-slate-300 dark:border-white/20'
              }`}
              referrerPolicy="no-referrer"
            />
          ) : (
            <LogIn className="w-5 h-5" />
          )}
          <span className="text-[9px] font-bold mt-0.5">{isSignedIn ? 'Profile' : 'Sign in'}</span>
        </button>
      </nav>
    </div>
    </>
  );
}
