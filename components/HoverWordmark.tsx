"use client";

import { useEffect, useRef } from "react";

/**
 * CHACHUSCAPE wordmark with a cursor-following texture reveal.
 *
 * Structure matters here: Blink ignores background-clip:text on an
 * element that also carries a mask, so the radial cursor mask lives on
 * the wrapper and the cloud texture is clipped to glyphs on the inner
 * span. The mask position eases with a lerp; the overlay fades in on
 * pointer move and out on leave. If rAF is throttled (hidden tab),
 * pointermove paints synchronously so the effect still tracks.
 */
export default function HoverWordmark() {
  const hostRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    const maskLayer = host.querySelector<HTMLElement>("[data-mask]");
    if (!maskLayer) return;

    const reducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    let tx = 50;
    let ty = 50;
    let cx = tx;
    let cy = ty;
    let strength = 0;
    let targetStrength = 0;
    let raf = 0;
    let running = false;
    let lastTick = 0;

    const paint = () => {
      maskLayer.style.setProperty("--mx", `${cx.toFixed(2)}%`);
      maskLayer.style.setProperty("--my", `${cy.toFixed(2)}%`);
      maskLayer.style.opacity = strength.toFixed(3);
    };

    const settled = () =>
      Math.abs(tx - cx) < 0.05 &&
      Math.abs(ty - cy) < 0.05 &&
      strength === targetStrength;

    const loop = () => {
      lastTick = performance.now();
      cx += (tx - cx) * 0.18;
      cy += (ty - cy) * 0.18;
      // asymmetric fade: quick in, slow cinematic fade-out
      const rate = targetStrength > strength ? 0.14 : 0.016;
      strength += (targetStrength - strength) * rate;
      if (Math.abs(tx - cx) < 0.05) cx = tx;
      if (Math.abs(ty - cy) < 0.05) cy = ty;
      if (Math.abs(targetStrength - strength) < 0.005) strength = targetStrength;
      paint();
      if (settled() && targetStrength === 0) {
        running = false;
        return;
      }
      raf = requestAnimationFrame(loop);
    };

    const wake = () => {
      if (!running) {
        running = true;
        raf = requestAnimationFrame(loop);
      }
    };

    const toLocal = (e: PointerEvent) => {
      const r = host.getBoundingClientRect();
      tx = ((e.clientX - r.left) / r.width) * 100;
      ty = ((e.clientY - r.top) / r.height) * 100;
      tx = Math.min(100, Math.max(0, tx));
      ty = Math.min(100, Math.max(0, ty));
    };

    const stalled = () => performance.now() - lastTick > 250;

    const onMove = (e: PointerEvent) => {
      if (reducedMotion) return;
      toLocal(e);
      targetStrength = 1;
      wake();
      // stall fallback: if rAF is throttled, jump straight to target
      setTimeout(() => {
        if (stalled()) {
          cx = tx;
          cy = ty;
          strength = targetStrength;
          paint();
        }
      }, 150);
    };

    const onLeave = () => {
      targetStrength = 0;
      wake();
      // stalled-environment fallback: hold the linger, then snap off
      setTimeout(() => {
        if (stalled() && strength !== 0) {
          strength = 0;
          paint();
        }
      }, 4000);
    };

    host.addEventListener("pointermove", onMove);
    host.addEventListener("pointerleave", onLeave);

    return () => {
      host.removeEventListener("pointermove", onMove);
      host.removeEventListener("pointerleave", onLeave);
      cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <span ref={hostRef} className="relative block">
      {/* base layer — existing white→lavender gradient, self-contained */}
      <span
        className="block whitespace-nowrap text-[12.3cqw]"
        style={{
          backgroundImage:
            "linear-gradient(180deg, #ffffff 30%, #e6e1fa 68%, #cfc3f2 100%)",
          WebkitBackgroundClip: "text",
          backgroundClip: "text",
          color: "transparent",
          filter:
            "drop-shadow(0 10px 28px rgba(0,0,0,0.55)) drop-shadow(0 0 42px rgba(236,72,153,0.22))",
        }}
      >
        CHACHUSCAPE
      </span>

      {/* cursor mask wrapper — owns the radial mask + opacity */}
      <span
        data-mask
        aria-hidden
        className="pointer-events-none absolute inset-0 select-none"
        style={
          {
            opacity: 0,
            "--reveal-r": "60vw",
            WebkitMaskImage:
              "radial-gradient(circle var(--reveal-r) at var(--mx, 50%) var(--my, 50%), black 0%, rgba(0,0,0,0.9) 55%, rgba(0,0,0,0.45) 80%, transparent 100%)",
            maskImage:
              "radial-gradient(circle var(--reveal-r) at var(--mx, 50%) var(--my, 50%), black 0%, rgba(0,0,0,0.9) 55%, rgba(0,0,0,0.45) 80%, transparent 100%)",
          } as React.CSSProperties
        }
      >
        {/* texture layer — clipped to the glyphs */}
        <span
          className="block whitespace-nowrap text-[12.3cqw]"
          style={{
            backgroundImage: "url(/art/wordmark-fill.jpg)",
            backgroundSize: "cover",
            backgroundPosition: "center",
            WebkitBackgroundClip: "text",
            backgroundClip: "text",
            color: "transparent",
          }}
        >
          CHACHUSCAPE
        </span>
      </span>
    </span>
  );
}
