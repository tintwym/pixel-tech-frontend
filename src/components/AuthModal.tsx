'use client';

import React, { useEffect, useState } from 'react';
import { Cpu, X } from 'lucide-react';
import { motion } from 'motion/react';
import { AuthMode } from '@/lib/authValidation';
import type { AuthUser } from '@/lib/authApi';
import AuthForm from '@/components/AuthForm';

type AuthModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onAuthenticated: (user: AuthUser, displayName: string) => void;
  onAddToast: (title: string, msg: string, type: 'success' | 'warning' | 'info') => void;
  initialMode?: AuthMode;
};

export default function AuthModal({
  isOpen,
  onClose,
  onAuthenticated,
  onAddToast,
  initialMode = 'login',
}: AuthModalProps) {
  const [formKey, setFormKey] = useState(0);

  useEffect(() => {
    if (!isOpen) return;
    setFormKey((k) => k + 1);
  }, [isOpen, initialMode]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-100 flex items-end justify-center sm:items-center p-0 sm:p-4">
      <button
        type="button"
        className="absolute inset-0 bg-black/50 backdrop-blur-[2px] cursor-pointer"
        aria-label="Close sign in"
        onClick={onClose}
      />

      <motion.div
        role="dialog"
        aria-modal="true"
        aria-labelledby="auth-modal-title"
        initial={{ opacity: 0, y: 24, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 16, scale: 0.98 }}
        transition={{ type: 'spring', stiffness: 380, damping: 28 }}
        className="relative z-10 flex max-h-[92vh] w-full max-w-md flex-col overflow-hidden rounded-t-3xl border border-[#0284c7]/15 bg-mist shadow-2xl dark:border-white/10 dark:bg-[#0B1220] sm:rounded-3xl"
      >
        <div className="pointer-events-none absolute -left-16 -top-20 h-56 w-56 rounded-full bg-sky-500/20 blur-3xl" />
        <div className="pointer-events-none absolute -right-10 bottom-0 h-40 w-40 rounded-full bg-sky-500/10 blur-3xl" />

        <div className="relative flex items-start justify-between gap-3 px-5 pt-5 pb-2">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-linear-to-br from-sky-500/30 to-sky-500/5">
              <Cpu className="h-5 w-5 text-sky-500" aria-hidden />
            </div>
            <div>
              <p id="auth-modal-title" className="font-display text-2xl font-semibold text-slate-900 dark:text-white">
                Pixel Tech
              </p>
              <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-sky-700 dark:text-sky-400">
                Premium electronics
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-1.5 text-slate-400 hover:bg-slate-200/70 hover:text-slate-700 dark:hover:bg-white/10 dark:hover:text-white cursor-pointer"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="relative overflow-y-auto px-5 pb-6 pt-2">
          <AuthForm
            key={formKey}
            initialMode={initialMode}
            onAuthenticated={onAuthenticated}
            onAddToast={onAddToast}
            onSuccess={onClose}
            variant="modal"
          />
        </div>
      </motion.div>
    </div>
  );
}
