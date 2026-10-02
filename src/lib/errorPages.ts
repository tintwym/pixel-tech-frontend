export type ErrorPageCode =
  | '400'
  | '401'
  | '403'
  | '404'
  | '408'
  | '429'
  | '500'
  | '502'
  | '503'
  | '504';

export type ErrorPageCopy = {
  code: ErrorPageCode;
  title: string;
  description: string;
  primaryHref?: string;
  primaryLabel?: string;
  secondaryHref?: string;
  secondaryLabel?: string;
};

export const ERROR_PAGES: Record<ErrorPageCode, ErrorPageCopy> = {
  '400': {
    code: '400',
    title: 'Bad request',
    description:
      'The request couldn’t be understood. Check what you submitted and try again.',
  },
  '401': {
    code: '401',
    title: 'Sign in required',
    description:
      'You need to sign in before accessing this part of Pixel Tech.',
    primaryHref: '/',
    primaryLabel: 'Back to store',
  },
  '403': {
    code: '403',
    title: 'Access forbidden',
    description:
      'You don’t have permission to view this page. If you think this is a mistake, contact support.',
    primaryHref: '/',
    primaryLabel: 'Back to store',
  },
  '404': {
    code: '404',
    title: 'Page not found',
    description:
      'This link doesn’t match a Pixel Tech page. Head back to the storefront to keep shopping.',
  },
  '408': {
    code: '408',
    title: 'Request timed out',
    description:
      'The server took too long to respond. Check your connection and try again.',
  },
  '429': {
    code: '429',
    title: 'Too many requests',
    description:
      'You’ve hit a rate limit. Wait a moment, then try again.',
  },
  '500': {
    code: '500',
    title: 'Something went wrong',
    description:
      'An unexpected server error occurred. You can try again, or return to the storefront.',
  },
  '502': {
    code: '502',
    title: 'Bad gateway',
    description:
      'Pixel Tech couldn’t reach an upstream service. The API may be restarting — try again shortly.',
  },
  '503': {
    code: '503',
    title: 'Service unavailable',
    description:
      'The storefront or API is temporarily unavailable for maintenance. Please check back soon.',
  },
  '504': {
    code: '504',
    title: 'Gateway timeout',
    description:
      'A connected service didn’t respond in time. Refresh the page or try again in a minute.',
  },
};

export const ERROR_PAGE_CODES = Object.keys(ERROR_PAGES) as ErrorPageCode[];

export function isErrorPageCode(value: string): value is ErrorPageCode {
  return value in ERROR_PAGES;
}

export function getErrorPage(code: string): ErrorPageCopy {
  if (isErrorPageCode(code)) return ERROR_PAGES[code];
  return ERROR_PAGES['500'];
}
