'use client';

import { useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';

/** Shareable product URLs land here, then open the storefront detail sheet. */
export default function ProductDeepLinkPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const id = typeof params?.id === 'string' ? params.id : Array.isArray(params?.id) ? params.id[0] : '';

  useEffect(() => {
    if (!id) {
      router.replace('/');
      return;
    }
    router.replace(`/?product=${encodeURIComponent(id)}`);
  }, [id, router]);

  return (
    <main className="min-h-[40vh] flex items-center justify-center p-8">
      <p className="text-sm text-slate-500">Opening product…</p>
    </main>
  );
}
