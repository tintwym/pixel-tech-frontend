const API_BASE =
  (typeof process !== 'undefined' && process.env.NEXT_PUBLIC_API_BASE_URL) ||
  '/api';

export type SmartBundle = {
  name: string;
  description: string;
  setupTime: string;
  difficulty: string;
  cartItems: string[];
  suggestedAddOns: string[];
  steps: string[];
};

function apiUrl(path: string): string {
  return `${String(API_BASE).replace(/\/$/, '')}${path}`;
}

async function errorMessage(res: Response): Promise<string> {
  try {
    const data = await res.json();
    if (typeof data?.message === 'string' && data.message) return data.message;
  } catch {
    /* fall through */
  }
  if (res.status === 429) return 'Too many requests. Please wait a minute and try again.';
  if (res.status === 503) return 'AI suggestions are not available right now.';
  return 'Couldn’t generate bundle ideas. Please try again.';
}

/** Accessory bundle ideas for the devices in the cart (Spring `/api/ai/bundles`). */
export async function fetchSmartBundles(items: string[], signal?: AbortSignal): Promise<SmartBundle[]> {
  let res: Response;
  try {
    res = await fetch(apiUrl('/ai/bundles'), {
      method: 'POST',
      headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
      body: JSON.stringify({ items }),
      signal,
    });
  } catch (err) {
    if ((err as Error)?.name === 'AbortError') throw err;
    throw new Error('Can’t reach Pixel Tech right now. Check your connection and try again.');
  }
  if (!res.ok) throw new Error(await errorMessage(res));
  const data = (await res.json()) as { bundles?: SmartBundle[] };
  return Array.isArray(data.bundles) ? data.bundles : [];
}
