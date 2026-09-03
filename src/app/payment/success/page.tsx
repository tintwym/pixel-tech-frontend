'use client';

import { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { CheckCircle2, Loader2 } from 'lucide-react';
import { getStoredToken } from '@/lib/authApi';

function PaymentSuccessContent() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get('session_id');
  const [status, setStatus] = useState<'idle' | 'confirming' | 'done' | 'error'>('idle');
  const [message, setMessage] = useState('Payment received.');

  useEffect(() => {
    if (!sessionId) {
      setStatus('done');
      setMessage('Payment complete. You can return to the store.');
      return;
    }

    const token = getStoredToken();
    if (!token) {
      setStatus('done');
      setMessage('Payment complete. Sign in on the storefront to sync order history.');
      return;
    }

    let cancelled = false;
    setStatus('confirming');
    (async () => {
      try {
        const res = await fetch(`/api/checkout/confirm?sessionId=${encodeURIComponent(sessionId)}`, {
          method: 'POST',
          headers: {
            Accept: 'application/json',
            Authorization: `Bearer ${token}`,
          },
        });
        if (cancelled) return;
        if (!res.ok) {
          setStatus('error');
          setMessage('Payment succeeded, but order sync failed. Contact support with your receipt.');
          return;
        }
        setStatus('done');
        setMessage('Order confirmed. Thank you for shopping at Pixel Tech.');
      } catch {
        if (!cancelled) {
          setStatus('error');
          setMessage('Could not reach the API to confirm the order. Your card was still charged.');
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [sessionId]);

  return (
    <main className="min-h-screen flex items-center justify-center bg-[#eef4f8] px-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-market text-center space-y-4">
        {status === 'confirming' ? (
          <Loader2 className="mx-auto h-10 w-10 animate-spin text-[#0284c7]" />
        ) : (
          <CheckCircle2 className="mx-auto h-10 w-10 text-[#0284c7]" />
        )}
        <h1 className="font-display text-2xl font-semibold text-[#0f172a]">Payment success</h1>
        <p className="text-sm text-slate-600">{message}</p>
        <Link
          href="/"
          className="inline-flex items-center justify-center rounded-xl bg-[#0284c7] px-4 py-2.5 text-sm font-semibold text-white"
        >
          Back to store
        </Link>
      </div>
    </main>
  );
}

export default function PaymentSuccessPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen flex items-center justify-center bg-[#eef4f8]">
          <Loader2 className="h-8 w-8 animate-spin text-[#0284c7]" />
        </main>
      }
    >
      <PaymentSuccessContent />
    </Suspense>
  );
}
