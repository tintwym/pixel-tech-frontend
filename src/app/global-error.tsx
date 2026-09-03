'use client';

import { useEffect } from 'react';
import './globals.css';
import ErrorPageShell from '@/components/ErrorPageShell';
import { ERROR_PAGES } from '@/lib/errorPages';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('[Pixel Tech global]', error);
  }, [error]);

  const page = ERROR_PAGES['500'];

  return (
    <html lang="en">
      <body className="min-h-full font-sans">
        <ErrorPageShell
          code={page.code}
          title="App failed to load"
          description="A root-level error stopped the storefront. Try again, or refresh the page."
          digest={error.digest}
          onRetry={reset}
          primaryHref="/"
          primaryLabel="Back to store"
        />
      </body>
    </html>
  );
}
