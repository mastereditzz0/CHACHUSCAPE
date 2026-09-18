"use client";

import { useEffect, useRef } from "react";

/**
 * Custom cursor: the crystal glyph glides exactly under the pointer
 * (transform written in the same rAF the position arrives in — no lag),
 * scales over interactive elements, and hides on touch devices or when
 * the user prefers reduced motion. The native cursor is suppressed via
 * a `cursor-none` class on <html> so links can't resurrect the arrow.
 */
export default function CustomCursor() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const coarse = window.matchMedia("(pointer: coarse)").matches;
    const reducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    if (coarse || reducedMotion) return;

    // suppress the native cursor everywhere (html * covers UA overrides)
    document.documentElement.classList.add("cursor-none");
    document.documentElement.style.setProperty("cursor", "none");
    document.documentElement
      .querySelectorAll<HTMLElement>("a, button, input, textarea, select, [role='button'], label, summary")
      .forEach((n) => (n.style.cursor = "none"));
    const style = document.createElement("style");
    style.id = "cc-cursor-none";
    style.textContent = `html.cursor-none, html.cursor-none * { cursor: none !important; }`;
    document.head.appendChild(style);

    let x = -100;
    let y = -100;
    let scale = 1;
    let targetScale = 1;
    let visible = false;
    let raf = 0;

    const paint = () => {
      el.style.transform = `translate3d(${x - 16}px, ${y - 16}px, 0) scale(${scale.toFixed(3)})`;
      el.style.opacity = visible ? "1" : "0";
    };

    const loop = () => {
      scale += (targetScale - scale) * 0.2;
      paint();
      if (Math.abs(scale - targetScale) > 0.004) {
        raf = requestAnimationFrame(loop);
      }
    };

    const onMove = (e: PointerEvent) => {
      x = e.clientX;
      y = e.clientY;
      if (!visible) visible = true;
      paint();
      // re-arm the easing loop only while scaling
      if (Math.abs(scale - targetScale) > 0.004 && !raf) {
        raf = requestAnimationFrame(loop);
      }
    };

    const onOver = (e: Event) => {
      const t = e.target as HTMLElement | null;
      const interactive = t?.closest(
        "a, button, [role='button'], input, textarea, select, label, summary",
      );
      targetScale = interactive ? 1.25 : 1;
      if (Math.abs(scale - targetScale) > 0.004 && !raf) {
        raf = requestAnimationFrame(loop);
      }
    };

    const onLeave = () => {
      visible = false;
      paint();
    };

    const onEnter = () => {
      visible = true;
      paint();
    };

    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("pointerover", onOver, { passive: true });
    document.documentElement.addEventListener("pointerleave", onLeave);
    document.documentElement.addEventListener("pointerenter", onEnter);

    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerover", onOver);
      document.documentElement.removeEventListener("pointerleave", onLeave);
      document.documentElement.removeEventListener("pointerenter", onEnter);
      document.documentElement.classList.remove("cursor-none");
      document.documentElement.style.removeProperty("cursor");
      document
        .querySelectorAll<HTMLElement>("a, button, input, textarea, select, [role='button'], label, summary")
        .forEach((n) => (n.style.cursor = ""));
      document.getElementById("cc-cursor-none")?.remove();
      cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <div
      ref={ref}
      aria-hidden
      className="pointer-events-none fixed left-0 top-0 z-[100] hidden h-[32px] w-[32px] opacity-0 will-change-transform md:block"
      style={{
        backgroundImage: "url(/cursor.png)",
        backgroundSize: "contain",
        backgroundRepeat: "no-repeat",
        backgroundPosition: "center",
        mixBlendMode: "screen",
        filter: "drop-shadow(0 0 5px rgba(168,85,247,0.25))",
        transition: "opacity 250ms ease",
      }}
    />
  );
}
