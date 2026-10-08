"use client";

import Link from "next/link";
import { useState } from "react";
import { SafeImage } from "@/components/safe-image";
import { plural } from "@/lib/format";

export type CityEntry = { name: string; count: number; image: string; href: string };

/**
 * Cities as a typographic index. Hovering (or focusing) a row swaps the arched
 * photograph beside it; on touch screens each row carries its own thumbnail.
 */
export function CityIndex({ cities }: { cities: CityEntry[] }) {
  const [active, setActive] = useState(0);

  return (
    <div className="grid gap-12 lg:grid-cols-[1.4fr_1fr] lg:gap-20">
      <ul className="border-t border-trait">
        {cities.map((city, index) => (
          <li key={city.name} className="border-b border-trait">
            <Link
              href={city.href}
              onMouseEnter={() => setActive(index)}
              onFocus={() => setActive(index)}
              className="group flex items-center gap-5 py-5 sm:py-6"
            >
              <span className="relative size-14 shrink-0 overflow-hidden rounded-full bg-ombre lg:hidden">
                <SafeImage src={city.image} alt="" fill sizes="56px" className="object-cover" />
              </span>
              <span
                className={`flex-1 text-[clamp(1.9rem,4.4vw,3.6rem)] font-light leading-none tracking-[-0.035em] transition-colors duration-200 ${
                  active === index ? "text-porte" : "text-encre"
                } lg:group-hover:text-porte`}
              >
                {city.name}
              </span>
              <span className="ct-num whitespace-nowrap text-sm text-muted sm:text-base">
                {city.count} {plural(city.count, "bien", "biens")}
              </span>
            </Link>
          </li>
        ))}
      </ul>

      <div className="relative hidden lg:block" aria-hidden>
        <div className="ct-arch relative sticky top-28 aspect-[3/4] w-full max-w-md bg-ombre">
          {cities.map((city, index) => (
            <SafeImage
              key={city.name}
              src={city.image}
              alt=""
              fill
              sizes="30vw"
              className={`object-cover transition-opacity duration-500 ${active === index ? "opacity-100" : "opacity-0"}`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
