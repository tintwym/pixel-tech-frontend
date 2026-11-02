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
  const sectionBg = isDark ? 'bg-[#000000]' : 'bg-mist dark:bg-[#0B1220]';
  const brandClass = isDark ? 'text-white' : 'text-[#1d1d1f] dark:text-[#e7eef5]';
  const headlineClass = isDark ? 'text-white' : 'text-[#1d1d1f] dark:text-[#e7eef5]';
  const supportClass = isDark ? 'text-white/70' : 'text-[#6e6e73] dark:text-[#8a9eb0]';
  const kindClass = isDark ? 'text-white/55' : 'text-[#6e6e73] dark:text-[#8a9eb0]';
  const outlineCta = isDark
    ? 'border-white/80 text-white hover:bg-white/10'
    : 'border-[#0071e3] text-[#0071e3] hover:bg-[#0071e3]/06 dark:border-sky-400 dark:text-sky-300';
  const controlClass = isDark
    ? 'border-white/20 bg-white/10 text-white hover:bg-white/20'
    : 'border-black/10 bg-black/5 text-[#1d1d1f] hover:bg-black/10';
  const desktopOverlay = isDark
    ? 'bg-linear-to-t from-black/80 via-black/25 to-black/40'
    : 'bg-linear-to-t from-white/90 via-white/30 to-white/15';

  const focal =
    slide.id === 'iphone-duo'
      ? 'object-[center_28%]'
      : slide.id === 'macbook-pro-m6'
        ? 'object-[center_62%]'
        : 'object-[center_40%]';

  /** Mobile crop — keep the device + hands readable, avoid empty sky/floor. */
  const mobileFocal =
    slide.id === 'iphone-duo'
      ? 'object-[center_38%]'
      : slide.id === 'macbook-pro-m6'
        ? 'object-[center_48%]'
        : 'object-center';

  return (
    <section
      className={`relative isolate w-full overflow-hidden ${sectionBg}`}
      aria-roledescription="carousel"
      aria-label="New and trending devices"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setPaused(false);
      }}
    >
      {/* Desktop / tablet: full-bleed background image */}
      <div className="pointer-events-none absolute inset-0 z-0 hidden sm:block">
        <AnimatePresence mode="sync" initial={false}>
          <motion.img
            key={`desk-${slide.id}`}
            src={slide.imageUrl}
            alt=""
            aria-hidden
            initial={reduceMotion ? { opacity: 1 } : { opacity: 0, scale: 1.05 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={reduceMotion ? { opacity: 0 } : { opacity: 0, scale: 1.02 }}
            transition={{ duration: reduceMotion ? 0.2 : 0.9, ease: [0.22, 1, 0.36, 1] }}
            className={`absolute inset-0 h-full w-full object-cover ${focal}`}
            fetchPriority={index === 0 ? 'high' : 'auto'}
            draggable={false}
          />
        </AnimatePresence>
        <div className={`absolute inset-0 ${desktopOverlay}`} aria-hidden />
      </div>

      <div className="relative z-10 mx-auto flex w-full max-w-7xl flex-col sm:min-h-[88vh] sm:justify-end">
        <div className="flex flex-col sm:pb-28 sm:pt-28 lg:pb-32">
          <AnimatePresence mode="wait">
            <motion.div
              key={`${slide.id}-copy`}
              initial={reduceMotion ? false : { opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              exit={reduceMotion ? undefined : { opacity: 0, y: -8 }}
              transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
              className="mx-auto w-full max-w-xl px-4 pt-4 text-center sm:mx-0 sm:max-w-2xl sm:px-10 sm:pt-0 sm:text-left lg:px-16"
            >
              {/* Brand is already in the sticky nav on mobile — keep hero brand for desktop/tablet only */}
              <p
                className={`hidden font-display text-6xl font-semibold leading-[0.95] tracking-tight text-balance sm:block md:text-7xl lg:text-8xl ${brandClass}`}
              >
                Pixel Tech
              </p>
              <p
                className={`text-[10px] font-medium uppercase tracking-[0.16em] sm:mt-5 sm:text-xs sm:tracking-[0.18em] ${kindClass}`}
              >
                {slide.kind}
              </p>
              <h2
                className={`mt-1 font-display text-[1.65rem] font-semibold leading-[1.15] text-balance sm:mt-2 sm:text-2xl sm:font-medium md:text-3xl ${headlineClass}`}
              >
                {slide.headline}
              </h2>
              <p
                className={`mx-auto mt-1.5 max-w-[19rem] text-[13px] leading-snug sm:mx-0 sm:mt-3 sm:max-w-md sm:text-base sm:leading-relaxed ${supportClass}`}
              >
                {slide.support}
              </p>

              <div className="mt-3 flex flex-wrap items-center justify-center gap-2 sm:mt-8 sm:justify-start sm:gap-3">
                <button
                  type="button"
                  onClick={() => jumpToCatalog(slide.category)}
                  className="inline-flex min-h-9 items-center justify-center rounded-full bg-[#0071e3] px-4.5 py-2 text-[13px] font-medium text-white transition-[colors,transform] hover:bg-[#0077ed] active:scale-[0.98] cursor-pointer sm:min-h-10 sm:px-5 sm:py-2.5 sm:text-[14px]"
                >
                  {slide.ctaLabel}
                </button>
                <button
                  type="button"
                  onClick={() => jumpToCatalog()}
                  className={`inline-flex min-h-9 items-center justify-center gap-1.5 rounded-full border px-4.5 py-2 text-[13px] font-medium transition-[colors,transform] active:scale-[0.98] cursor-pointer sm:min-h-10 sm:px-5 sm:py-2.5 sm:text-[14px] ${outlineCta}`}
                >
                  Browse all
                  <ArrowDown className="h-3.5 w-3.5 opacity-80" />
                </button>
              </div>
            </motion.div>
          </AnimatePresence>

          {/* Mobile: full-bleed product plane flush under CTAs */}
          <div className="relative mt-2 w-full sm:hidden">
            <div
              className={`relative w-full overflow-hidden ${
                isDark ? 'bg-black' : 'bg-mist dark:bg-[#0B1220]'
              } aspect-[4/3] min-h-[240px] max-h-[min(52vh,420px)]`}
            >
              <AnimatePresence mode="sync" initial={false}>
                <motion.img
                  key={`mob-${slide.id}`}
                  src={slide.imageUrl}
                  alt={slide.alt}
                  initial={reduceMotion ? { opacity: 1 } : { opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={reduceMotion ? { opacity: 0 } : { opacity: 0 }}
                  transition={{ duration: reduceMotion ? 0.15 : 0.4, ease: [0.22, 1, 0.36, 1] }}
                  className={`absolute inset-0 h-full w-full ${
                    isDark
                      ? `object-cover ${mobileFocal}`
                      : 'object-contain object-center'
                  }`}
                  fetchPriority={index === 0 ? 'high' : 'auto'}
                  draggable={false}
                />
              </AnimatePresence>

              {count > 1 && (
                <div className="absolute inset-x-0 bottom-3 z-10 flex items-center justify-center gap-2 px-4">
                  <button
                    type="button"
                    aria-label="Previous slide"
                    onClick={() => go(index - 1)}
                    className={`inline-flex h-8 w-8 items-center justify-center rounded-full border backdrop-blur-md transition-colors cursor-pointer ${controlClass}`}
                  >
                    <ChevronLeft className="h-3.5 w-3.5" />
                  </button>
                  <div className="flex items-center gap-1.5" role="tablist" aria-label="Hero slides">
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
                                ? 'w-5 bg-white'
                                : 'w-5 bg-[#1d1d1f]'
                              : isDark
                                ? 'w-1.5 bg-white/40'
                                : 'w-1.5 bg-black/25'
                          }`}
                        />
                      );
                    })}
                  </div>
                  <button
                    type="button"
                    aria-label="Next slide"
                    onClick={() => go(index + 1)}
                    className={`inline-flex h-8 w-8 items-center justify-center rounded-full border backdrop-blur-md transition-colors cursor-pointer ${controlClass}`}
                  >
                    <ChevronRight className="h-3.5 w-3.5" />
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {count > 1 && (
          <div className="absolute bottom-10 left-10 hidden items-center gap-3 sm:flex lg:left-16">
            <button
              type="button"
              aria-label="Previous slide"
              onClick={() => go(index - 1)}
              className={`inline-flex h-9 w-9 items-center justify-center rounded-full border backdrop-blur-sm transition-colors cursor-pointer ${controlClass}`}
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
                          ? 'w-7 bg-white'
                          : 'w-7 bg-[#1d1d1f]'
                        : isDark
                          ? 'w-2.5 bg-white/35 hover:bg-white/55'
                          : 'w-2.5 bg-black/20 hover:bg-black/35'
                    }`}
                  />
                );
              })}
            </div>
            <button
              type="button"
              aria-label="Next slide"
              onClick={() => go(index + 1)}
              className={`inline-flex h-9 w-9 items-center justify-center rounded-full border backdrop-blur-sm transition-colors cursor-pointer ${controlClass}`}
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>
    </section>
  );
}
