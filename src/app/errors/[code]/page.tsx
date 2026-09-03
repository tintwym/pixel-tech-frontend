import { notFound } from 'next/navigation';
import ErrorPagePreview from '@/components/ErrorPagePreview';
import {
  ERROR_PAGE_CODES,
  ERROR_PAGES,
  isErrorPageCode,
  type ErrorPageCode,
} from '@/lib/errorPages';

type PageProps = {
  params: Promise<{ code: string }>;
};

export function generateStaticParams() {
  return ERROR_PAGE_CODES.map((code) => ({ code }));
}

export async function generateMetadata({ params }: PageProps) {
  const { code } = await params;
  if (!isErrorPageCode(code)) {
    return { title: 'Error · Pixel Tech' };
  }
  const page = ERROR_PAGES[code];
  return {
    title: `${page.code} · ${page.title} · Pixel Tech`,
    robots: { index: false, follow: false },
  };
}

export default async function ErrorPreviewPage({ params }: PageProps) {
  const { code } = await params;
  if (!isErrorPageCode(code)) notFound();

  return <ErrorPagePreview page={ERROR_PAGES[code as ErrorPageCode]} />;
}
