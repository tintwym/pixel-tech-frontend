'use client';

import React, { useEffect, useState } from 'react';
import { Cpu } from 'lucide-react';

type ProductImageProps = {
  src?: string | null;
  alt: string;
  className?: string;
};

export function isProductVideoUrl(src?: string | null): boolean {
  if (!src) return false;
  const lower = src.toLowerCase();
  return (
    lower.includes('/video/upload/') ||
    /\.(mp4|webm|mov)(?:$|\?)/i.test(lower)
  );
}

/** Product photo or motion clip with graceful fallback when remote URL fails. */
export default function ProductImage({ src, alt, className = '' }: ProductImageProps) {
  const [failed, setFailed] = useState(false);
  const isVideo = isProductVideoUrl(src);

  useEffect(() => {
    setFailed(false);
  }, [src]);

  if (!src || failed) {
    return (
      <span
        className={`inline-flex items-center justify-center bg-[#e0f2fe] text-[#0284c7] ${className}`}
        role="img"
        aria-label={alt}
      >
        <Cpu className="w-1/3 h-1/3 max-w-10 max-h-10 opacity-70" />
      </span>
    );
  }

  if (isVideo) {
    return (
      <video
        key={src}
        src={src}
        className={className}
        aria-label={alt}
        autoPlay
        muted
        loop
        playsInline
        preload="metadata"
        onError={() => setFailed(true)}
      />
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      className={className}
      loading="lazy"
      referrerPolicy="no-referrer"
      onError={() => setFailed(true)}
    />
  );
}
