export type HeroSlideTone = 'dark' | 'light';

export type HeroSlide = {
  id: string;
  /** Full-bleed image (Cloudinary). */
  imageUrl: string;
  alt: string;
  /** New · Trending — shown as supporting copy, not a floating badge. */
  kind: 'New' | 'Trending';
  headline: string;
  support: string;
  ctaLabel: string;
  /** Catalog category to open on CTA. */
  category?: string;
  tone: HeroSlideTone;
};

/** Home hero carousel — add slides here as new campaign art lands. */
export const HERO_SLIDES: HeroSlide[] = [
  {
    id: 'macbook-pro-m6',
    imageUrl:
      'https://res.cloudinary.com/diqkh6yqr/image/upload/v1793586719/pixel-tech/hero/macbook-pro-m6.jpg',
    alt: 'MacBook Pro with M6 chip',
    kind: 'New',
    headline: 'MacBook Pro',
    support: '14-inch model now with M6. Flagship power delivered across Yangon.',
    ctaLabel: 'Shop',
    category: 'Laptops',
    tone: 'dark',
  },
  {
    id: 'iphone-duo',
    imageUrl:
      'https://res.cloudinary.com/diqkh6yqr/image/upload/v1793586721/pixel-tech/hero/iphone-duo.jpg',
    alt: 'iPhone Duo foldable display',
    kind: 'Trending',
    headline: 'iPhone Duo',
    support: 'Hello, hello. Foldable multitasking with secure MMK checkout.',
    ctaLabel: 'Shop',
    category: 'Smartphones',
    tone: 'light',
  },
];
