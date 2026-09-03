'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Cpu, Lock, Eye, EyeOff, AlertTriangle, ArrowLeft, Shield } from 'lucide-react';
import { GroceryItem, Order } from '@/types';
import AdminDashboard from '@/components/AdminDashboard';
import { loginAdmin } from '@/lib/authApi';
import { AuthApiError, validateAdminForm } from '@/lib/authValidation';
import {
  DEMO_ADMIN_PASSWORD,
  clearAdminAuth,
  getAdminSession,
  setAdminSession,
  setAdminToken,
} from '@/lib/adminAuth';

type AdminPageProps = {
  products: GroceryItem[];
  orders: Order[];
  onRestock: (itemId: string, amount: number) => void;
  onUpdateOrderStatus: (orderId: string, status: any, step: number) => void;
  onAddToast: (title: string, msg: string, type: 'success' | 'warning' | 'info') => void;
  onAddNotification: (
    title: string,
    message: string,
    type: 'info' | 'success' | 'warning' | 'order' | 'inventory'
  ) => void;
};

export default function AdminPage({
  products,
  orders,
  onRestock,
  onUpdateOrderStatus,
  onAddToast,
  onAddNotification,
}: AdminPageProps) {
  const router = useRouter();
  const [session, setSession] = useState(() => getAdminSession());
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<{ username?: string; password?: string }>({});

  const handleLogout = () => {
    clearAdminAuth();
    setSession(null);
    onAddToast('Admin signed out', 'You left the Admin Hub.', 'info');
    router.push('/');
  };

  const validate = () => {
    const next = validateAdminForm({ username, password });
    setFieldErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!validate()) return;

    setIsLoading(true);
    try {
      // Prefer Spring admin API when available
      const token = await loginAdmin(username.trim(), password);
      setAdminToken(token);
      const next = { username: username.trim(), via: 'api' as const };
      setAdminSession(next);
      setSession(next);
      onAddToast('Admin unlocked', 'Welcome to the Admin Hub.', 'success');
    } catch (err) {
      // Local demo fallback only in development — never accept a hardcoded password in production.
      const allowDemo = process.env.NODE_ENV !== 'production';
      if (allowDemo && password === DEMO_ADMIN_PASSWORD) {
        setAdminToken(null);
        const next = {
          username: username.trim() || 'admin',
          via: 'demo' as const,
        };
        setAdminSession(next);
        setSession(next);
        onAddToast('Admin unlocked', 'Demo admin session started.', 'success');
      } else if (err instanceof AuthApiError && err.status === 0) {
        setError(
          allowDemo
            ? `Can’t reach the API. For local demo, use password “${DEMO_ADMIN_PASSWORD}”.`
            : 'Can’t reach the API. Check that the backend is running.'
        );
      } else if (err instanceof AuthApiError && err.status === 401) {
        setError('Incorrect admin username or password.');
      } else {
        setError('Could not sign in. Check your credentials and try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (session) {
    return (
      <AdminDashboard
        variant="page"
        products={products}
        orders={orders}
        onRestock={onRestock}
        onUpdateOrderStatus={onUpdateOrderStatus}
        onAddToast={onAddToast}
        onAddNotification={onAddNotification}
        onClose={handleLogout}
        adminLabel={session.username}
      />
    );
  }

  return (
    <div className="min-h-screen bg-[#eef4f8] dark:bg-[#0B1220] text-[#0f172a] dark:text-[#e7eef5] flex flex-col">
      <header className="border-b border-[#0284c7]/12 dark:border-white/10 bg-[#eef4f8]/85 dark:bg-[#0B1220]/90 backdrop-blur-md">
        <div className="max-w-lg mx-auto px-4 py-3 flex items-center justify-between">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#64748b] hover:text-[#0284c7] dark:hover:text-sky-400 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to store
          </Link>
          <span className="inline-flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-[#0284c7] dark:text-sky-400">
            <Shield className="w-3.5 h-3.5" />
            Admin route
          </span>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-md rounded-3xl border border-[#0284c7]/15 dark:border-white/10 bg-white/90 dark:bg-[#121a24] shadow-market p-6 sm:p-8 relative overflow-hidden">
          <div className="pointer-events-none absolute -left-16 -top-16 h-40 w-40 rounded-full bg-sky-500/15 blur-3xl" />

          <div className="relative flex items-center gap-3 mb-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#0284c7] text-white shadow-market">
              <Cpu className="h-5 w-5" />
            </div>
            <div>
              <h1 className="font-display text-xl font-semibold text-[#0f172a] dark:text-[#e7eef5]">
                Admin Hub
              </h1>
              <p className="text-xs text-[#64748b] dark:text-[#8a9eb0]">
                Sign in at <code className="font-mono text-[#0284c7] dark:text-sky-400">/admin</code>
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="relative space-y-3.5" noValidate>
            <div>
              <label className={`mb-1 block text-xs font-semibold ${fieldErrors.username ? 'text-red-600' : 'text-slate-500'}`}>
                Username
              </label>
              <input
                value={username}
                onChange={(e) => {
                  setUsername(e.target.value);
                  if (fieldErrors.username) {
                    setFieldErrors((p) => ({ ...p, username: undefined }));
                  }
                }}
                autoComplete="username"
                placeholder="Admin username"
                className={`w-full rounded-xl border bg-white dark:bg-[#121a24] px-3.5 py-3 text-sm outline-hidden placeholder:text-slate-400 ${
                  fieldErrors.username
                    ? 'border-red-400 ring-2 ring-red-400/25'
                    : 'border-slate-200 dark:border-white/10 focus:border-sky-500 focus:ring-2 focus:ring-sky-500/30'
                }`}
              />
              {fieldErrors.username && (
                <p className="mt-1.5 text-xs font-medium text-red-600" role="alert">
                  {fieldErrors.username}
                </p>
              )}
            </div>

            <div>
              <label className={`mb-1 block text-xs font-semibold ${fieldErrors.password ? 'text-red-600' : 'text-slate-500'}`}>
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (fieldErrors.password) {
                      setFieldErrors((p) => ({ ...p, password: undefined }));
                    }
                  }}
                  autoComplete="current-password"
                  placeholder="Admin password"
                  className={`w-full rounded-xl border bg-white dark:bg-[#121a24] px-3.5 py-3 pr-11 text-sm outline-hidden placeholder:text-slate-400 ${
                    fieldErrors.password
                      ? 'border-red-400 ring-2 ring-red-400/25'
                      : 'border-slate-200 dark:border-white/10 focus:border-sky-500 focus:ring-2 focus:ring-sky-500/30'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-slate-400 hover:text-slate-700 dark:hover:text-white cursor-pointer"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {fieldErrors.password && (
                <p className="mt-1.5 text-xs font-medium text-red-600" role="alert">
                  {fieldErrors.password}
                </p>
              )}
            </div>

            {error && (
              <div
                className="flex items-start gap-2 rounded-xl bg-red-500/10 px-3.5 py-3 text-sm font-medium text-red-700 dark:text-red-300"
                role="alert"
              >
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="mt-1 w-full inline-flex items-center justify-center gap-2 rounded-xl bg-linear-to-br from-[#0284c7] to-[#0ea5e9] py-3.5 text-sm font-semibold text-white shadow-lg shadow-[#0284c7]/25 disabled:opacity-60 cursor-pointer"
            >
              <Lock className="w-4 h-4" />
              {isLoading ? 'Signing in…' : 'Sign in to Admin Hub'}
            </button>

            {process.env.NODE_ENV !== 'production' && (
              <p className="text-[11px] text-center text-slate-400 pt-1">
                Demo fallback password: <span className="font-mono text-slate-500">{DEMO_ADMIN_PASSWORD}</span>
              </p>
            )}
          </form>
        </div>
      </main>
    </div>
  );
}
