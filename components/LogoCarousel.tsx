"use client";

import { useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";

type Logo = { name: string; icon: ReactNode };

const I = ({ d }: { d: string }) => (
  <svg
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.6"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden
  >
    <path d={d} />
  </svg>
);

const LOGOS: Logo[] = [
  {
    name: "Lumina",
    icon: (
      <I d="M12 3l2.2 5.6L20 10l-5.8 1.4L12 17l-2.2-5.6L4 10l5.8-1.4L12 3z" />
    ),
  },
  {
    name: "Vertex",
    icon: <I d="M12 3l8 5-8 5-8-5 8-5zM4 15l8 5 8-5" />,
  },
  {
    name: "Nebula",
    icon: (
      <I d="M15 3a9 9 0 10 6 6 5 5 0 11-6-6zM9 12a3 3 0 106 0 3 3 0 00-6 0z" />
    ),
  },
  {
    name: "Aperture",
    icon: (
      <I d="M12 21a9 9 0 100-18 9 9 0 000 18zM12 3l4 9M21 12l-9 4M12 21l-4-9M3 12l9-4" />
    ),
  },
  {
    name: "Prism",
    icon: <I d="M12 3l9 16H3l9-16zM9.5 13h5" />,
  },
  {
    name: "Halcyon",
    icon: <I d="M3 12c3-6 6-6 9 0s6 6 9 0" />,
  },
  {
    name: "Obsidian",
    icon: <I d="M6 3h12l3 6-9 12L3 9l3-6zM3 9h18" />,
  },
  {
    name: "Kestrel",
    icon: (
      <I d="M12 2c2 4 2 7 0 10s-2 6 0 10c-4-2-7-5-7-10s3-8 7-10z" />
    ),
  },
  {
    name: "Solace",
    icon: (
      <I d="M12 3v3M12 18v3M3 12h3M18 12h3M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1M18.4 5.6l-2.1 2.1M7.7 16.3l-2.1 2.1M12 8a4 4 0 100 8 4 4 0 000-8z" />
    ),
  },
  {
    name: "Meridian",
    icon: <I d="M12 21a9 9 0 100-18 9 9 0 000 18zM3 12h18M12 3c3 3 3 15 0 18-3-3-3-15 0-18z" />,
  },
];

function MarqueeRow({
  logos,
  reverse = false,
  duration,
}: {
  logos: Logo[];
  reverse?: boolean;
  duration: number;
}) {
  const doubled = [...logos, ...logos];

  return (
    <div className="marquee-mask group relative flex overflow-hidden">
      <div
        className="marquee-track flex w-max shrink-0 items-center gap-14 pr-14 sm:gap-20 sm:pr-20"
        style={{
          animationDuration: `${duration}s`,
          animationDirection: reverse ? "reverse" : "normal",
        }}
      >
        {doubled.map((logo, i) => (
          <div
            key={`${logo.name}-${i}`}
            className="flex shrink-0 items-center gap-2.5 text-zinc-500 transition-colors duration-300 hover:text-zinc-200"
          >
            {logo.icon}
            <span className="whitespace-nowrap text-sm tracking-tight">
              {logo.name}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function LogoCarousel() {
  const [paused, setPaused] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // pause off-screen so the loop never runs invisibly in the background
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => setPaused(!entry.isIntersecting),
      { threshold: 0 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <section
      ref={ref}
      className="relative z-10 py-14 sm:py-20"
      style={{ animationPlayState: paused ? "paused" : undefined }}
      data-paused={paused || undefined}
    >
      <div
        className="flex flex-col gap-6 sm:gap-8"
      >
        <MarqueeRow logos={LOGOS} duration={46} />
        <MarqueeRow logos={LOGOS} reverse duration={58} />
      </div>
    </section>
  );
}
