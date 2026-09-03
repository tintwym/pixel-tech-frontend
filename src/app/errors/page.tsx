import Link from 'next/link';
import { Cpu } from 'lucide-react';
import { ERROR_PAGE_CODES, ERROR_PAGES } from '@/lib/errorPages';

export const metadata = {
  title: 'Error pages · Pixel Tech',
  robots: { index: false, follow: false },
};

export default function ErrorsIndexPage() {
  return (
    <main className="min-h-screen bg-[#eef4f8] px-4 py-12">
      <div className="mx-auto max-w-2xl">
        <div className="mb-8 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#0284c7] text-white">
            <Cpu className="h-5 w-5" />
          </div>
          <div>
            <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.18em] text-[#0284c7]">
              Pixel Tech
            </p>
            <h1 className="font-display text-2xl font-semibold text-[#0f172a]">Error pages</h1>
          </div>
        </div>
        <p className="mb-6 text-sm text-[#64748b]">
          Preview branded HTTP error screens used across the storefront. Runtime crashes also use the
          500 UI via <code className="font-mono text-xs">error.tsx</code>.
        </p>
        <ul className="space-y-2">
          {ERROR_PAGE_CODES.map((code) => {
            const page = ERROR_PAGES[code];
            return (
              <li key={code}>
                <Link
                  href={`/errors/${code}`}
                  className="flex items-center justify-between rounded-2xl border border-[#0284c7]/12 bg-white px-4 py-3 shadow-market hover:border-[#0284c7]/30 transition-colors"
                >
                  <span className="font-mono text-sm font-semibold text-[#0284c7]">{code}</span>
                  <span className="text-sm text-[#0f172a]">{page.title}</span>
                </Link>
              </li>
            );
          })}
        </ul>
        <Link
          href="/"
          className="mt-8 inline-flex text-sm font-semibold text-[#0284c7] hover:text-[#0ea5e9]"
        >
          ← Back to store
        </Link>
      </div>
    </main>
  );
}
