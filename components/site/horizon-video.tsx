"use client";

import { useEffect, useRef } from "react";

const clamp = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const ease = (t: number) => t * t * (3 - 2 * t);

/**
 * The doorway opens as you scroll: a small arch of video widens, its curve
 * flattening until the film fills the screen. One scroll-linked moment; the
 * poster is shown instead when the visitor prefers reduced motion.
 */
export function HorizonVideo({
  src,
  poster,
  title,
  text,
}: {
  src: string;
  poster?: string;
  title: string;
  text: string;
}) {
  const section = useRef<HTMLElement>(null);
  const frame = useRef<HTMLDivElement>(null);
  const caption = useRef<HTMLDivElement>(null);
  const video = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const root = section.current;
    const box = frame.current;
    const words = caption.current;
    if (!root || !box || !words) return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let raf = 0;

    const paint = () => {
      raf = 0;
      const rect = root.getBoundingClientRect();
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      const travel = Math.max(1, rect.height - vh);
      const p = reduced ? 1 : clamp(-rect.top / (travel * 0.82));
      const e = ease(p);

      const startW = vw < 768 ? vw * 0.68 : Math.min(vw * 0.34, 520);
      const startH = vw < 768 ? vh * 0.62 : vh * 0.74;
      const w = startW + (vw - startW) * e;
      const h = startH + (vh - startH) * e;
      const radius = (w / 2) * (1 - e) ** 1.4;

      box.style.width = `${w}px`;
      box.style.height = `${h}px`;
      box.style.borderRadius = `${radius}px ${radius}px 0 0`;
      words.style.opacity = String(clamp((e - 0.62) / 0.3));
      words.style.transform = `translateY(${(1 - clamp((e - 0.62) / 0.3)) * 24}px)`;
    };
    const request = () => {
      if (!raf) raf = requestAnimationFrame(paint);
    };

    paint();
    window.addEventListener("scroll", request, { passive: true });
    window.addEventListener("resize", request);

    const el = video.current;
    let observer: IntersectionObserver | undefined;
    if (el && !reduced) {
      observer = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) void el.play().catch(() => {});
          else el.pause();
        },
        { threshold: 0.15 },
      );
      observer.observe(root);
    }

    return () => {
      window.removeEventListener("scroll", request);
      window.removeEventListener("resize", request);
      observer?.disconnect();
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <section ref={section} aria-label={title} className="on-dark relative h-[260svh] bg-nuit">
      <div className="sticky top-0 grid h-[100svh] place-items-end overflow-hidden">
        <div
          ref={frame}
          className="relative mx-auto overflow-hidden bg-nuit-2"
          style={{ width: "34vw", height: "70svh", borderRadius: "9999px 9999px 0 0" }}
        >
          <video
            ref={video}
            src={src}
            poster={poster}
            muted
            loop
            playsInline
            preload="none"
            aria-hidden
            className="absolute inset-0 h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-nuit/70 via-nuit/10 to-transparent" aria-hidden />
          <div ref={caption} className="absolute inset-x-0 bottom-0 p-6 text-white opacity-0 sm:p-12 lg:p-16">
            <h2 className="ct-h2 max-w-2xl">{title}</h2>
            <p className="mt-4 max-w-md text-lg text-white/85">{text}</p>
          </div>
        </div>
      </div>
    </section>
  );
}
