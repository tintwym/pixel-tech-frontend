'use client';

import ErrorPageShell from '@/components/ErrorPageShell';
import type { ErrorPageCopy } from '@/lib/errorPages';

const RETRY_CODES = new Set(['408', '429', '500', '502', '503', '504']);

export default function ErrorPagePreview({ page }: { page: ErrorPageCopy }) {
  const canRetry = RETRY_CODES.has(page.code);

  return (
    <ErrorPageShell
      code={page.code}
      title={page.title}
      description={page.description}
      primaryHref={page.primaryHref ?? '/'}
      primaryLabel={page.primaryLabel ?? 'Back to store'}
      secondaryHref={page.secondaryHref}
      secondaryLabel={page.secondaryLabel}
      onRetry={canRetry ? () => window.location.reload() : undefined}
      showHome
    />
  );
}
