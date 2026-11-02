const API_BASE =
  (typeof process !== 'undefined' && process.env.NEXT_PUBLIC_API_BASE_URL) ||
  '/api';

export type PromoDiscountType = 'FIXED_MMK' | 'PERCENT' | 'FREE_SHIPPING';

export type AppliedPromo = {
  code: string;
  discountType: PromoDiscountType;
  amount: number;
  label?: string;
  /** Loyalty codes require profile redemption first. */
  source: 'api' | 'loyalty';
};

type ValidateResponse = {
  valid?: boolean;
  code?: string | null;
  discountType?: string | null;
  amount?: number | string | null;
  label?: string | null;
  message?: string | null;
};

function apiUrl(path: string): string {
  const base = String(API_BASE).replace(/\/$/, '');
  return `${base}${path.startsWith('/') ? path : `/${path}`}`;
}

export function discountForPromo(
  promo: AppliedPromo | null,
  subtotal: number,
  deliveryFee: number
): number {
  if (!promo) return 0;
  if (promo.discountType === 'FREE_SHIPPING') return deliveryFee;
  if (promo.discountType === 'PERCENT') {
    return Math.floor((subtotal * promo.amount) / 100);
  }
  return Math.max(0, Math.floor(promo.amount));
}

const LOYALTY: Record<string, Omit<AppliedPromo, 'source'>> = {
  LOYAL2K: { code: 'LOYAL2K', discountType: 'FIXED_MMK', amount: 2000, label: '2,000 MMK loyalty' },
  FREEDEL: { code: 'FREEDEL', discountType: 'FREE_SHIPPING', amount: 0, label: 'Free delivery' },
  LUXTECH: { code: 'LUXTECH', discountType: 'FIXED_MMK', amount: 10000, label: '10,000 MMK voucher' },
};

export async function resolvePromoCode(
  rawCode: string,
  redeemedCoupons: string[]
): Promise<{ promo?: AppliedPromo; error?: string }> {
  const code = rawCode.trim().toUpperCase();
  if (!code) return { error: 'Enter a coupon code first.' };

  try {
    const res = await fetch(
      `${apiUrl('/promos/validate')}?code=${encodeURIComponent(code)}`,
      { headers: { Accept: 'application/json' } }
    );
    if (res.ok) {
      const data = (await res.json()) as ValidateResponse;
      if (data.valid && data.code && data.discountType) {
        const type = data.discountType as PromoDiscountType;
        if (type === 'FIXED_MMK' || type === 'PERCENT' || type === 'FREE_SHIPPING') {
          return {
            promo: {
              code: data.code,
              discountType: type,
              amount: Number(data.amount) || 0,
              label: data.label || undefined,
              source: 'api',
            },
          };
        }
      }
      if (data.message && data.valid === false) {
        // Fall through to loyalty codes when API says unknown/invalid.
        if (!/not valid/i.test(data.message)) {
          return { error: data.message };
        }
      }
    }
  } catch {
    /* offline — try loyalty */
  }

  const loyalty = LOYALTY[code];
  if (loyalty) {
    if (!redeemedCoupons.includes(code)) {
      return { error: 'Redeem this code with loyalty points in your profile first.' };
    }
    return { promo: { ...loyalty, source: 'loyalty' } };
  }

  return { error: 'This promotional code is not valid.' };
}
