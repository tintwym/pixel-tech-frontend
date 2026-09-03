'use client';

import Link from 'next/link';
import {
  Cpu,
  Home,
  RefreshCw,
  ArrowLeft,
  ShieldAlert,
  Lock,
  SearchX,
  ServerCrash,
  WifiOff,
  Timer,
} from 'lucide-react';
import type { ErrorPageCode } from '@/lib/errorPages';

type ErrorPageShellProps = {
  code?: string;
  title: string;
  description: string;
  digest?: string;
  primaryHref?: string;
  primaryLabel?: string;
  secondaryHref?: string;
  secondaryLabel?: string;
  onRetry?: () => void;
  showHome?: boolean;
};

function StatusIcon({ code }: { code: string }) {
  const className = 'h-6 w-6';
  switch (code as ErrorPageCode | string) {
    case '401':
      return <Lock className={className} />;
    case '403':
      return <ShieldAlert className={className} />;
    case '404':
      return <SearchX className={className} />;
    case '408':
    case '504':
      return <Timer className={className} />;
    case '502':
    case '503':
      return <WifiOff className={className} />;
    case '500':
      return <ServerCrash className={className} />;
    default:
      return <Cpu className={className} />;
  }
}

export default function ErrorPageShell({
  code = 'Error',
  title,
  description,
  digest,
  primaryHref = '/',
  primaryLabel = 'Back to store',
  secondaryHref,
  secondaryLabel,
  onRetry,
  showHome = true,
}: ErrorPageShellProps) {
  return (
    <main className="relative min-h-screen flex items-center justify-center px-4 py-16 overflow-hidden bg-[#eef4f8] text-[#0f172a]">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage:
            'radial-gradient(ellipse 80% 50% at 10% -10%, rgb(224 242 254 / 0.95), transparent), radial-gradient(ellipse 60% 40% at 100% 0%, rgb(186 230 253 / 0.4), transparent)',
        }}
      />
      <div className="relative w-full max-w-lg rounded-3xl bg-white/95 p-8 sm:p-10 shadow-market border border-[#0284c7]/12 text-center">
        <div className="mx-auto mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-[#0284c7] text-white shadow-market">
          <StatusIcon code={code} />
        </div>
        <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.2em] text-[#0284c7]">
          Pixel Tech · {code}
        </p>
        <h1 className="mt-3 font-display text-3xl sm:text-4xl font-semibold tracking-tight text-[#0f172a]">
          {title}
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-[#64748b]">{description}</p>
        {digest ? (
          <p className="mt-4 font-mono text-[10px] text-slate-400 break-all">Ref: {digest}</p>
        ) : null}

        <div className="mt-8 flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-3">
          {onRetry ? (
            <button
              type="button"
              onClick={onRetry}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#0284c7] px-5 py-3 text-sm font-semibold text-white hover:bg-[#0ea5e9] transition-colors cursor-pointer"
            >
              <RefreshCw className="h-4 w-4" />
              Try again
            </button>
          ) : showHome ? (
            <Link
              href={primaryHref}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#0284c7] px-5 py-3 text-sm font-semibold text-white hover:bg-[#0ea5e9] transition-colors"
            >
              <Home className="h-4 w-4" />
              {primaryLabel}
            </Link>
          ) : null}

          {onRetry && showHome ? (
            <Link
              href={primaryHref}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              {primaryLabel}
            </Link>
          ) : null}

          {!onRetry && secondaryHref && secondaryLabel ? (
            <Link
              href={secondaryHref}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
            >
              {secondaryLabel}
            </Link>
          ) : null}
        </div>
      </div>
    </main>
  );
}
