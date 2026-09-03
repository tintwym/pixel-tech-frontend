import ErrorPageShell from '@/components/ErrorPageShell';
import { ERROR_PAGES } from '@/lib/errorPages';

export default function ForbiddenPage() {
  const page = ERROR_PAGES['403'];
  return (
    <ErrorPageShell
      code={page.code}
      title={page.title}
      description={page.description}
      primaryHref={page.primaryHref}
      primaryLabel={page.primaryLabel}
      secondaryHref={page.secondaryHref}
      secondaryLabel={page.secondaryLabel}
    />
  );
}
