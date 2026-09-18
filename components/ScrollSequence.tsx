"use client";

import { useEffect, useRef, type ReactNode } from "react";

const FRAME_COUNT = 60;

const frameSrc = (i: number) =>
  `/frames/frame_${String(i + 1).padStart(3, "0")}.jpg`;

/**
 * Cinematic scroll-linked frame sequence.
 *
 * Renders a tall scroll track (h-[400vh]) containing a full-screen sticky
 * stage. A canvas sits behind {children} and scrubs through frame_001..060
 * based on scroll progress (0% → frame 1, 100% → frame 60).
 *
 * - scroll-driven target frame, eased toward it with a persistent rAF lerp loop
 * - progressive preloading; the frame the user is heading toward is prioritized
 * - DPR-aware backing store, resize via ResizeObserver, no layout shift
 * - prefers-reduced-motion: frames jump directly with scroll, no easing loop
 */
export default function ScrollSequence({ children }: { children: ReactNode }) {
  const trackRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const track = trackRef.current;
    const canvas = canvasRef.current;
    if (!track || !canvas) return;
    const ctx = canvas.getContext("2d", { alpha: false });
    if (!ctx) return;

    const reducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    const decoded: (ImageBitmap | HTMLImageElement | null)[] = new Array(
      FRAME_COUNT,
    ).fill(null);
    const started = new Set<number>();
    let target = 0; // scroll-mapped frame index (float)
    let current = 0; // eased frame index (float)
    let rendered = -1; // last integer frame actually painted
    let lastLoopTick = 0; // timestamp of last rAF iteration
    let raf = 0;
    let disposed = false;

    const paint = (index: number) => {
      const img = decoded[index];
      if (!img) return;
      const { width, height } = canvas;
      if (width === 0 || height === 0) return;
      // cover-fit the 16:9 frame, cropping overflow — no distortion, no edges
      const scale = Math.max(width / img.width, height / img.height);
      const dw = img.width * scale;
      const dh = img.height * scale;
      ctx.fillStyle = "#000";
      ctx.fillRect(0, 0, width, height);
      ctx.drawImage(img, (width - dw) / 2, (height - dh) / 2, dw, dh);
    };

    const decodeFrame = async (i: number) => {
      if (started.has(i)) return; // already started — never fetch twice
      started.add(i);
      try {
        if ("createImageBitmap" in window) {
          const res = await fetch(frameSrc(i));
          if (!res.ok) throw new Error(String(res.status));
          decoded[i] = await createImageBitmap(await res.blob());
        } else {
          const img = new Image();
          img.decoding = "async";
          img.src = frameSrc(i);
          await img.decode();
          decoded[i] = img;
        }
      } catch {
        decoded[i] = null;
      }
      if (disposed) return;
      // if this frame is wanted right now, show it immediately
      if (Math.round(current) === i && rendered === -1) {
        rendered = i;
        paint(i);
      }
    };

    const ensureDecoded = (i: number) => {
      if (i >= 0 && i < FRAME_COUNT && !started.has(i)) void decodeFrame(i);
    };

    // Progressive preload: first, last, then a front-to-back sweep.
    const loadAll = async () => {
      await decodeFrame(0);
      void decodeFrame(FRAME_COUNT - 1);
      for (let i = 1; i < FRAME_COUNT - 1; i++) {
        if (disposed) return;
        await decodeFrame(i);
      }
      await decodeFrame(FRAME_COUNT - 1);
    };

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const { clientWidth: w, clientHeight: h } = canvas;
      if (w === 0 || h === 0) return;
      const pw = Math.round(w * dpr);
      const ph = Math.round(h * dpr);
      if (canvas.width !== pw || canvas.height !== ph) {
        canvas.width = pw;
        canvas.height = ph;
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = "high";
      }
      const frame = Math.round(current);
      if (decoded[frame]) {
        rendered = frame;
        paint(frame);
      }
    };

    // Scroll → target frame. Recomputed on every scroll event.
    const onScroll = () => {
      const rect = track.getBoundingClientRect();
      const total = rect.height - window.innerHeight;
      const progress =
        total > 0 ? Math.min(1, Math.max(0, -rect.top / total)) : 0;
      target = progress * (FRAME_COUNT - 1);

      const frame = Math.round(
        reducedMotion ? target : current,
      );
      ensureDecoded(reducedMotion ? frame : Math.round(target));

      if (reducedMotion) {
        // user-driven scrub only: no easing loop, no continuous animation
        current = target;
        if (decoded[frame] && frame !== rendered) {
          rendered = frame;
          paint(frame);
        }
      } else if (
        frame !== rendered &&
        decoded[frame] &&
        performance.now() - lastLoopTick > 250
      ) {
        // rAF loop stalled (backgrounded/throttled tab): still honor the
        // scroll by snapping straight to the target frame
        current = target;
        rendered = frame;
        paint(frame);
      }
    };

    const loop = () => {
      lastLoopTick = performance.now();
      // prioritize the frame the user is moving toward
      ensureDecoded(Math.round(target));

      // ease current toward target; snap when close enough
      const diff = target - current;
      if (Math.abs(diff) < 0.002) {
        current = target;
      } else {
        current += diff * 0.14;
      }

      const frame = Math.round(current);
      if (frame !== rendered && decoded[frame]) {
        rendered = frame;
        paint(frame);
      }
      raf = requestAnimationFrame(loop);
    };

    resize();
    void loadAll();
    onScroll();
    current = target;
    const first = decoded[Math.round(current)];
    if (first) {
      rendered = Math.round(current);
      paint(rendered);
    }

    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", resize);
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    if (!reducedMotion) {
      raf = requestAnimationFrame(loop);
    }

    return () => {
      disposed = true;
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", resize);
      ro.disconnect();
      for (const d of decoded) {
        if (d && "close" in d) d.close();
      }
    };
  }, []);

  return (
    <div ref={trackRef} className="relative h-[400vh]">
      <div className="sticky top-0 h-screen w-full overflow-hidden">
        <canvas
          ref={canvasRef}
          className="absolute inset-0 h-full w-full"
          aria-hidden
        />
        {/* cinematic darkening for the luxury tone + text legibility */}
        <div
          aria-hidden
          className="absolute inset-0 bg-gradient-to-b from-black/85 via-black/60 to-black/90"
        />
        {/* subtle warm cast toward the deep-gold luxury tone */}
        <div
          aria-hidden
          className="absolute inset-0 bg-amber-950/25 mix-blend-multiply"
        />
        {/* soft atmospheric shadow hugging the left edge for text contrast —
            strongest through the first ~25% of the screen, gone by ~48% */}
        <div
          aria-hidden
          className="absolute inset-y-0 left-0 w-[50vw] bg-[linear-gradient(90deg,rgba(0,0,0,0.85)_0%,rgba(0,0,0,0.62)_28%,rgba(0,0,0,0.34)_48%,rgba(0,0,0,0)_96%)]"
        />
        <div className="relative z-10 flex h-full flex-col">{children}</div>
      </div>
    </div>
  );
}
