"use client";

import { useState } from "react";
import Image, { type ImageProps } from "next/image";

const DEFAULT_FALLBACK = "/cieloterre-hero.png";

/**
 * Drop-in replacement for next/image that swaps to a placeholder when the
 * source fails to load — e.g. a storage object that was deleted or a bucket
 * that isn't public, which otherwise renders a broken image with no retry.
 */
export function SafeImage({ src, fallback = DEFAULT_FALLBACK, ...props }: ImageProps & { fallback?: string }) {
  const [broken, setBroken] = useState(false);
  return <Image {...props} src={broken ? fallback : src} onError={() => setBroken(true)} />;
}
