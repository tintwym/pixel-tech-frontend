import { GroceryItem } from '@/types';

/**
 * Demo catalog with real model names + Unsplash device photos (not official brand assets).
 * Prices are approximate MMK for storefront demos — not live retail quotes.
 */
export const INITIAL_GROCERIES: GroceryItem[] = [
  {
    id: 'p1',
    name: 'iPhone 16 Pro — 256GB',
    description: 'Apple A18 Pro, 6.3" Super Retina XDR, Pro camera system with 5x Telephoto. Titanium design in Desert Titanium.',
    category: 'Mobile',
    price: 4899000,
    currency: 'MMK',
    imageUrl: 'https://images.unsplash.com/photo-1695048133142-1a20484d2569?auto=format&fit=crop&w=600&q=80',
    stock: 18,
    maxStock: 24,
    availabilityZone: 'All Zones',
    featuresRestrictions: ['5G', 'OLED', 'A18 Pro', 'USB-C'],
    isSubscriptionAvailable: true,
    rating: 4.9,
    unit: '1 unit'
  },
  {
    id: 'p2',
    name: 'iPhone 16 — 128GB',
    description: 'A18 chip, Camera Control, longer battery life, and Action Button. Everyday flagship in Ultramarine.',
    category: 'Mobile',
    price: 3299000,
    currency: 'MMK',
    imageUrl: 'https://images.unsplash.com/photo-1592899677977-9c10ca588bbd?auto=format&fit=crop&w=600&q=80',
    stock: 28,
    maxStock: 35,
    availabilityZone: 'Downtown Yangon',
    featuresRestrictions: ['5G', 'OLED', 'A18', 'USB-C'],
    isSubscriptionAvailable: true,
    rating: 4.8,
    unit: '1 unit'
  },
  {
    id: 'p3',
    name: 'iPhone 17 Pro Max — 256GB',
    description: 'Largest Pro display, advanced camera stack, and all-day battery. Latest Apple flagship for creators and power users.',
    category: 'Mobile',
    price: 5899000,
    currency: 'MMK',
    imageUrl: 'https://images.unsplash.com/photo-1759820940611-facb87e629d8?auto=format&fit=crop&w=600&q=80',
    stock: 12,
    maxStock: 16,
    availabilityZone: 'Yankin',
    featuresRestrictions: ['5G', 'OLED', 'Pro Camera', 'USB-C'],
    isSubscriptionAvailable: true,
    rating: 4.9,
    unit: '1 unit'
  },
  {
    id: 'p4',
    name: 'Samsung Galaxy S25 Ultra — 256GB',
    description: 'Dynamic AMOLED 2X, S Pen, and pro-grade zoom cameras. Android flagship with DeX and long battery life.',
    category: 'Mobile',
    price: 4599000,
    currency: 'MMK',
    imageUrl: 'https://images.unsplash.com/photo-1610945415295-d9bbf067e59c?auto=format&fit=crop&w=600&q=80',
    stock: 16,
    maxStock: 22,
    availabilityZone: 'Bahan',
    featuresRestrictions: ['5G', 'AMOLED', 'S Pen', 'Fast Charge'],
    isSubscriptionAvailable: true,
    rating: 4.8,
    unit: '1 unit'
  },
  {
    id: 'p5',
    name: 'MacBook Air 13" M3 — 16GB/512GB',
    description: 'Fanless M3 performance, Liquid Retina display, MagSafe, and all-day battery. Ideal for students and light creators.',
    category: 'Laptop',
    price: 4299000,
    currency: 'MMK',
    imageUrl: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=600&q=80',
    stock: 14,
    maxStock: 18,
    availabilityZone: 'All Zones',
    featuresRestrictions: ['SSD', '16GB RAM', 'M3', 'USB-C'],
    isSubscriptionAvailable: true,
    rating: 4.9,
    unit: '1 unit'
  },
  {
    id: 'p6',
    name: 'MacBook Pro 14" M4 Pro — 24GB/512GB',
    description: 'Liquid Retina XDR, pro ports, and sustained performance for code, video, and 3D. Space Black finish.',
    category: 'Laptop',
    price: 7899000,
    currency: 'MMK',
    imageUrl: 'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?auto=format&fit=crop&w=600&q=80',
    stock: 8,
    maxStock: 12,
    availabilityZone: 'Hlaing',
    featuresRestrictions: ['SSD', 'M4 Pro', 'XDR', 'Thunderbolt'],
    isSubscriptionAvailable: false,
    rating: 4.9,
    unit: '1 unit'
  },
  {
    id: 'p7',
    name: 'ASUS ROG Strix G16',
    description: 'High-refresh gaming laptop with discrete RTX GPU, RGB keyboard, and advanced cooling for esports and creators.',
    category: 'Laptop',
    price: 5499000,
    currency: 'MMK',
    imageUrl: 'https://images.unsplash.com/photo-1603302576837-37561b2e2302?auto=format&fit=crop&w=600&q=80',
    stock: 9,
    maxStock: 12,
    availabilityZone: 'Bahan',
    featuresRestrictions: ['Gaming', 'RTX', '144Hz', 'RGB'],
    isSubscriptionAvailable: false,
    rating: 4.7,
    unit: '1 unit'
  },
  {
    id: 'p8',
    name: 'AirPods Pro 2 (USB-C)',
    description: 'Active Noise Cancellation, Adaptive Audio, Spatial Audio, and MagSafe charging case with USB-C.',
    category: 'Audio',
    price: 899000,
    currency: 'MMK',
    imageUrl: 'https://images.unsplash.com/photo-1600294037681-c80b4cb5b434?auto=format&fit=crop&w=600&q=80',
    stock: 40,
    maxStock: 50,
    availabilityZone: 'All Zones',
    featuresRestrictions: ['ANC', 'Wireless', 'Spatial Audio', 'USB-C'],
    isSubscriptionAvailable: true,
    rating: 4.8,
    unit: '1 pair'
  },
  {
    id: 'p9',
    name: 'Apple Watch Series 10 — 46mm',
    description: 'Thinner aluminum case, brighter Always-On Retina, sleep apnea notifications, and all-day battery.',
    category: 'Wearables',
    price: 1599000,
    currency: 'MMK',
    imageUrl: 'https://images.unsplash.com/photo-1434493789847-2f02dc6ca35d?auto=format&fit=crop&w=600&q=80',
    stock: 22,
    maxStock: 28,
    availabilityZone: 'Downtown Yangon',
    featuresRestrictions: ['GPS', 'Always-On', 'Waterproof', 'watchOS'],
    isSubscriptionAvailable: true,
    rating: 4.7,
    unit: '1 unit'
  },
  {
    id: 'p10',
    name: 'iPad Pro 11" M4 — 256GB',
    description: 'Ultra Retina XDR, Apple Pencil Pro support, and desktop-class M4 performance in a thin tablet.',
    category: 'Electronics',
    price: 3899000,
    currency: 'MMK',
    imageUrl: 'https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?auto=format&fit=crop&w=600&q=80',
    stock: 11,
    maxStock: 15,
    availabilityZone: 'Yankin',
    featuresRestrictions: ['Stylus', 'M4', 'OLED', 'Wi-Fi 6E'],
    isSubscriptionAvailable: true,
    rating: 4.8,
    unit: '1 unit'
  },
  {
    id: 'p11',
    name: 'Sony WH-1000XM5',
    description: 'Industry-leading noise cancelling headphones with 30-hour battery and multipoint Bluetooth.',
    category: 'Audio',
    price: 1299000,
    currency: 'MMK',
    imageUrl: 'https://images.unsplash.com/photo-1618366712010-f4ae9c647dcb?auto=format&fit=crop&w=600&q=80',
    stock: 20,
    maxStock: 25,
    availabilityZone: 'All Zones',
    featuresRestrictions: ['ANC', 'Wireless', 'Hi-Res', 'USB-C'],
    isSubscriptionAvailable: false,
    rating: 4.8,
    unit: '1 unit'
  },
  {
    id: 'p12',
    name: 'Samsung Galaxy Tab S9 — 128GB',
    description: 'AMOLED tablet with included S Pen, DeX mode, and IP68 durability for work and media.',
    category: 'Electronics',
    price: 2199000,
    currency: 'MMK',
    imageUrl: 'https://images.unsplash.com/photo-1611186871348-b1ce696e52c9?auto=format&fit=crop&w=600&q=80',
    stock: 14,
    maxStock: 18,
    availabilityZone: 'Hlaing',
    featuresRestrictions: ['AMOLED', 'S Pen', 'DeX', 'Wi-Fi 6'],
    isSubscriptionAvailable: true,
    rating: 4.6,
    unit: '1 unit'
  }
];

export const DIETARY_OPTIONS: { name: string; value: string }[] = [
  { name: '📱 5G', value: '5G' },
  { name: '💾 SSD', value: 'SSD' },
  { name: '🎮 Gaming', value: 'Gaming' },
  { name: '🎧 ANC', value: 'ANC' },
  { name: '⚡ Fast Charge', value: 'Fast Charge' },
  { name: '🔌 USB-C', value: 'USB-C' },
  { name: '📺 OLED', value: 'OLED' },
  { name: '✍️ Stylus', value: 'Stylus' },
  { name: '📡 Wi-Fi 6', value: 'Wi-Fi 6' }
];
export const ZONE_OPTIONS = [
  'All Zones',
  'Downtown Yangon',
  'Yankin',
  'Bahan',
  'Hlaing'
];

/** Real delivery zones (no "All Zones"), for address forms. */
export const DELIVERY_ZONES = ZONE_OPTIONS.filter((zone) => zone !== 'All Zones').map((zone) => ({
  value: zone,
  label: zone,
}));

export interface ZoneDeliveryInfo {
  zone: string;
  status: 'normal' | 'delayed' | 'suspended';
  delayMinutes: number;
  title: string;
  description: string;
  badgeColor: 'sky' | 'amber' | 'red';
}

export const ZONE_DELIVERY_STATUS: Record<string, ZoneDeliveryInfo> = {
  'Downtown Yangon': {
    zone: 'Downtown Yangon',
    status: 'normal',
    delayMinutes: 0,
    title: 'Same-Day Dispatch Active',
    description: 'Electronics leave the Downtown hub within 45–90 mins.',
    badgeColor: 'sky'
  },
  'Yankin': {
    zone: 'Yankin',
    status: 'normal',
    delayMinutes: 0,
    title: 'On-Time Express Active',
    description: 'Standard tech delivery running smoothly (60–90 mins).',
    badgeColor: 'sky'
  },
  'Bahan': {
    zone: 'Bahan',
    status: 'delayed',
    delayMinutes: 25,
    title: 'Courier Delay',
    description: 'Peak traffic causing +25m dispatch delay in Bahan.',
    badgeColor: 'amber'
  },
  'Hlaing': {
    zone: 'Hlaing',
    status: 'delayed',
    delayMinutes: 45,
    title: 'Route Congestion',
    description: 'Road works near Hlaing sector causing +45m delivery delay.',
    badgeColor: 'amber'
  },
  'All Zones': {
    zone: 'All Zones',
    status: 'delayed',
    delayMinutes: 25,
    title: 'Delays in 2 Zones',
    description: 'Bahan (+25m) and Hlaing (+45m) currently have active courier delays.',
    badgeColor: 'amber'
  }
};
