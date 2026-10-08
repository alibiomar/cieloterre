"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, Images, X } from "lucide-react";
import { SafeImage } from "@/components/safe-image";

/**
 * Desktop: one large photo plus a mosaic. Mobile: a swipeable rail.
 * Any photo opens a full-screen viewer with keyboard and swipe navigation.
 */
export function Gallery({ images, title }: { images: string[]; title: string }) {
  const [open, setOpen] = useState<number | null>(null);
  const [slide, setSlide] = useState(0);
  const rail = useRef<HTMLDivElement>(null);
  const touch = useRef<number | null>(null);
  const count = images.length;

  const go = useCallback((delta: number) => setOpen((i) => (i === null ? i : (i + delta + count) % count)), [count]);

  useEffect(() => {
    if (open === null) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(null);
      if (event.key === "ArrowRight") go(1);
      if (event.key === "ArrowLeft") go(-1);
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener("keydown", onKey);
    };
  }, [open, go]);

  const onRailScroll = () => {
    const el = rail.current;
    if (el) setSlide(Math.round(el.scrollLeft / el.clientWidth));
  };

  const tile = (index: number, className: string, sizes: string, priority = false) => (
    <button
      type="button"
      key={index}
      onClick={() => setOpen(index)}
      aria-label={`Agrandir la photo ${index + 1} sur ${count}`}
      className={`group relative overflow-hidden bg-ombre ${className}`}
    >
      <SafeImage src={images[index]} alt={index === 0 ? title : `${title}, photo ${index + 1}`} fill sizes={sizes} preload={priority} className="object-cover transition-transform duration-700 group-hover:scale-[1.03] motion-reduce:transition-none" />
    </button>
  );

  return (
    <>
      {/* Mobile rail */}
      <div className="relative -mx-[clamp(1.25rem,4.2vw,3.75rem)] lg:hidden">
        <div ref={rail} onScroll={onRailScroll} className="ct-rail flex snap-x snap-mandatory overflow-x-auto">
          {images.map((src, index) => (
            <button key={`${src}-${index}`} type="button" onClick={() => setOpen(index)} aria-label={`Agrandir la photo ${index + 1} sur ${count}`} className="relative aspect-[4/3] w-full shrink-0 snap-center bg-ombre">
              <SafeImage src={src} alt={index === 0 ? title : `${title}, photo ${index + 1}`} fill sizes="100vw" preload={index === 0} className="object-cover" />
            </button>
          ))}
        </div>
        {count > 1 && (
          <span className="ct-num pointer-events-none absolute bottom-3 right-4 rounded-full bg-nuit/75 px-3 py-1 text-sm text-white">
            {slide + 1} / {count}
          </span>
        )}
      </div>

      {/* Desktop mosaic */}
      <div className="relative hidden h-[min(36rem,62svh)] grid-cols-4 grid-rows-2 gap-2 overflow-hidden rounded-lg lg:grid">
        {tile(0, count === 1 ? "col-span-4 row-span-2" : "col-span-2 row-span-2", "50vw", true)}
        {count === 2 && tile(1, "col-span-2 row-span-2", "50vw")}
        {count === 3 && [1, 2].map((i) => tile(i, "col-span-2 row-span-1", "50vw"))}
        {count === 4 && (
          <>
            {tile(1, "col-span-2 row-span-1", "50vw")}
            {tile(2, "col-span-1 row-span-1", "25vw")}
            {tile(3, "col-span-1 row-span-1", "25vw")}
          </>
        )}
        {count >= 5 && [1, 2, 3, 4].map((i) => tile(i, "col-span-1 row-span-1", "25vw"))}
        {count > 1 && (
          <button type="button" onClick={() => setOpen(0)} className="ct-btn ct-btn--light ct-btn--sm absolute bottom-4 right-4 shadow-md">
            <Images size={16} aria-hidden /> Voir les {count} photos
          </button>
        )}
      </div>

      {/* Viewer */}
      {open !== null && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={`Photos de ${title}`}
          className="on-dark fixed inset-0 z-[80] flex flex-col bg-nuit/97 text-white"
          onTouchStart={(e) => (touch.current = e.touches[0].clientX)}
          onTouchEnd={(e) => {
            if (touch.current === null) return;
            const dx = e.changedTouches[0].clientX - touch.current;
            if (Math.abs(dx) > 50) go(dx < 0 ? 1 : -1);
            touch.current = null;
          }}
        >
          <div className="flex items-center justify-between px-5 py-4">
            <p className="ct-num text-sm text-white/80">{open + 1} / {count}</p>
            <button type="button" onClick={() => setOpen(null)} aria-label="Fermer les photos" className="grid size-11 place-items-center rounded-full hover:bg-white/10"><X size={22} aria-hidden /></button>
          </div>
          <div className="relative flex-1">
            <SafeImage key={images[open]} src={images[open]} alt={`${title}, photo ${open + 1}`} fill sizes="100vw" className="object-contain" />
            {count > 1 && (
              <>
                <button type="button" onClick={() => go(-1)} aria-label="Photo précédente" className="absolute left-3 top-1/2 grid size-12 -translate-y-1/2 place-items-center rounded-full bg-white/15 backdrop-blur hover:bg-white/25"><ChevronLeft aria-hidden /></button>
                <button type="button" onClick={() => go(1)} aria-label="Photo suivante" className="absolute right-3 top-1/2 grid size-12 -translate-y-1/2 place-items-center rounded-full bg-white/15 backdrop-blur hover:bg-white/25"><ChevronRight aria-hidden /></button>
              </>
            )}
          </div>
          {count > 1 && (
            <div className="ct-rail flex gap-2 overflow-x-auto px-5 py-4">
              {images.map((src, index) => (
                <button key={`${src}-${index}`} type="button" onClick={() => setOpen(index)} aria-label={`Photo ${index + 1}`} aria-current={index === open} className={`relative h-16 w-24 shrink-0 overflow-hidden rounded ${index === open ? "ring-2 ring-ciel" : "opacity-60 hover:opacity-100"}`}>
                  <SafeImage src={src} alt="" fill sizes="96px" className="object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </>
  );
}
