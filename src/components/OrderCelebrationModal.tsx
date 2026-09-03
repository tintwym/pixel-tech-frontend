'use client';

import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { CheckCircle2, ShoppingBag, MapPin, ArrowRight, Sparkles, Trophy, Star } from 'lucide-react';
import { Order } from '@/types';

interface OrderCelebrationModalProps {
  order: Order | null;
  onClose: () => void;
  onTrackOrder: (order: Order) => void;
}

export default function OrderCelebrationModal({
  order,
  onClose,
  onTrackOrder
}: OrderCelebrationModalProps) {
  if (!order) return null;

  // Particle positions for confetti explosion effect
  const particles = Array.from({ length: 16 }).map((_, i) => ({
    id: i,
    angle: (i * 360) / 16,
    distance: 120 + (i % 4) * 30,
    size: 8 + (i % 3) * 6,
    color: ['#0ea5e9', '#34d399', '#f59e0b', '#ec4899', '#6366f1', '#3b82f6'][i % 6]
  }));

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-120 flex items-center justify-center p-4 bg-black/75 backdrop-blur-lg">
        {/* Confetti Explosion Layer */}
        <div className="absolute inset-0 pointer-events-none flex items-center justify-center overflow-hidden">
          {particles.map((p) => {
            const rad = (p.angle * Math.PI) / 180;
            const x = Math.cos(rad) * p.distance;
            const y = Math.sin(rad) * p.distance;
            return (
              <motion.div
                key={p.id}
                initial={{ x: 0, y: 0, scale: 0, opacity: 1, rotate: 0 }}
                animate={{
                  x: [0, x * 1.3, x],
                  y: [0, y * 1.3, y + 40],
                  scale: [0, 1.2, 0.8],
                  opacity: [1, 1, 0],
                  rotate: [0, 180, 360]
                }}
                transition={{
                  duration: 2.2,
                  repeat: Infinity,
                  repeatDelay: 1,
                  ease: 'easeOut',
                  delay: (p.id % 5) * 0.08
                }}
                style={{
                  backgroundColor: p.color,
                  width: p.size,
                  height: p.size,
                  borderRadius: p.id % 2 === 0 ? '50%' : '3px'
                }}
                className="absolute shadow-lg"
              />
            );
          })}
        </div>

        {/* Center Modal */}
        <motion.div
          initial={{ scale: 0.5, opacity: 0, y: 40 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.7, opacity: 0, y: 30 }}
          transition={{ type: 'spring', damping: 18, stiffness: 200 }}
          className="relative w-full max-w-md bg-white dark:bg-[#121a24] border border-sky-500/30 rounded-3xl p-6 sm:p-8 shadow-2xl text-center font-sans overflow-hidden z-10"
        >
          {/* Radial Glow Header Background */}
          <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-72 h-72 bg-sky-500/20 rounded-full blur-3xl pointer-events-none" />

          {/* Animated Center Trophy Badge */}
          <div className="relative mx-auto w-24 h-24 mb-4 flex items-center justify-center">
            <motion.div
              animate={{ scale: [1, 1.15, 1], rotate: [0, 5, -5, 0] }}
              transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
              className="w-20 h-20 bg-linear-to-tr from-[#0284c7] to-[#0ea5e9] rounded-full flex items-center justify-center shadow-xl shadow-[#0284c7]/30 text-white"
            >
              <CheckCircle2 className="w-11 h-11 text-white stroke-[2.5]" />
            </motion.div>

            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 12, repeat: Infinity, ease: 'linear' }}
              className="absolute inset-0 border-2 border-dashed border-sky-400/50 rounded-full pointer-events-none"
            />
          </div>

          {/* Celebration Header */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="space-y-2 mb-6"
          >
            <span className="inline-flex items-center gap-1 px-3 py-1 bg-sky-500/10 text-sky-600 dark:text-sky-400 rounded-full text-xs font-semibold tracking-wider uppercase border border-sky-500/20">
              <Sparkles className="w-3.5 h-3.5" /> Order Successfully Confirmed
            </span>
            <h2 className="text-2xl sm:text-3xl font-display font-semibold text-slate-900 dark:text-white leading-tight">
              Woohoo! Celebration Time 🎉
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-xs mx-auto">
              Your tech products are packed and our dispatch rider is preparing for fast delivery!
            </p>
          </motion.div>

          {/* Order Summary Card */}
          <div className="p-4 bg-slate-50 dark:bg-[#1a242f] border border-slate-200 dark:border-white/10 rounded-2xl space-y-3 mb-6 text-left text-xs">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-white/5 pb-2">
              <span className="font-mono text-slate-400 font-bold">ORDER ID</span>
              <span className="font-mono font-semibold text-sky-600 dark:text-sky-400">{order.id}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-500 dark:text-slate-400">Total Items:</span>
              <span className="font-bold text-slate-800 dark:text-white">{order.items.reduce((s, i) => s + i.quantity, 0)} items</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-500 dark:text-slate-400">Total Paid:</span>
              <span className="font-semibold text-slate-900 dark:text-white text-sm">
                {order.totalAmount.toLocaleString()} {order.currency}
              </span>
            </div>
            <div className="flex items-center gap-1.5 pt-1 text-slate-500 dark:text-slate-400">
              <MapPin className="w-3.5 h-3.5 text-sky-400 shrink-0" />
              <span className="truncate">{order.deliveryAddress.addressLine}</span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-2.5">
            <button
              onClick={() => {
                onClose();
                onTrackOrder(order);
              }}
              className="flex-1 px-4 py-3 bg-[#0284c7] hover:bg-[#0ea5e9] text-white font-semibold text-xs rounded-xl shadow-lg shadow-sky-500/20 transition-all cursor-pointer flex items-center justify-center gap-1.5"
            >
              <ShoppingBag className="w-4 h-4" />
              <span>Track Live Delivery</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="px-4 py-3 bg-slate-100 hover:bg-slate-200 dark:bg-[#1a1a1a] dark:hover:bg-[#252525] text-slate-700 dark:text-slate-300 font-bold text-xs rounded-xl transition-colors cursor-pointer"
            >
              Continue Shopping
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
