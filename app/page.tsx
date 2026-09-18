import ScrollSequence from "@/components/ScrollSequence";
import LogoCarousel from "@/components/LogoCarousel";
import BentoGrid from "@/components/BentoGrid";
import WorldsJourney from "@/components/WorldsJourney";
import HoverWordmark from "@/components/HoverWordmark";
import PuterAuth from "@/components/PuterAuth";
import Link from "next/link";

import Image from "next/image";

export default function Home() {
  return (
    <>
    <ScrollSequence>
      {/* ── Top bar ───────────────────────────────────────────────── */}
      <header className="relative z-10 mx-auto flex w-full max-w-[88rem] items-center justify-between px-6 pt-6 sm:px-10 sm:pt-8">
        <a href="#" className="flex items-center gap-2.5">
          <Image
            src="/logo.png"
            alt="ChachuScape logo"
            width={32}
            height={32}
            className="rounded-lg"
            priority
          />
          <span className="text-sm font-normal tracking-tight text-white">
            ChachuScape
          </span>
        </a>

        <nav className="absolute left-1/2 hidden -translate-x-1/2 items-center gap-7 md:flex">
          <a href="#" className="text-xs font-medium text-white">
            Home
          </a>
          <a
            href="#"
            className="text-xs font-medium text-zinc-500 transition hover:text-white"
          >
            Gallery
          </a>
          <a
            href="#"
            className="text-xs font-medium text-zinc-500 transition hover:text-white"
          >
            Pricing
          </a>
        </nav>

        <div className="flex items-center gap-4">
          <PuterAuth />
          <a
            href="#"
            className="hidden rounded-full bg-white px-4 py-1.5 text-xs font-medium text-black transition hover:bg-zinc-300 sm:block"
          >
            Download
          </a>
        </div>
      </header>

      {/* ── Hero ──────────────────────────────────────────────────── */}
      <section className="relative z-10 mx-auto flex w-full max-w-[88rem] flex-1 flex-col justify-center px-6 pb-24 pt-20 sm:px-10 md:pt-28">
        {/* badge */}
        <div className="flex items-center gap-3">
          <span className="h-1.5 w-1.5 rounded-full bg-gradient-to-r from-orange-500 to-violet-500" />
          <span className="micro-label text-[11px] uppercase text-zinc-500">
            AI Image Generator
          </span>
        </div>

        {/* description */}
        <p className="mt-8 max-w-sm text-[15px] leading-relaxed text-zinc-500">
          ChachuScape turns a single sentence into cinematic, gallery-ready
          artwork. Describe the scene — our diffusion engine handles the light,
          mood, and detail in seconds.
        </p>

        {/* CTA */}
        <div className="mt-10 flex flex-wrap items-center gap-6">
          <Link
            href="/create"
            className="group inline-flex h-11 items-center gap-2.5 rounded-full bg-gradient-to-r from-orange-500 to-violet-600 px-6 text-sm font-medium text-white transition hover:brightness-110"
          >
            Start Creating
            <svg
              width="15"
              height="15"
              viewBox="0 0 24 24"
              fill="none"
              aria-hidden
              className="transition-transform duration-300 group-hover:translate-x-0.5"
            >
              <path
                d="M5 12h14m0 0l-6-6m6 6l-6 6"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </Link>
          <a
            href="#"
            className="text-sm font-medium text-zinc-500 transition hover:text-white"
          >
            Explore gallery
          </a>
        </div>

        {/* oversized brand wordmark — the main visual, pinned to the bottom */}
        <h1 className="@container mt-auto w-full pt-16 text-center font-medium leading-[0.9] tracking-[-0.02em]">
          <HoverWordmark />
        </h1>
      </section>
    </ScrollSequence>

    {/* ── Trusted-by logo carousel ─────────────────────────────── */}
    <LogoCarousel />

    {/* ── Capabilities bento grid ──────────────────────────────── */}
    <BentoGrid />

    {/* ── Create Without Limits — scroll journey through worlds ── */}
    <WorldsJourney />
    </>
  );
}
