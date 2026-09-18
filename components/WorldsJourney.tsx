"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState, type CSSProperties } from "react";

/**
 * CREATE WITHOUT LIMITS — cinematic scroll journey.
 *
 * A 480vh scroll track with a sticky full-screen stage. Four world artworks
 * crossfade while each layer slowly settles (scale 1.09 → 1.0) and drifts —
 * the camera feels like it is travelling deeper into one continuous world:
 *
 *   01 IMAGINE — flower train above the mirror ocean   (the established art)
 *   02 REMIX   — the same train, sunken / crystal blue
 *   03 EXPAND  — the florals under moonlight, violet
 *   04 CREATE  — sunset metropolis above the clouds
 *
 * Scroll progress (eased through a rAF lerp) drives layer opacity, scale,
 * parallax, the atmosphere (rays / haze / petals / tint), the progress rail
 * and the intro/ending copy. No layout shift; reduced-motion safe.
 */

type World = {
  num: string;
  word: string;
  src: string;
  line: string;
  alt: string;
};

const WORLDS: World[] = [
  {
    num: "01",
    word: "IMAGINE",
    src: "/art/world-dream.webp",
    line: "An astronaut reads above the clouds — where every journey begins.",
    alt: "An astronaut sitting on a flower-covered hill above the clouds at sunset, reading a book beneath a crescent moon",
  },
  {
    num: "02",
    word: "REMIX",
    src: "/art/world-bloom.webp",
    line: "The same dream, re-imagined — machines bloom and screens become sky.",
    alt: "An old computer blooming with daisies in a meadow, its screen filled with blue sky and clouds",
  },
  {
    num: "03",
    word: "EXPAND",
    src: "/art/world-soar.webp",
    line: "Dreams grow wings — a whale of roses sails the pink horizon.",
    alt: "A humpback whale covered in roses soaring through pink sunset clouds",
  },
  {
    num: "04",
    word: "CREATE",
    src: "/art/world-create-3.webp",
    line: "And above it all, a world of your own — pink chrome under endless sky.",
    alt: "A pink vintage truck on a flower hill beneath giant FASTLANE lettering and dreamy clouds",
  },
];

/* layer visibility windows, as fractions of scroll progress */
const WINDOWS = [
  { a: 0.0, b: 0.0, c: 0.24, d: 0.4 },
  { a: 0.24, b: 0.4, c: 0.5, d: 0.66 },
  { a: 0.5, b: 0.66, c: 0.78, d: 0.92 },
  { a: 0.78, b: 0.92, c: 2, d: 3 },
];

/* rail click → scroll targets per world */
const WORLD_TARGETS = [0, 0.33, 0.66, 0.94];

const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
const smooth = (t: number) => t * t * (3 - 2 * t);

/* floating petals — wrapper falls, inner span sways */
const PETALS = [
  { left: 7, size: 8, fall: 26, delay: 4, sway: 5.2 },
  { left: 15, size: 6, fall: 33, delay: 19, sway: 6.4 },
  { left: 24, size: 9, fall: 22, delay: 11, sway: 4.6 },
  { left: 33, size: 5, fall: 30, delay: 25, sway: 6.0 },
  { left: 57, size: 6, fall: 27, delay: 8, sway: 5.4 },
  { left: 66, size: 9, fall: 24, delay: 21, sway: 4.2 },
  { left: 75, size: 5, fall: 34, delay: 2, sway: 6.8 },
  { left: 84, size: 8, fall: 21, delay: 15, sway: 5.0 },
  { left: 92, size: 6, fall: 29, delay: 27, sway: 6.2 },
];

export default function WorldsJourney() {
  const trackRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const glowRef = useRef<HTMLDivElement>(null);
  const layerRefs = useRef<(HTMLDivElement | null)[]>([]);
  const [active, setActive] = useState(0);
  const activeRef = useRef(0);

  useEffect(() => {
    const track = trackRef.current;
    const stage = stageRef.current;
    if (!track || !stage) return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const finePointer = window.matchMedia("(pointer: fine)").matches;

    let targetP = 0;
    let curP = 0;
    let raf = 0;
    let lastTick = 0;

    /* cursor-follow glow state (viewport px within the stage) */
    let gx = -9999, gy = -9999, gxT = -9999, gyT = -9999;
    let glowVisible = false;

    const readScroll = () => {
      const rect = track.getBoundingClientRect();
      const total = rect.height - window.innerHeight;
      targetP = total > 0 ? clamp01(-rect.top / total) : 0;
    };

    const apply = (p: number) => {
      const s = track.style;

      /* atmosphere + copy drivers */
      s.setProperty("--veil-top", Math.max(0, 1 - p * 3.4).toFixed(3));
      s.setProperty("--veil-floor", Math.min(1, Math.pow(p, 3.2)).toFixed(3));
      s.setProperty("--intro-o", Math.max(0, 1 - p * 7).toFixed(3));
      s.setProperty("--intro-y", `${(-p * 70).toFixed(1)}px`);
      /* world captions only after the intro copy has cleared the stage */
      s.setProperty("--cap-o", clamp01((p - 0.15) / 0.08).toFixed(3));
      const eo = clamp01((p - 0.86) / 0.09);
      s.setProperty("--end-o", eo.toFixed(3));
      s.setProperty("--end-y", `${(26 * (1 - eo)).toFixed(1)}px`);
      s.setProperty("--haze-o", (0.4 + 0.15 * Math.sin(p * Math.PI * 3)).toFixed(3));
      s.setProperty("--rays-o", (0.55 + 0.4 * Math.sin(p * Math.PI * 2 + 1)).toFixed(3));
      s.setProperty("--worldhue", `${(p * 16 - 6).toFixed(1)}deg`);

      /* world layers: crossfade + settle scale + vertical parallax */
      layerRefs.current.forEach((layer, i) => {
        if (!layer) return;
        const w = WINDOWS[i];
        const fi =
          w.b > w.a ? smooth(clamp01((p - w.a) / (w.b - w.a))) : p >= w.a ? 1 : 0;
        const fo =
          w.c < w.d ? 1 - smooth(clamp01((p - w.c) / (w.d - w.c))) : 1;
        const o = fi * fo;
        const end = w.c < w.d ? w.c : 1;
        const lt = smooth(clamp01((p - w.a) / Math.max(0.0001, end - w.a)));
        const scale = 1.09 - 0.09 * lt;
        const ty = 2.2 - 4.4 * lt;
        layer.style.opacity = o.toFixed(3);
        layer.style.visibility = o < 0.004 ? "hidden" : "visible";
        layer.style.transform = `scale(${scale.toFixed(4)}) translate3d(0, ${ty.toFixed(2)}%, 0)`;
      });

      const idx = p < 0.32 ? 0 : p < 0.58 ? 1 : p < 0.85 ? 2 : 3;
      if (idx !== activeRef.current) {
        activeRef.current = idx;
        setActive(idx);
      }

      /* subtle cursor-follow glow */
      if (glowRef.current && finePointer && !reduced) {
        const g = glowRef.current;
        g.style.transform = `translate3d(${(gx - 300).toFixed(1)}px, ${(gy - 300).toFixed(1)}px, 0)`;
        g.style.opacity = glowVisible ? "1" : "0";
      }
    };

    const onScroll = () => {
      readScroll();
      if (reduced) {
        curP = targetP;
        apply(curP);
        return;
      }
      /* stall fallback: if rAF is throttled (hidden tab / suspended webview),
         paint synchronously so scrolling always drives the worlds */
      const now = performance.now();
      if (now - lastTick > 250) {
        curP = targetP;
        gx = gxT;
        gy = gyT;
        apply(curP);
      }
    };

    const onPointer = (e: PointerEvent) => {
      if (!finePointer || reduced) return;
      const rect = stage.getBoundingClientRect();
      gxT = e.clientX - rect.left;
      gyT = e.clientY - rect.top;
      glowVisible = gyT > -80 && gyT < rect.height + 80;
    };

    const loop = () => {
      lastTick = performance.now();
      const dp = targetP - curP;
      curP = Math.abs(dp) < 0.0004 ? targetP : curP + dp * 0.11;
      gx += (gxT - gx) * 0.12;
      gy += (gyT - gy) * 0.12;
      apply(curP);
      raf = requestAnimationFrame(loop);
    };

    readScroll();
    apply(reduced ? targetP : 0);
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    window.addEventListener("pointermove", onPointer, { passive: true });
    if (!reduced) raf = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      window.removeEventListener("pointermove", onPointer);
    };
  }, []);

  const goTo = (i: number) => {
    const track = trackRef.current;
    if (!track) return;
    const top =
      track.getBoundingClientRect().top +
      window.scrollY +
      WORLD_TARGETS[i] * (track.offsetHeight - window.innerHeight);
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    window.scrollTo({ top, behavior: reduced ? "auto" : "smooth" });
  };

  const w = WORLDS[active];

  return (
    <section aria-label="Create without limits" className="relative z-10">
      <div ref={trackRef} className="relative h-[480vh]">
        {/* ── sticky cinematic stage ─────────────────────────────── */}
        <div ref={stageRef} className="sticky top-0 h-screen w-full overflow-hidden bg-black">
          {/* world layers — crossfade + settle + parallax */}
          {WORLDS.map((world, i) => (
            <div
              key={world.num}
              ref={(el) => {
                layerRefs.current[i] = el;
              }}
              className="absolute inset-0 will-change-transform"
              style={{ opacity: i === 0 ? 1 : 0, transform: "scale(1.09)" }}
            >
              <Image
                src={world.src}
                alt={world.alt}
                fill
                sizes="100vw"
                priority={i === 0}
                quality={75}
                className="object-cover"
              />
            </div>
          ))}

          {/* seamless entry from the black section above */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-x-0 top-0 h-[62%] bg-[linear-gradient(180deg,rgba(0,0,0,0.92)_0%,rgba(0,0,0,0.55)_22%,rgba(0,0,0,0.22)_46%,transparent_72%)]"
            style={{ opacity: "var(--veil-top, 1)" }}
          />
          {/* cinematic focus dim — stage darkens while the intro copy speaks,
              then the artwork is revealed as it fades (no hard edges) */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(6,4,18,0.62)_0%,rgba(6,4,18,0.45)_55%,rgba(6,4,18,0.3)_100%)]"
            style={{ opacity: "var(--intro-o, 1)" }}
          />
          {/* cinematic exit toward the ending */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-x-0 bottom-0 h-[62%] bg-gradient-to-t from-black via-black/70 to-transparent"
            style={{ opacity: "var(--veil-floor, 0)" }}
          />
          {/* world depth tint — violet → water → amber, hue drifts with scroll */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 mix-blend-soft-light bg-[linear-gradient(180deg,#2b1e5e_0%,#3b2a7a_38%,#7a4a8f_62%,#c98a5a_100%)]"
            style={{
              opacity: 0.16,
              filter: "hue-rotate(var(--worldhue, 0deg))",
            }}
          />
          {/* breathing atmospheric haze, slowly drifting */}
          <div
            aria-hidden
            className="worlds-haze pointer-events-none absolute -inset-x-[6%] inset-y-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.10)_0%,rgba(214,196,255,0.05)_45%,rgba(255,255,255,0.08)_100%)] blur-2xl"
            style={{ opacity: "var(--haze-o, 0.4)" }}
          />
          {/* volumetric light rays, top-left */}
          <div
            aria-hidden
            className="worlds-ray pointer-events-none absolute -top-[18%] left-[6%] h-[85%] w-[58%]"
            style={{ opacity: "var(--rays-o, 0.55)" }}
          >
            <div className="absolute left-[2%] top-0 h-full w-[64px] bg-gradient-to-b from-white/20 via-white/5 to-transparent blur-xl md:w-[110px]" />
            <div className="absolute left-[30%] top-[4%] h-[92%] w-[44px] bg-gradient-to-b from-white/14 via-white/4 to-transparent blur-xl md:w-[80px]" />
            <div className="absolute left-[58%] top-0 h-full w-[80px] bg-gradient-to-b from-white/10 via-white/3 to-transparent blur-xl md:w-[130px]" />
          </div>
          {/* floating petals */}
          <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
            {PETALS.map((p, i) => (
              <div
                key={i}
                className={`worlds-petal absolute top-0 ${i % 2 === 1 ? "hidden sm:block" : ""}`}
                style={
                  {
                    left: `${p.left}%`,
                    width: p.size,
                    height: p.size * 1.5,
                    animationDuration: `${p.fall}s`,
                    animationDelay: `-${p.delay}s`,
                  } as CSSProperties
                }
              >
                <span
                  className="block h-full w-full rounded-full bg-gradient-to-br from-pink-200/70 via-violet-300/55 to-indigo-300/35 blur-[1px]"
                  style={{ animationDuration: `${p.sway}s` }}
                />
              </div>
            ))}
          </div>
          {/* soft cursor-follow glow */}
          <div
            ref={glowRef}
            aria-hidden
            className="pointer-events-none absolute left-0 top-0 h-[600px] w-[600px] rounded-full bg-[radial-gradient(circle,rgba(139,92,246,0.13)_0%,rgba(236,72,153,0.05)_45%,transparent_70%)] blur-2xl transition-opacity duration-700"
            style={{ opacity: 0, transform: "translate3d(-9999px,-9999px,0)" }}
          />
          {/* cinema vignette */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 shadow-[inset_0_0_180px_rgba(5,4,16,0.5)]"
          />
          {/* constant gentle floor for the caption zone */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-x-0 bottom-0 h-[46%] bg-gradient-to-t from-black/55 via-black/20 to-transparent"
          />

          {/* ── section opening ──────────────────────────────────── */}
          <div
            className="pointer-events-none absolute inset-0 z-10 flex flex-col items-center justify-center px-6 text-center"
            style={{
              opacity: "var(--intro-o, 1)",
              transform: "translate3d(0, var(--intro-y, 0px), 0)",
            }}
          >
            <div className="relative flex items-center gap-3">
              <span className="h-1.5 w-1.5 rounded-full bg-gradient-to-r from-orange-500 to-violet-500" />
              <span className="micro-label text-[11px] uppercase text-white/85 [text-shadow:0_1px_10px_rgba(10,8,30,0.6)]">
                Create Without Limits
              </span>
            </div>
            <h2 className="relative mt-5 max-w-3xl bg-gradient-to-r from-white via-[#f0eafd] to-[#d9cdf7] bg-clip-text text-4xl font-medium leading-[1.05] tracking-[-0.02em] text-transparent [text-shadow:0_2px_28px_rgba(10,8,30,0.35)] sm:text-5xl md:text-6xl">
              One idea can become an entire universe.
            </h2>
            <p className="relative mt-5 max-w-md text-[15px] leading-relaxed text-white/90 [text-shadow:0_1px_14px_rgba(5,4,16,0.9),0_0_4px_rgba(5,4,16,0.7)] [font-family:var(--font-jakarta)]">
              Start with a thought. Shape the atmosphere, change the style, and
              explore completely different worlds.
            </p>
          </div>

          {/* ── world captions — crossfade per active world ───────── */}
          <div
            className="pointer-events-none absolute inset-x-6 bottom-16 z-10 sm:inset-x-10 sm:bottom-20"
            style={{
              opacity: "calc(var(--cap-o, 0) * (1 - var(--end-o, 0)))",
              transform: "translate3d(0, calc((1 - var(--cap-o, 0)) * 16px), 0)",
            }}
          >
            <div key={w.num} className="worlds-caption-in max-w-md max-sm:mx-auto max-sm:text-center">
              <p className="micro-label text-[11px] uppercase text-[#cfc0f5] [text-shadow:0_1px_12px_rgba(0,0,0,0.8)]">
                {w.num} — {w.word}
              </p>
              <p className="mt-3 text-lg font-normal leading-snug text-white [text-shadow:0_2px_18px_rgba(0,0,0,0.75)] [font-family:var(--font-jakarta)] sm:text-xl">
                {w.line}
              </p>
            </div>
          </div>

          {/* ── progress rail ────────────────────────────────────── */}
          <nav
            aria-label="Worlds progress"
            className="absolute right-5 top-1/2 z-20 hidden -translate-y-1/2 flex-col gap-7 text-white [text-shadow:0_1px_8px_rgba(8,6,24,0.9)] md:right-9 lg:flex"
          >
            {WORLDS.map((world, i) => (
              <button
                key={world.num}
                onClick={() => goTo(i)}
                aria-current={active === i}
                className={`group flex flex-col items-end gap-1 transition-all duration-500 ${
                  active === i
                    ? "scale-110 text-white [filter:drop-shadow(0_0_10px_rgba(196,181,253,0.65))]"
                    : "text-white/55 hover:text-white/90"
                }`}
              >
                <span className="micro-label text-[11px] leading-none">
                  {world.num}
                </span>
                <span
                  className={`micro-label text-[9px] uppercase leading-none transition-all ${
                    active === i ? "opacity-100" : "opacity-70"
                  }`}
                >
                  {world.word}
                </span>
                <span
                  className={`mt-0.5 h-px bg-gradient-to-r from-transparent to-[#c4b5fd] transition-all duration-500 ${
                    active === i ? "w-8 opacity-90" : "w-4 opacity-40"
                  }`}
                />
              </button>
            ))}
          </nav>

          {/* ── compact mobile progress dots ─────────────────────── */}
          <nav
            aria-label="Worlds progress"
            className="absolute inset-x-0 top-5 z-20 flex items-center justify-center gap-2.5 lg:hidden"
          >
            {WORLDS.map((world, i) => (
              <button
                key={world.num}
                onClick={() => goTo(i)}
                aria-label={`World ${world.num} — ${world.word}`}
                aria-current={active === i}
                className={`h-1.5 rounded-full transition-all duration-500 ${
                  active === i
                    ? "w-7 bg-gradient-to-r from-[#e9defc] to-[#c4b5fd] shadow-[0_0_10px_rgba(196,181,253,0.7)]"
                    : "w-1.5 bg-white/35 [box-shadow:0_1px_6px_rgba(8,6,24,0.8)] hover:bg-white/60"
                }`}
              />
            ))}
          </nav>

          {/* ── cinematic ending ─────────────────────────────────── */}
          <div
            className={`absolute inset-0 z-10 flex flex-col items-center justify-center px-6 text-center ${
              active === 3 ? "" : "pointer-events-none"
            }`}
            style={{
              opacity: "var(--end-o, 0)",
              transform: "translate3d(0, var(--end-y, 26px), 0)",
            }}
          >
            <h2 className="max-w-3xl bg-gradient-to-r from-white via-[#efe8fc] to-[#d5c8f6] bg-clip-text text-4xl font-medium leading-[1.05] tracking-[-0.02em] text-transparent sm:text-5xl md:text-6xl">
              Your imagination has no canvas.
            </h2>
            <p className="mt-5 max-w-sm text-[15px] leading-relaxed text-zinc-300/90 [font-family:var(--font-jakarta)]">
              Turn a single thought into something you can see.
            </p>
            <Link
              href="/create"
              className="group mt-9 inline-flex h-11 items-center gap-2.5 rounded-full bg-gradient-to-r from-orange-500 to-violet-600 px-7 text-sm font-medium text-white transition hover:brightness-110"
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
          </div>
        </div>
      </div>
    </section>
  );
}
