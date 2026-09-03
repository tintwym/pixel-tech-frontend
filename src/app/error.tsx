'use client';

import { useEffect } from 'react';
import ErrorPageShell from '@/components/ErrorPageShell';
import { ERROR_PAGES } from '@/lib/errorPages';

export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('[Pixel Tech]', error);
  }, [error]);

  const page = ERROR_PAGES['500'];

  return (
    <ErrorPageShell
      code={page.code}
      title={page.title}
      description={page.description}
      digest={error.digest}
      onRetry={reset}
      primaryHref="/"
      primaryLabel="Back to store"
    />
  );
}
