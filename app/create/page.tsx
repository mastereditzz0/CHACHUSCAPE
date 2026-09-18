"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import PuterAuth from "@/components/PuterAuth";

type Ratio = "16:9" | "4:5" | "1:1" | "9:16";

const STYLES = [
  "Cinematic",
  "Dreamy",
  "Surreal",
  "Editorial",
  "Anime",
  "Photoreal",
] as const;
type Style = (typeof STYLES)[number];

const RATIOS: { id: Ratio; box: string }[] = [
  { id: "16:9", box: "w-7 h-4" },
  { id: "4:5", box: "w-4 h-5" },
  { id: "1:1", box: "w-5 h-5" },
  { id: "9:16", box: "w-3.5 h-6" },
];

const QUALITIES = ["1K", "2K", "4K", "8K"] as const;
type Quality = (typeof QUALITIES)[number];

/* ── Puter AI models ─────────────────────────────────────────────── */
type ModelDef = {
  id: string;
  label: string;
  provider: string;
  note: string;
};

const MODELS: ModelDef[] = [
  {
    id: "gpt-image-1-mini",
    label: "GPT Mini",
    provider: "openai-image-generation",
    note: "OpenAI · fast, crisp everyday renders",
  },
  {
    id: "gpt-image-1.5",
    label: "GPT 1.5",
    provider: "openai-image-generation",
    note: "OpenAI · richer light and texture",
  },
  {
    id: "gpt-image-2",
    label: "GPT 2",
    provider: "openai-image-generation",
    note: "OpenAI · maximum detail, highest fidelity",
  },
  {
    id: "gemini-2.5-flash-image",
    label: "Nano Banana",
    provider: "gemini",
    note: "Google · surreal, painterly dreams",
  },
  {
    id: "grok-imagine-image",
    label: "Grok",
    provider: "xai",
    note: "xAI · bold, cinematic compositions",
  },
  {
    id: "black-forest-labs/FLUX.1-schnell",
    label: "FLUX",
    provider: "together",
    note: "FLUX Schnell · open model, uses your steps & seed",
  },
];

type HistoryItem = {
  id: string;
  label: string;
  src: string;
  generated?: boolean;
};

const SAMPLES: HistoryItem[] = [
  { id: "v1", label: "Variation 01", src: "/art/escape.jpg" },
  { id: "v2", label: "Variation 02", src: "/art/frame.jpg" },
  { id: "v3", label: "Variation 03", src: "/art/var3.jpg" },
  { id: "v4", label: "Variation 04", src: "/art/var4.jpg" },
];

/* persistence — dreams survive reloads */
const LS_HISTORY = "chachuscape-history";
const KV_HISTORY = "chachuscape-history";
const FS_DIR = "chachuscape/dreams/";
const HISTORY_LIMIT = 12;

function dataUriToBlob(dataUri: string): Blob | null {
  try {
    const m = /^data:([^;,]+)(;[^,]+)?,(.*)$/.exec(dataUri);
    if (!m) return null;
    const mime = m[1] || "image/png";
    const isBase64 = (m[2] || "").includes("base64");
    const raw = isBase64 ? atob(m[3]) : decodeURIComponent(m[3]);
    const bytes = new Uint8Array(raw.length);
    for (let i = 0; i < raw.length; i++) bytes[i] = raw.charCodeAt(i);
    return new Blob([bytes], { type: mime });
  } catch {
    return null;
  }
}

const EXAMPLE_PROMPT =
  "An abandoned train floating through a violet sky, covered in flowers, with an astronaut carrying a glowing lantern…";

const RATIO_ASPECT: Record<Ratio, string> = {
  "16:9": "aspect-video",
  "4:5": "aspect-[4/5]",
  "1:1": "aspect-square",
  "9:16": "aspect-[9/16]",
};

const RATIO_WH: Record<Ratio, { w: number; h: number }> = {
  "16:9": { w: 16, h: 9 },
  "4:5": { w: 4, h: 5 },
  "1:1": { w: 1, h: 1 },
  "9:16": { w: 9, h: 16 },
};

const STATUS_WORDS = ["Generating…", "Dreaming…", "Imagining…", "Rendering…"];

function Chip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full border px-3.5 py-1.5 text-xs font-medium transition-all duration-300 ${
        active
          ? "border-white/60 bg-white/20 text-white shadow-[0_0_18px_-4px_rgba(216,180,254,0.65)]"
          : "border-white/15 bg-white/[0.04] text-white/70 hover:border-white/35 hover:text-white"
      }`}
    >
      {children}
    </button>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <span className="micro-label text-[10px] uppercase text-white/60">
      {children}
    </span>
  );
}

function CanvasAction({
  children,
  onClick,
  href,
  download,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  href?: string;
  download?: string;
}) {
  const cls =
    "rounded-full border border-white/10 bg-black/40 px-4 py-1.5 text-xs font-medium text-zinc-300 backdrop-blur-md transition-all duration-300 hover:border-white/30 hover:bg-black/60 hover:text-white";
  if (href) {
    return (
      <a href={href} download={download} className={cls}>
        {children}
      </a>
    );
  }
  return (
    <button type="button" onClick={onClick} className={cls}>
      {children}
    </button>
  );
}

/** Map the studio's controls onto per-provider txt2img options. */
function buildOptions(
  model: ModelDef,
  ratio: Ratio,
  quality: Quality,
  seed: string,
  guidance: number,
  steps: number,
  negative: string,
): Record<string, unknown> {
  const wh = RATIO_WH[ratio];
  switch (model.provider) {
    case "openai-image-generation":
      return {
        provider: model.provider,
        model: model.id,
        quality:
          quality === "1K" ? "low" : quality === "2K" ? "medium" : "high",
        ratio: wh,
      };
    case "gemini":
      return {
        provider: model.provider,
        model: model.id,
        ratio: wh,
        quality:
          quality === "1K" ? "1K" : quality === "2K" ? "2K" : "4K",
      };
    case "xai":
      return {
        provider: model.provider,
        model: model.id,
        quality: quality === "1K" ? "1k" : "2k",
      };
    case "together": {
      // Together takes explicit width/height + diffusion params
      const base =
        quality === "1K" ? 1024 : quality === "2K" ? 1440 : 2048;
      const long = Math.max(wh.w, wh.h);
      const short = Math.min(wh.w, wh.h);
      const shortSide = Math.round(((base * short) / long) / 8) * 8;
      const opts: Record<string, unknown> = {
        provider: model.provider,
        model: model.id,
        width: wh.w >= wh.h ? base : shortSide,
        height: wh.w >= wh.h ? shortSide : base,
        steps,
        negative_prompt: negative || undefined,
      };
      const seedNum = Number(seed);
      if (seed.trim() && Number.isFinite(seedNum)) opts.seed = seedNum;
      return opts;
    }
    default:
      return { provider: model.provider, model: model.id };
  }
}

export default function DreamStudioPage() {
  const [mounted, setMounted] = useState(false);
  const [prompt, setPrompt] = useState("");
  const [style, setStyle] = useState<Style>("Cinematic");
  const [ratio, setRatio] = useState<Ratio>("16:9");
  const [quality, setQuality] = useState<Quality>("2K");
  const [modelId, setModelId] = useState(MODELS[0].id);
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [seed, setSeed] = useState("8842137");
  const [guidance, setGuidance] = useState(7.5);
  const [steps, setSteps] = useState(42);
  const [negative, setNegative] = useState("");
  const [status, setStatus] = useState<"empty" | "loading" | "done">("empty");
  const [selected, setSelected] = useState(0);
  const [progress, setProgress] = useState(0);
  const [history, setHistory] = useState<HistoryItem[]>(SAMPLES);
  const [lastPrompt, setLastPrompt] = useState("");
  const [toast, setToast] = useState<string | null>(null);
  const [wordIdx, setWordIdx] = useState(0);
  const [wordVisible, setWordVisible] = useState(true);
  const dreamCount = useRef(0);
  const panelRef = useRef<HTMLDivElement>(null);
  const glowRef = useRef<HTMLDivElement>(null);

  /* restore dreams saved from earlier sessions.
     The Puter SDK loads after React mounts, so poll for it briefly —
     localStorage paints first, then the cloud copy (authoritative) replaces it. */
  useEffect(() => {
    let cancelled = false;
    const applied = { local: false, cloud: false };

    const apply = (saved: HistoryItem[], isCloud: boolean) => {
      if (isCloud) applied.cloud = true;
      else applied.local = true;
      if (cancelled || !saved.length) return;
      setHistory((prev) => {
        // dedupe against what's already in the strip (StrictMode re-runs,
        // local→cloud replacement) so keys stay unique
        const seen = new Set(prev.map((h) => h.id));
        const fresh = saved.filter((h) => !seen.has(h.id));
        if (!fresh.length) return prev;
        return [...fresh, ...prev].slice(0, HISTORY_LIMIT);
      });
      dreamCount.current = Math.max(
        dreamCount.current,
        saved.filter((h) => h.generated).length,
      );
    };

    // 1) instant local restore — skip ~/ entries (unrenderable without cloud)
    try {
      const raw = localStorage.getItem(LS_HISTORY);
      if (raw) {
        const local = (JSON.parse(raw) as HistoryItem[]).filter(
          (h) => !h.src.startsWith("~/"),
        );
        apply(local, false);
      }
    } catch {}

    // 2) cloud restore once the SDK is up
    const restoreCloud = async (puter: NonNullable<Window["puter"]>) => {
      try {
        if (!puter.auth?.isSignedIn?.()) return;
        let saved: HistoryItem[] = [];
        const raw = await puter.kv.get(KV_HISTORY);
        if (raw) {
          const cloud = JSON.parse(raw);
          if (Array.isArray(cloud)) saved = cloud;
        }
        // cloud file paths (~/) need a signed blob URL to render
        const withUrls = await Promise.all(
          saved.map(async (h) => {
            if (!h.src.startsWith("~/") || !puter.fs?.read) return h;
            try {
              const blob = await puter.fs.read(h.src);
              return { ...h, src: URL.createObjectURL(blob) };
            } catch {
              return null; // file gone — drop the ghost
            }
          }),
        );
        saved = withUrls.filter(Boolean) as HistoryItem[];
        if (saved.length || applied.cloud === false) apply(saved, true);
      } catch {}
    };

    let tries = 0;
    const poll = () => {
      if (cancelled) return;
      const puter = window.puter;
      if (puter?.kv && puter?.fs) {
        restoreCloud(puter);
      } else if (tries++ < 40) {
        // 4s at 250ms, then relax to 1s ticks — the SDK may arrive late on
        // slow connections, and a missed window means lost dreams
        window.setTimeout(poll, tries < 16 ? 250 : 1000);
      }
    };
    poll();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const activeModel = MODELS.find((m) => m.id === modelId) ?? MODELS[0];

  // page entrance
  useEffect(() => {
    const id = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(id);
  }, []);

  // toast auto-dismiss
  useEffect(() => {
    if (!toast) return;
    const id = window.setTimeout(() => setToast(null), 3800);
    return () => window.clearTimeout(id);
  }, [toast]);

  // status word cross-fades every 1.8s while generating
  useEffect(() => {
    if (status !== "loading") {
      setWordIdx(0);
      setWordVisible(true);
      return;
    }
    let swapT = 0;
    const id = window.setInterval(() => {
      setWordVisible(false);
      swapT = window.setTimeout(() => {
        setWordIdx((i) => (i + 1) % STATUS_WORDS.length);
        setWordVisible(true);
      }, 400);
    }, 1800);
    return () => {
      window.clearInterval(id);
      window.clearTimeout(swapT);
    };
  }, [status]);

  // cursor-follow glow over the control panel + subtle canvas parallax
  useEffect(() => {
    const panel = panelRef.current;
    const glow = glowRef.current;
    if (!panel || !glow) return;
    if (window.matchMedia("(pointer: coarse)").matches) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let tx = 50;
    let ty = 40;
    let cx = tx;
    let cy = ty;
    let raf = 0;
    const loop = () => {
      cx += (tx - cx) * 0.08;
      cy += (ty - cy) * 0.08;
      glow.style.background = `radial-gradient(38rem circle at ${cx}% ${cy}%, rgba(139,92,246,0.07), transparent 65%)`;
      raf = requestAnimationFrame(loop);
    };
    const onMove = (e: PointerEvent) => {
      const r = panel.getBoundingClientRect();
      tx = ((e.clientX - r.left) / r.width) * 100;
      ty = ((e.clientY - r.top) / r.height) * 100;
    };
    panel.addEventListener("pointermove", onMove);
    raf = requestAnimationFrame(loop);
    return () => {
      panel.removeEventListener("pointermove", onMove);
      cancelAnimationFrame(raf);
    };
  }, []);

  /* ── real generation via Puter AI ─────────────────────────────────── */
  const generate = async (overridePrompt?: string) => {
    if (status === "loading") return;
    const text = (overridePrompt ?? prompt).trim();
    if (!text) {
      setToast("Describe your dream first ✦");
      return;
    }
    const puter = window.puter;
    if (!puter?.ai?.txt2img) {
      setToast("Puter AI is still connecting — try again in a moment");
      return;
    }

    // txt2img runs under the user's own Puter account — make sure we're in
    if (puter.auth?.isSignedIn && !puter.auth.isSignedIn()) {
      try {
        await puter.auth.signIn();
      } catch {
        setToast("Sign in with Puter to start dreaming ✦");
        return;
      }
    }

    setStatus("loading");
    setProgress(0);
    setLastPrompt(text);
    dreamCount.current += 1;

    // eased progress caps at 92% until the real image resolves
    const started = performance.now();
    let settled = false;
    const tick = () => {
      if (settled) return;
      const t = Math.min(0.92, (performance.now() - started) / 4200);
      setProgress(1 - Math.pow(1 - t, 2.4));
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);

    try {
      const styled = `${text} — ${style} style, dreamlike cinematic atmosphere, ultra-detailed`;
      const result = await puter.ai.txt2img(
        styled,
        buildOptions(activeModel, ratio, quality, seed, guidance, steps, negative),
      );
      const src =
        typeof result === "string" ? result : (result?.src as string);
      if (!src) throw new Error("The model returned an empty image");

      const item: HistoryItem = {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        label: `Dream ${String(dreamCount.current).padStart(2, "0")}`,
        src,
        generated: true,
      };
      setHistory((prev) => {
        const next = [item, ...prev].slice(0, HISTORY_LIMIT);
        persistHistory(next);
        return next;
      });
      setSelected(0);
      setStatus("done");
      setProgress(1);
    } catch (err) {
      const msg =
        err instanceof Error && err.message
          ? err.message
          : "The dream dissolved — try another model or prompt";
      setToast(msg.slice(0, 120));
      setStatus((prev) => (prev === "loading" ? (history.length ? "done" : "empty") : prev));
    } finally {
      settled = true;
    }
  };

  /* save dreams: images → Puter filesystem (cloud) or as-is (local);
     history index → KV (cloud) + localStorage (fallback) */
  const persistHistory = async (items: HistoryItem[]) => {
    const generated = items.filter((h) => h.generated);
    if (!generated.length) return;
    const puter = window.puter;
    const cloud = !!(puter?.kv && puter.fs && puter.auth?.isSignedIn?.());
    let list = items;
    if (cloud && puter) {
      const uploaded: HistoryItem[] = [];
      for (const h of generated.slice(0, HISTORY_LIMIT)) {
        try {
          if (h.src.startsWith("data:")) {
            const blob = dataUriToBlob(h.src);
            const ext = h.src.slice(5, h.src.indexOf(";")) === "image/jpeg" ? "jpg" : "png";
            if (blob) {
              await puter.fs.write(`${FS_DIR}${h.id}.${ext}`, blob, {
                createMissingParents: true,
                overwrite: true,
              });
              uploaded.push({ ...h, src: `~/${FS_DIR}${h.id}.${ext}` });
              continue;
            }
          }
          uploaded.push(h);
        } catch {
          uploaded.push(h); // keep the data-URI form if upload fails
        }
      }
      list = [...uploaded, ...items.filter((h) => !h.generated)].slice(0, HISTORY_LIMIT);
    }
    try {
      localStorage.setItem(LS_HISTORY, JSON.stringify(list));
    } catch {
      /* storage full — drop generated images from the local copy */
      try {
        localStorage.setItem(
          LS_HISTORY,
          JSON.stringify(list.filter((h) => !h.generated || h.src.startsWith("/~"))),
        );
      } catch {}
    }
    if (cloud && puter) {
      try {
        await puter.kv.set(KV_HISTORY, JSON.stringify(list));
      } catch {}
    }
  };

  const entrance = (delay: string) =>
    ({
      opacity: mounted ? 1 : 0,
      transform: mounted ? "translateY(0px)" : "translateY(18px)",
      transition: `opacity 900ms cubic-bezier(0.22,1,0.36,1) ${delay}, transform 900ms cubic-bezier(0.22,1,0.36,1) ${delay}`,
    }) as React.CSSProperties;

  return (
    <main className="relative min-h-screen overflow-hidden">
      {/* dreamscape ambience — castle artwork under a deep cinematic scrim */}
      <div aria-hidden className="pointer-events-none fixed inset-0">
        <div className="absolute inset-0 bg-[#040308]" />
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: "url(/art/studio-bg.jpg)" }}
        />
        {/* light cinematic scrim — art glows through, panels stay readable */}
        <div className="absolute inset-0 bg-[#0a0618]/40" />
        <div className="absolute inset-0 bg-gradient-to-b from-[#0a0618]/55 via-transparent to-[#0a0618]/70" />
        <div className="absolute -top-40 left-1/4 h-[36rem] w-[36rem] rounded-full bg-violet-800/12 blur-[140px]" />
        <div className="absolute bottom-[-18%] right-[-8%] h-[32rem] w-[40rem] rounded-full bg-fuchsia-700/10 blur-[150px]" />
      </div>

      {/* ── Header ──────────────────────────────────────────────────── */}
      <header className="relative z-20 mx-auto flex w-full max-w-[92rem] items-center justify-between px-6 pt-6 sm:px-10">
        <Link href="/" className="flex items-center gap-2.5">
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
        </Link>

        <nav className="absolute left-1/2 hidden -translate-x-1/2 items-center gap-7 md:flex">
          <Link href="/" className="text-xs text-zinc-500 transition hover:text-white">
            Home
          </Link>
          <a href="#" className="text-xs text-zinc-500 transition hover:text-white">
            Gallery
          </a>
          <a href="#" className="text-xs text-zinc-500 transition hover:text-white">
            Pricing
          </a>
        </nav>

        <div className="flex items-center gap-4">
          <span className="micro-label hidden text-[10px] uppercase text-zinc-600 sm:block">
            128 credits
          </span>
          <PuterAuth />
        </div>
      </header>

      {/* ── Workspace ───────────────────────────────────────────────── */}
      <div
        className="relative z-10 mx-auto grid w-full max-w-[92rem] grid-cols-1 gap-8 px-6 pb-16 pt-10 sm:px-10 lg:grid-cols-[24rem_1fr] lg:gap-10 lg:pt-14"
        style={entrance("120ms")}
      >
        {/* ── Left: control panel ───────────────────────────────────── */}
        <section
          ref={panelRef}
          className="relative rounded-[1.75rem] border border-white/15 bg-white/[0.08] p-6 shadow-[0_24px_80px_-32px_rgba(10,4,24,0.65)] backdrop-blur-md sm:p-7"
        >
          {/* cursor-follow glow, clipped to the panel */}
          <div
            ref={glowRef}
            aria-hidden
            className="pointer-events-none absolute inset-0 rounded-[1.75rem]"
          />

          <div className="relative">
            <SectionLabel>Create your dream</SectionLabel>
            <h1 className="mt-3 text-[1.7rem] font-normal leading-tight tracking-tight text-white [font-family:var(--font-jakarta)]">
              Bring an idea{" "}
              <span className="bg-gradient-to-r from-white via-violet-100 to-fuchsia-200 bg-clip-text text-transparent">
                to life.
              </span>
            </h1>

            {/* prompt */}
            <div className="group relative mt-6">
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder={EXAMPLE_PROMPT}
                rows={5}
                className="w-full resize-none rounded-2xl border border-white/15 bg-black/25 p-4 text-sm leading-relaxed text-white placeholder:text-zinc-300/80 outline-none backdrop-blur-sm transition-all duration-300 focus:border-violet-300/50 focus:bg-black/40 focus:shadow-[0_0_0_1px_rgba(196,181,253,0.3),0_8px_40px_-12px_rgba(196,181,253,0.45)]"
              />
              <div className="mt-2 flex items-center justify-between">
                <span className="micro-label text-[9px] uppercase text-zinc-700">
                  Prompt
                </span>
                <button
                  type="button"
                  onClick={() => setPrompt(EXAMPLE_PROMPT.slice(0, -1))}
                  className="text-[11px] font-medium text-white/55 transition hover:text-white"
                >
                  Surprise me ✦
                </button>
              </div>
            </div>

            {/* model */}
            <div className="mt-6">
              <SectionLabel>Model</SectionLabel>
              <div className="mt-2.5 flex flex-wrap gap-2">
                {MODELS.map((m) => (
                  <Chip
                    key={m.id}
                    active={modelId === m.id}
                    onClick={() => setModelId(m.id)}
                  >
                    {m.label}
                  </Chip>
                ))}
              </div>
              <p className="mt-2 text-[10px] leading-relaxed text-white/40">
                {activeModel.note}
              </p>
            </div>

            {/* style */}
            <div className="mt-6">
              <SectionLabel>Style</SectionLabel>
              <div className="mt-2.5 flex flex-wrap gap-2">
                {STYLES.map((s) => (
                  <Chip key={s} active={style === s} onClick={() => setStyle(s)}>
                    {s}
                  </Chip>
                ))}
              </div>
            </div>

            {/* aspect ratio */}
            <div className="mt-6">
              <SectionLabel>Aspect ratio</SectionLabel>
              <div className="mt-2.5 flex flex-wrap gap-2">
                {RATIOS.map((r) => (
                  <Chip
                    key={r.id}
                    active={ratio === r.id}
                    onClick={() => setRatio(r.id)}
                  >
                    <span className="flex items-center gap-2">
                      <span
                        className={`inline-block rounded-[3px] border ${r.box} ${
                          ratio === r.id
                            ? "border-white/80 bg-white/30"
                            : "border-white/40"
                        }`}
                      />
                      {r.id}
                    </span>
                  </Chip>
                ))}
              </div>
            </div>

            {/* quality */}
            <div className="mt-6">
              <SectionLabel>Quality</SectionLabel>
              <div className="mt-2.5 flex flex-wrap gap-2">
                {QUALITIES.map((q) => (
                  <Chip
                    key={q}
                    active={quality === q}
                    onClick={() => setQuality(q)}
                  >
                    {q}
                  </Chip>
                ))}
              </div>
            </div>

            {/* advanced settings */}
            <div className="mt-7 border-t border-white/[0.06] pt-5">
              <button
                type="button"
                onClick={() => setAdvancedOpen((v) => !v)}
                className="group flex w-full items-center justify-between"
              >
                <SectionLabel>Advanced settings</SectionLabel>
                <span
                  className={`text-white/60 transition-transform duration-300 ${
                    advancedOpen ? "rotate-180" : ""
                  }`}
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                    <path
                      d="M6 9l6 6 6-6"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </span>
              </button>

              <div
                className="grid transition-all duration-500 ease-out"
                style={{
                  gridTemplateRows: advancedOpen ? "1fr" : "0fr",
                  opacity: advancedOpen ? 1 : 0,
                }}
              >
                <div className="overflow-hidden">
                  <div className="space-y-4 pt-4">
                    <label className="block">
                      <span className="micro-label text-[9px] uppercase text-white/60">
                        Seed
                      </span>
                      <input
                        value={seed}
                        onChange={(e) => setSeed(e.target.value)}
                        className="mt-1.5 w-full rounded-xl border border-white/15 bg-black/25 px-3 py-2 text-xs text-white outline-none backdrop-blur-sm transition focus:border-violet-300/50"
                      />
                    </label>
                    <label className="block">
                      <span className="micro-label flex items-center justify-between text-[9px] uppercase text-white/60">
                        Guidance <span className="text-white/85">{guidance.toFixed(1)}</span>
                      </span>
                      <input
                        type="range"
                        min={1}
                        max={20}
                        step={0.5}
                        value={guidance}
                        onChange={(e) => setGuidance(parseFloat(e.target.value))}
                        className="mt-2 w-full accent-violet-400"
                      />
                    </label>
                    <label className="block">
                      <span className="micro-label flex items-center justify-between text-[9px] uppercase text-white/60">
                        Steps <span className="text-white/85">{steps}</span>
                      </span>
                      <input
                        type="range"
                        min={10}
                        max={80}
                        step={1}
                        value={steps}
                        onChange={(e) => setSteps(parseInt(e.target.value))}
                        className="mt-2 w-full accent-violet-400"
                      />
                    </label>
                    <label className="block">
                      <span className="micro-label text-[9px] uppercase text-white/60">
                        Negative prompt
                      </span>
                      <input
                        value={negative}
                        onChange={(e) => setNegative(e.target.value)}
                        placeholder="Blurry, distorted, watermark…"
                        className="mt-1.5 w-full rounded-xl border border-white/15 bg-black/25 px-3 py-2 text-xs text-white placeholder:text-white/40 outline-none backdrop-blur-sm transition focus:border-violet-300/50"
                      />
                    </label>
                    <p className="text-[10px] leading-relaxed text-white/35">
                      Seed, steps & negative prompt are applied by models that
                      support them (FLUX). Others use the provider defaults.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* generate */}
            <button
              type="button"
              onClick={() => generate()}
              disabled={status === "loading"}
              className="group mt-8 flex h-12 w-full items-center justify-center gap-2.5 rounded-full bg-gradient-to-r from-orange-500 via-pink-500 to-violet-600 text-sm font-semibold tracking-wide text-white shadow-[0_12px_48px_-12px_rgba(217,70,239,0.55)] transition-all duration-300 hover:shadow-[0_16px_56px_-10px_rgba(217,70,239,0.7)] hover:brightness-110 disabled:opacity-70"
            >
              {status === "loading" ? (
                <>
                  <span className="h-3.5 w-3.5 animate-spin rounded-full border border-white/30 border-t-white" />
                  Dreaming… {Math.round(progress * 100)}%
                </>
              ) : (
                <>
                  Generate
                  <span className="transition-transform duration-300 group-hover:rotate-90">
                    ✦
                  </span>
                </>
              )}
            </button>
          </div>
        </section>

        {/* ── Right: artwork canvas ─────────────────────────────────── */}
        <section className="flex min-w-0 flex-col">
          <div
            className={`relative flex-1 transition-all duration-1000 ${
              mounted ? "opacity-100 blur-0" : "opacity-0 blur-md"
            }`}
          >
            <div
              className={`relative overflow-hidden rounded-[1.75rem] border border-white/[0.08] bg-black/50 shadow-[0_40px_120px_-40px_rgba(124,58,237,0.35),0_0_0_1px_rgba(255,255,255,0.02)_inset] ${RATIO_ASPECT[ratio]}`}
            >
              {/* empty state */}
              {status === "empty" && (
                <div className="absolute inset-0 flex flex-col items-center justify-center px-8 text-center">
                  <div
                    aria-hidden
                    className="absolute inset-0 opacity-70"
                    style={{
                      backgroundImage:
                        "radial-gradient(1px 1px at 18% 30%, rgba(255,255,255,0.5) 50%, transparent 51%), radial-gradient(1.5px 1.5px at 72% 22%, rgba(196,181,253,0.5) 50%, transparent 51%), radial-gradient(1px 1px at 84% 68%, rgba(255,255,255,0.4) 50%, transparent 51%), radial-gradient(1px 1px at 36% 74%, rgba(244,194,244,0.4) 50%, transparent 51%), radial-gradient(1.5px 1.5px at 55% 50%, rgba(196,181,253,0.35) 50%, transparent 51%), radial-gradient(1px 1px at 10% 60%, rgba(255,255,255,0.35) 50%, transparent 51%)",
                    }}
                  />
                  <div
                    aria-hidden
                    className="absolute left-1/2 top-1/2 h-72 w-72 -translate-x-1/2 -translate-y-1/2 rounded-full bg-violet-700/10 blur-[90px]"
                  />
                  <p className="relative text-2xl font-light tracking-tight text-zinc-300 sm:text-3xl">
                    Your next dream starts here.
                  </p>
                  <p className="relative mt-3 max-w-xs text-sm leading-relaxed text-zinc-600">
                    Describe anything. ChachuScape will render it.
                  </p>
                </div>
              )}

              {/* generating: looping orb video + serif status word */}
              {status === "loading" && (
                <div className="absolute inset-0">
                  <video
                    className="dream-video"
                    src="/art/dream-loop.mp4"
                    autoPlay
                    muted
                    loop
                    playsInline
                    preload="auto"
                  />
                  <div className="dream-vignette" aria-hidden />

                  <div className="absolute inset-0 flex flex-col items-center justify-center px-8 text-center">
                    <span
                      key={wordIdx}
                      aria-live="polite"
                      className="dream-word text-[2.5rem] leading-tight sm:text-[3rem]"
                      style={{ opacity: wordVisible ? 1 : 0 }}
                    >
                      {STATUS_WORDS[wordIdx]}
                    </span>
                    <span className="dream-meta dream-progress mt-4 text-[11px] text-white">
                      · {Math.round(progress * 100)}% ·
                    </span>
                  </div>
                </div>
              )}

              {/* generated / selected artwork */}
              {status === "done" && history[selected] && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  key={history[selected].id}
                  src={history[selected].src}
                  alt={history[selected].label}
                  className="dream-reveal absolute inset-0 h-full w-full object-cover"
                />
              )}

              {/* floating controls — only when artwork exists */}
              {status === "done" && history[selected] && (
                <div className="absolute inset-x-0 bottom-0 flex items-center justify-center gap-2 bg-gradient-to-t from-black/70 to-transparent p-5 pt-12">
                  <CanvasAction
                    href={history[selected].src}
                    download={`chachuscape-${history[selected].label
                      .toLowerCase()
                      .replace(/\s+/g, "-")}.png`}
                  >
                    Download
                  </CanvasAction>
                  <CanvasAction
                    onClick={() => {
                      if (lastPrompt) generate(lastPrompt);
                      else setToast("Describe the remix in the prompt ✦");
                    }}
                  >
                    Remix
                  </CanvasAction>
                  <CanvasAction
                    onClick={() => setToast("Upscaling arrives with the 8K tier ✦")}
                  >
                    Upscale
                  </CanvasAction>
                  <CanvasAction
                    onClick={() => setToast("In-canvas editing is coming soon ✦")}
                  >
                    Edit
                  </CanvasAction>
                </div>
              )}

              {/* subtle top-right status */}
              <div className="absolute right-4 top-4 flex items-center gap-2">
                <span className="micro-label rounded-full border border-white/10 bg-black/40 px-2.5 py-1 text-[9px] uppercase text-zinc-400 backdrop-blur-md">
                  {status === "loading"
                    ? `${quality} · ${ratio} · RENDERING`
                    : `${quality} · ${ratio} · ${activeModel.label}`}
                </span>
              </div>
            </div>
          </div>

          {/* ── History strip ───────────────────────────────────────── */}
          <div className="mt-6" style={entrance("260ms")}>
            <div className="mb-3 flex items-center justify-between">
              <SectionLabel>Recent dreams</SectionLabel>
              <button
                type="button"
                className="text-[11px] text-zinc-600 transition hover:text-zinc-300"
              >
                View all →
              </button>
            </div>
            <div className="-mx-1 flex gap-3 overflow-x-auto px-1 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {history.map((v, i) => (
                <button
                  key={v.id}
                  type="button"
                  onClick={() => {
                    setSelected(i);
                    if (status !== "loading") setStatus("done");
                  }}
                  className="group relative aspect-video w-32 shrink-0 overflow-hidden rounded-xl border transition-all duration-500 sm:w-36"
                  style={{
                    borderColor:
                      status === "done" && selected === i
                        ? "rgba(196,181,253,0.7)"
                        : "rgba(255,255,255,0.08)",
                    boxShadow:
                      status === "done" && selected === i
                        ? "0 0 20px -6px rgba(196,181,253,0.45)"
                        : "none",
                    opacity: mounted ? 1 : 0,
                    transform: mounted ? "translateY(0)" : "translateY(12px)",
                    transitionDelay: `${320 + Math.min(i, 6) * 70}ms`,
                  }}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={v.src}
                    alt={v.label}
                    className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <span className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                  <span className="micro-label absolute bottom-1.5 left-2 text-[8px] uppercase text-zinc-300 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                    {v.label}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </section>
      </div>

      {/* toast */}
      {toast && (
        <div className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2">
          <div className="rounded-full border border-violet-300/25 bg-[#0c0718]/90 px-5 py-2.5 text-xs text-violet-100 shadow-[0_12px_48px_-12px_rgba(139,92,246,0.55)] backdrop-blur-md">
            {toast}
          </div>
        </div>
      )}
    </main>
  );
}
