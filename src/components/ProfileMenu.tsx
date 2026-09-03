'use client';

import React, { useEffect, useId, useRef, useState } from 'react';
import { ChevronDown, LogOut, UserRound } from 'lucide-react';

type ProfileMenuProps = {
  name: string;
  avatarUrl?: string;
  onOpenProfile: () => void;
  onSignOut: () => void;
  /** Desktop header vs mobile bottom nav */
  variant?: 'header' | 'mobile';
  active?: boolean;
};

function Avatar({
  name,
  avatarUrl,
  sizeClass,
}: {
  name: string;
  avatarUrl?: string;
  sizeClass: string;
}) {
  const [failed, setFailed] = useState(false);
  const initial = (name || 'A').charAt(0).toUpperCase();

  useEffect(() => {
    setFailed(false);
  }, [avatarUrl]);

  if (avatarUrl && !failed) {
    return (
      <img
        src={avatarUrl}
        alt=""
        className={`${sizeClass} rounded-full object-cover`}
        referrerPolicy="no-referrer"
        onError={() => setFailed(true)}
      />
    );
  }
  return (
    <span
      className={`flex ${sizeClass} items-center justify-center rounded-full bg-[#e0f2fe] text-[0.65em] font-semibold text-[#0284c7]`}
    >
      {initial}
    </span>
  );
}

export default function ProfileMenu({
  name,
  avatarUrl,
  onOpenProfile,
  onSignOut,
  variant = 'header',
  active = false,
}: ProfileMenuProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const menuId = useId();
  const toggleId = useId();

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onDoc);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDoc);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const closeAnd = (fn: () => void) => {
    setOpen(false);
    fn();
  };

  const menuPanel = (
    <div
      id={menuId}
      role="menu"
      className={`z-60 w-56 rounded-2xl border border-[#0284c7]/15 dark:border-white/10 bg-white dark:bg-[#121a24] shadow-xl py-1.5 ${
        variant === 'mobile'
          ? 'absolute bottom-[calc(100%+0.5rem)] right-0'
          : 'absolute right-0 top-[calc(100%+0.4rem)]'
      }`}
    >
      <div className="px-3 py-2.5 border-b border-slate-100 dark:border-white/10">
        <p className="text-sm font-semibold text-slate-800 dark:text-white truncate">{name}</p>
        <p className="text-[11px] text-slate-500 dark:text-slate-400">
          {variant === 'mobile' ? 'Signed in' : 'Manage your account'}
        </p>
      </div>
      <button
        type="button"
        role="menuitem"
        onClick={() => closeAnd(onOpenProfile)}
        className="w-full flex items-center gap-2.5 px-3 py-2.5 text-left text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-white/5 cursor-pointer"
      >
        <UserRound className="w-4 h-4 text-[#0284c7]" />
        Account settings
      </button>
      <button
        type="button"
        role="menuitem"
        onClick={() => closeAnd(onSignOut)}
        className="w-full flex items-center gap-2.5 px-3 py-2.5 text-left text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 cursor-pointer"
      >
        <LogOut className="w-4 h-4" />
        Sign out
      </button>
    </div>
  );

  if (variant === 'mobile') {
    return (
      <div ref={rootRef} className="relative flex flex-col items-center">
        <button
          type="button"
          id={toggleId}
          aria-label="Account menu"
          aria-haspopup="menu"
          aria-expanded={open}
          aria-controls={menuId}
          onClick={() => setOpen((v) => !v)}
          className={`flex flex-col items-center justify-center p-1.5 rounded-xl transition-colors min-w-12 min-h-11 ${
            active || open
              ? 'text-sky-500 dark:text-sky-400 font-extrabold'
              : 'text-slate-500 dark:text-slate-400 hover:text-sky-500'
          }`}
        >
          <Avatar name={name} avatarUrl={avatarUrl} sizeClass="w-5 h-5" />
          <span className="text-[9px] font-bold mt-0.5">Profile</span>
        </button>
        {open && menuPanel}
      </div>
    );
  }

  return (
    <div ref={rootRef} className="relative hidden sm:block">
      <button
        type="button"
        id={toggleId}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={menuId}
        aria-label="Account menu"
        onClick={() => setOpen((v) => !v)}
        className={`flex items-center gap-1.5 border border-[#0284c7]/15 dark:border-white/10 p-1 pr-2 rounded-full hover:bg-white/80 dark:hover:bg-[#121a24] transition-colors cursor-pointer ${
          open || active ? 'bg-white/90 dark:bg-[#121a24] ring-2 ring-[#0284c7]/25' : ''
        }`}
      >
        <Avatar name={name} avatarUrl={avatarUrl} sizeClass="w-7 h-7" />
        <ChevronDown
          className={`w-3.5 h-3.5 text-slate-500 dark:text-slate-400 transition-transform ${open ? 'rotate-180' : ''}`}
        />
      </button>
      {open && menuPanel}
    </div>
  );
}
