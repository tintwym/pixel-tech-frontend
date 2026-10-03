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

export type AiSearchMatch = { productId: string; name: string; reason: string };
export type AiSearchResult = { summary: string; results: AiSearchMatch[] };

async function errorMessage(res: Response, fallback: string): Promise<string> {
  try {
    const data = await res.json();
    if (typeof data?.message === 'string' && data.message) return data.message;
  } catch {
    /* fall through */
  }
  if (res.status === 429) return 'Too many requests. Please wait a minute and try again.';
  if (res.status === 503) return 'AI suggestions are not available right now.';
  return fallback;
}

async function postAi<T>(path: string, body: unknown, fallback: string, signal?: AbortSignal): Promise<T> {
  let res: Response;
  try {
    res = await fetch(apiUrl(path), {
      method: 'POST',
      headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal,
    });
  } catch (err) {
    if ((err as Error)?.name === 'AbortError') throw err;
    throw new Error('Can’t reach Pixel Tech right now. Check your connection and try again.');
  }
  if (!res.ok) throw new Error(await errorMessage(res, fallback));
  return (await res.json()) as T;
}

/** Accessory bundle ideas for the devices in the cart (Spring `/api/ai/bundles`). */
export async function fetchSmartBundles(items: string[], signal?: AbortSignal): Promise<SmartBundle[]> {
  const data = await postAi<{ bundles?: SmartBundle[] }>(
    '/ai/bundles',
    { items },
    'Couldn’t generate bundle ideas. Please try again.',
    signal
  );
  return Array.isArray(data.bundles) ? data.bundles : [];
}

/** Natural-language product search over the live catalog (Spring `/api/ai/search`). */
export async function fetchAiSearch(query: string, signal?: AbortSignal): Promise<AiSearchResult> {
  const data = await postAi<Partial<AiSearchResult>>(
    '/ai/search',
    { query },
    'Couldn’t search with AI right now. Please try again.',
    signal
  );
  return {
    summary: typeof data.summary === 'string' ? data.summary : '',
    results: Array.isArray(data.results) ? data.results : [],
  };
}
