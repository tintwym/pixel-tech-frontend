'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { ArrowDown, ChevronLeft, ChevronRight } from 'lucide-react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { HERO_SLIDES, type HeroSlide } from '@/data/heroSlides';

const AUTO_MS = 6500;

function jumpToCatalog(category?: string) {
  if (typeof window === 'undefined') return;
  if (category) {
    window.dispatchEvent(new CustomEvent('pixel-filter-category', { detail: category }));
  }
  document.getElementById('catalog-section')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

export default function HeroCarousel({ slides = HERO_SLIDES }: { slides?: HeroSlide[] }) {
  const reduceMotion = useReducedMotion();
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const count = slides.length;
  const slide = slides[index] ?? slides[0];

  const go = useCallback(
    (next: number) => {
      if (!count) return;
      setIndex(((next % count) + count) % count);
    },
    [count]
  );

  useEffect(() => {
    if (reduceMotion || paused || count < 2) return;
    const id = window.setInterval(() => go(index + 1), AUTO_MS);
    return () => window.clearInterval(id);
  }, [index, paused, reduceMotion, count, go]);

  if (!slide) return null;

  const isDark = slide.tone === 'dark';
  const brandClass = isDark ? 'text-white' : 'text-[#0f172a]';
  const headlineClass = isDark ? 'text-[#e0f2fe]' : 'text-[#0c4a6e]';
  const supportClass = isDark ? 'text-white/75' : 'text-slate-600';
  const kindClass = isDark ? 'text-sky-300/90' : 'text-[#0284c7]';
  const overlayClass = isDark
    ? 'bg-linear-to-t from-[#0B1220]/88 via-[#0B1220]/35 to-[#0B1220]/20'
    : 'bg-linear-to-t from-white/90 via-white/35 to-white/10';
  const controlClass = isDark
    ? 'border-white/20 bg-black/25 text-white hover:bg-black/40'
    : 'border-slate-300/70 bg-white/70 text-slate-800 hover:bg-white';

  return (
    <section
      className="relative isolate min-h-[min(88vh,100dvh)] sm:min-h-[92vh] w-full overflow-hidden"
      aria-roledescription="carousel"
      aria-label="New and trending devices"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setPaused(false);
      }}
    >
      <AnimatePresence mode="sync" initial={false}>
        <motion.img
          key={slide.id}
          src={slide.imageUrl}
          alt={slide.alt}
          initial={
            reduceMotion
              ? { opacity: 1 }
              : { opacity: 0, scale: 1.06 }
          }
          animate={
            reduceMotion
              ? { opacity: 1 }
              : { opacity: 1, scale: 1 }
          }
          exit={reduceMotion ? { opacity: 0 } : { opacity: 0, scale: 1.02 }}
          transition={{ duration: reduceMotion ? 0.2 : 0.9, ease: [0.22, 1, 0.36, 1] }}
          className="absolute inset-0 z-0 h-full w-full object-cover object-center"
          fetchPriority={index === 0 ? 'high' : 'auto'}
          draggable={false}
        />
      </AnimatePresence>

      <div className={`absolute inset-0 z-[1] transition-colors duration-700 ${overlayClass}`} aria-hidden />

      <div className="relative z-10 flex min-h-[min(88vh,100dvh)] sm:min-h-[92vh] flex-col justify-end px-5 pb-[max(4rem,calc(env(safe-area-inset-bottom)+3.5rem))] pt-24 sm:px-10 sm:pb-20 sm:pt-28 lg:px-16">
        <AnimatePresence mode="wait">
          <motion.div
            key={`${slide.id}-copy`}
            initial={reduceMotion ? false : { opacity: 0, y: 22 }}
            animate={{ opacity: 1, y: 0 }}
            exit={reduceMotion ? undefined : { opacity: 0, y: -12 }}
            transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
            className="max-w-2xl"
          >
            <p className={`font-display text-[2.75rem] leading-[0.95] sm:text-6xl md:text-7xl lg:text-8xl font-semibold tracking-tight text-balance sm:leading-[0.95] ${brandClass}`}>
              Pixel Tech
            </p>
            <p className={`mt-5 text-[11px] sm:text-xs font-semibold uppercase tracking-[0.18em] ${kindClass}`}>
              {slide.kind}
            </p>
            <h2 className={`mt-2 font-display text-xl sm:text-2xl md:text-3xl font-medium text-balance leading-snug ${headlineClass}`}>
              {slide.headline}
            </h2>
            <p className={`mt-3 max-w-md text-sm sm:text-base leading-relaxed ${supportClass}`}>
              {slide.support}
            </p>
            <div className="mt-7 sm:mt-8 flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={() => jumpToCatalog(slide.category)}
                className="inline-flex min-h-11 items-center gap-2 rounded-2xl bg-[#0ea5e9] px-5 py-3 text-sm font-semibold text-white shadow-market hover:bg-[#38bdf8] active:scale-[0.98] transition-[colors,transform] cursor-pointer"
              >
                {slide.ctaLabel}
                <ArrowDown className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        </AnimatePresence>

        {count > 1 && (
          <div className="mt-8 sm:mt-10 flex items-center gap-3">
            <button
              type="button"
              aria-label="Previous slide"
              onClick={() => go(index - 1)}
              className={`inline-flex h-11 w-11 sm:h-9 sm:w-9 items-center justify-center rounded-full border backdrop-blur-sm transition-colors cursor-pointer ${controlClass}`}
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <div className="flex items-center gap-2" role="tablist" aria-label="Hero slides">
              {slides.map((s, i) => {
                const active = i === index;
                return (
                  <button
                    key={s.id}
                    type="button"
                    role="tab"
                    aria-selected={active}
                    aria-label={`Show ${s.headline}`}
                    onClick={() => go(i)}
                    className={`h-1.5 rounded-full transition-all duration-300 cursor-pointer ${
                      active
                        ? isDark
                          ? 'w-8 bg-sky-400'
                          : 'w-8 bg-[#0284c7]'
                        : isDark
                          ? 'w-3 bg-white/35 hover:bg-white/55'
                          : 'w-3 bg-slate-400/45 hover:bg-slate-500/70'
                    }`}
                  />
                );
              })}
            </div>
            <button
              type="button"
              aria-label="Next slide"
              onClick={() => go(index + 1)}
              className={`inline-flex h-11 w-11 sm:h-9 sm:w-9 items-center justify-center rounded-full border backdrop-blur-sm transition-colors cursor-pointer ${controlClass}`}
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>
    </section>
  );
}
