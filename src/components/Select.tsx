'use client';

import React, { useEffect, useId, useRef, useState, useSyncExternalStore } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'motion/react';
import { Check, ChevronDown } from 'lucide-react';

export type SelectOption<T extends string = string> = {
  value: T;
  label: string;
  /** Secondary line shown under the label in the menu. */
  description?: string;
};

type SelectProps<T extends string> = {
  value: T;
  options: readonly SelectOption<T>[];
  onChange: (value: T) => void;
  id?: string;
  'aria-label'?: string;
  'aria-labelledby'?: string;
  /** Shown before the selected label inside the trigger. */
  icon?: React.ReactNode;
  size?: 'sm' | 'md';
  /** Trigger box styling (border, background, padding, radius). */
  className?: string;
  disabled?: boolean;
};

type MenuPosition = { left: number; width: number; top?: number; bottom?: number; maxHeight: number };

const GAP = 6;
const MENU_MAX_HEIGHT = 288;
const noopSubscribe = () => () => {};

/** Themed replacement for a native `<select>` (select-only combobox pattern; focus stays on the trigger). */
export default function Select<T extends string>({
  value,
  options,
  onChange,
  id,
  'aria-label': ariaLabel,
  'aria-labelledby': ariaLabelledBy,
  icon,
  size = 'md',
  className = '',
  disabled = false,
}: SelectProps<T>) {
  const isClient = useSyncExternalStore(noopSubscribe, () => true, () => false);
  const autoId = useId();
  const baseId = id ?? `select-${autoId}`;
  const listboxId = `${baseId}-listbox`;
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLUListElement>(null);
  const optionRefs = useRef<(HTMLLIElement | null)[]>([]);
  const typeahead = useRef({ text: '', at: 0 });

  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const [position, setPosition] = useState<MenuPosition | null>(null);

  const selectedIndex = Math.max(0, options.findIndex((o) => o.value === value));
  const selected = options[selectedIndex];

  const measure = () => {
    const rect = triggerRef.current?.getBoundingClientRect();
    if (!rect) return;
    const spaceBelow = window.innerHeight - rect.bottom - GAP - 8;
    const spaceAbove = rect.top - GAP - 8;
    const rowHeight = options.some((o) => o.description) ? 54 : size === 'sm' ? 30 : 38;
    const wanted = Math.min(MENU_MAX_HEIGHT, options.length * rowHeight + 8);
    // Prefer opening downward (the menu scrolls) unless that leaves too little room.
    const placeAbove = spaceBelow < Math.min(wanted, 180) && spaceAbove > spaceBelow;
    setPosition({
      left: rect.left,
      width: rect.width,
      ...(placeAbove
        ? { bottom: window.innerHeight - rect.top + GAP }
        : { top: rect.bottom + GAP }),
      maxHeight: Math.max(120, Math.min(MENU_MAX_HEIGHT, placeAbove ? spaceAbove : spaceBelow)),
    });
  };

  const openMenu = (index = selectedIndex) => {
    if (disabled) return;
    measure();
    setActiveIndex(index);
    setOpen(true);
  };

  const closeMenu = () => setOpen(false);

  const choose = (index: number) => {
    const option = options[index];
    if (option && option.value !== value) onChange(option.value);
    closeMenu();
    triggerRef.current?.focus();
  };

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: PointerEvent) => {
      const target = e.target as Node;
      if (triggerRef.current?.contains(target) || menuRef.current?.contains(target)) return;
      setOpen(false);
    };
    const onReposition = (e: Event) => {
      if (menuRef.current?.contains(e.target as Node)) return;
      measure();
    };
    document.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('resize', onReposition);
    window.addEventListener('scroll', onReposition, true);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('resize', onReposition);
      window.removeEventListener('scroll', onReposition, true);
    };
    // measure only reads refs and props captured at open time
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  useEffect(() => {
    if (open) optionRefs.current[activeIndex]?.scrollIntoView({ block: 'nearest' });
  }, [open, activeIndex]);

  const jumpToTyped = (char: string, now: number) => {
    const state = typeahead.current;
    state.text = now - state.at > 600 ? char : state.text + char;
    state.at = now;
    const query = state.text.toLowerCase();
    const start = open ? activeIndex + (state.text.length === 1 ? 1 : 0) : selectedIndex + 1;
    for (let i = 0; i < options.length; i++) {
      const index = (start + i) % options.length;
      if (options[index].label.toLowerCase().startsWith(query)) {
        if (open) setActiveIndex(index);
        else if (options[index].value !== value) onChange(options[index].value);
        return;
      }
    }
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>) => {
    const last = options.length - 1;
    if (!open) {
      if (['ArrowDown', 'ArrowUp', 'Enter', ' '].includes(e.key)) {
        e.preventDefault();
        openMenu(e.key === 'ArrowUp' ? Math.max(0, selectedIndex - 1) : selectedIndex);
      } else if (e.key.length === 1 && !e.metaKey && !e.ctrlKey && !e.altKey) {
        jumpToTyped(e.key, e.timeStamp);
      }
      return;
    }
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setActiveIndex((i) => Math.min(last, i + 1));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setActiveIndex((i) => Math.max(0, i - 1));
        break;
      case 'Home':
      case 'PageUp':
        e.preventDefault();
        setActiveIndex(0);
        break;
      case 'End':
      case 'PageDown':
        e.preventDefault();
        setActiveIndex(last);
        break;
      case 'Enter':
      case ' ':
        e.preventDefault();
        choose(activeIndex);
        break;
      case 'Escape':
        e.preventDefault();
        closeMenu();
        break;
      case 'Tab':
        closeMenu();
        break;
      default:
        if (e.key.length === 1 && !e.metaKey && !e.ctrlKey && !e.altKey) jumpToTyped(e.key, e.timeStamp);
    }
  };

  const textSize = size === 'sm' ? 'text-xs' : 'text-sm';

  const menu = (
    <AnimatePresence>
      {open && position && (
        <motion.ul
          ref={menuRef}
          id={listboxId}
          role="listbox"
          aria-labelledby={ariaLabelledBy}
          aria-label={ariaLabelledBy ? undefined : ariaLabel}
          tabIndex={-1}
          initial={{ opacity: 0, y: position.top !== undefined ? -4 : 4, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: position.top !== undefined ? -4 : 4, scale: 0.98 }}
          transition={{ duration: 0.12, ease: 'easeOut' }}
          style={{
            position: 'fixed',
            left: position.left,
            top: position.top,
            bottom: position.bottom,
            minWidth: position.width,
            maxHeight: position.maxHeight,
          }}
          className={`z-1000 overflow-y-auto overscroll-contain rounded-xl border border-slate-200/80 dark:border-white/10 bg-white/95 dark:bg-[#121a24]/95 backdrop-blur-md p-1 shadow-[0_16px_40px_-12px_rgb(2_6_23/0.35)] ${
            position.top !== undefined ? 'origin-top' : 'origin-bottom'
          }`}
        >
          {options.map((option, index) => {
            const isSelected = index === selectedIndex;
            const isActive = index === activeIndex;
            return (
              <li
                key={option.value}
                ref={(el) => {
                  optionRefs.current[index] = el;
                }}
                id={`${baseId}-option-${index}`}
                role="option"
                aria-selected={isSelected}
                onPointerMove={() => setActiveIndex(index)}
                onClick={() => choose(index)}
                className={`flex cursor-pointer items-center gap-3 rounded-lg ${
                  size === 'sm' ? 'px-2.5 py-1.5' : 'px-3 py-2'
                } ${textSize} transition-colors ${
                  isActive ? 'bg-[#e0f2fe] dark:bg-white/8' : ''
                } ${
                  isSelected
                    ? 'font-semibold text-[#0284c7] dark:text-sky-400'
                    : 'text-slate-700 dark:text-slate-200'
                }`}
              >
                <span className="min-w-0 flex-1">
                  <span className="block whitespace-nowrap">{option.label}</span>
                  {option.description && (
                    <span className="block text-[11px] font-normal text-slate-400 dark:text-slate-500 whitespace-nowrap">
                      {option.description}
                    </span>
                  )}
                </span>
                <Check className={`h-4 w-4 shrink-0 ${isSelected ? 'opacity-100' : 'opacity-0'}`} aria-hidden />
              </li>
            );
          })}
        </motion.ul>
      )}
    </AnimatePresence>
  );

  return (
    <>
      <button
        ref={triggerRef}
        id={baseId}
        type="button"
        role="combobox"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={open ? listboxId : undefined}
        aria-activedescendant={open ? `${baseId}-option-${activeIndex}` : undefined}
        aria-label={ariaLabel}
        aria-labelledby={ariaLabelledBy}
        disabled={disabled}
        onClick={() => (open ? closeMenu() : openMenu())}
        onKeyDown={onKeyDown}
        className={`flex items-center gap-2 text-left ${textSize} cursor-pointer disabled:cursor-not-allowed disabled:opacity-60 outline-hidden focus-visible:ring-2 focus-visible:ring-[#0ea5e9]/40 ${className}`}
      >
        {icon}
        <span className="min-w-0 flex-1 truncate">{selected?.label}</span>
        <ChevronDown
          className={`h-4 w-4 shrink-0 text-slate-400 transition-transform duration-150 ${open ? 'rotate-180' : ''}`}
          aria-hidden
        />
      </button>
      {isClient && createPortal(menu, document.body)}
    </>
  );
}
