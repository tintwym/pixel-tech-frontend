import ErrorPageShell from '@/components/ErrorPageShell';
import { ERROR_PAGES } from '@/lib/errorPages';

export default function NotFound() {
  const page = ERROR_PAGES['404'];
  return (
    <ErrorPageShell
      code={page.code}
      title={page.title}
      description={page.description}
      primaryHref={page.primaryHref}
      primaryLabel={page.primaryLabel}
    />
  );
}
