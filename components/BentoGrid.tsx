import Image from "next/image";

type Card = {
  className: string;
  children: React.ReactNode;
};

function CardShell({ className, children }: Card) {
  return (
    <div
      className={`group relative overflow-hidden rounded-3xl border border-white/10 bg-white/[0.03] transition-colors duration-300 hover:border-white/20 ${className}`}
    >
      {children}
    </div>
  );
}

function Glow({ className }: { className: string }) {
  return (
    <div
      aria-hidden
      className={`pointer-events-none absolute rounded-full blur-3xl transition-opacity duration-500 group-hover:opacity-100 ${className}`}
    />
  );
}

function CardTag({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-black/30 px-3 py-1 text-[10px] font-semibold uppercase micro-label text-zinc-300 backdrop-blur-md">
      {children}
    </span>
  );
}

function StatValue({ children, size = "big" }: { children: React.ReactNode; size?: "big" | "small" }) {
  return (
    <div
      className={
        size === "big"
          ? "bg-gradient-to-r from-white via-white to-zinc-400 bg-clip-text text-5xl font-medium tracking-tight text-transparent"
          : "bg-gradient-to-r from-white via-white to-zinc-400 bg-clip-text text-2xl font-medium tracking-tight text-transparent"
      }
    >
      {children}
    </div>
  );
}

export default function BentoGrid() {
  return (
    <section className="relative z-10 mx-auto w-full max-w-[88rem] px-6 pb-24 pt-8 sm:px-10 sm:pb-32">
      {/* section heading */}
      <div className="mb-10 flex items-end justify-between sm:mb-14">
        <div>
          <div className="flex items-center gap-3">
            <span className="h-1.5 w-1.5 rounded-full bg-gradient-to-r from-orange-500 to-violet-500" />
            <span className="micro-label text-[11px] uppercase text-zinc-500">
              Capabilities
            </span>
          </div>
          <h2 className="mt-4 text-2xl font-medium tracking-tight text-white [font-family:var(--font-jakarta)] sm:text-3xl">
            One canvas. Infinite dreams.
          </h2>
        </div>
        <a
          href="#"
          className="hidden text-sm text-zinc-500 transition hover:text-white sm:block"
        >
          View all →
        </a>
      </div>

      {/* 6-card asymmetric bento: wide feature (r1) + tall right (r1-2)
          + two mediums (r2) + two wides (r3) */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-6 lg:grid-rows-[repeat(3,minmax(210px,auto))]">
        {/* ── 1. Wide feature — artwork backdrop, row 1 ────────────── */}
        <CardShell className="sm:col-span-2 lg:col-span-4 min-h-[320px] lg:min-h-[360px]">
          <Image
            src="/art/frame.jpg"
            alt="Surreal golden frame blooming with lavender florals over the sea, generated with ChachuScape"
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 100vw, 66vw"
            className="object-cover transition-transform duration-700 group-hover:scale-[1.03]"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/25 to-black/10" />
          <Glow className="-left-24 -top-24 h-72 w-72 bg-violet-600/25 opacity-60" />
          <div className="absolute inset-x-0 bottom-0 p-7 sm:p-8">
            <CardTag>Dream Engine</CardTag>
            <h3 className="mt-4 max-w-md text-2xl font-medium tracking-tight text-white [font-family:var(--font-jakarta)] sm:text-[1.7rem] sm:leading-snug">
              Cinematic worlds from a single sentence
            </h3>
          </div>
        </CardShell>

        {/* ── 2. Tall card — artwork backdrop, rows 1-2 right ──────── */}
        <CardShell className="sm:col-span-2 lg:col-span-2 lg:row-span-2 min-h-[420px] max-sm:aspect-[16/10] max-sm:min-h-0">
          <Image
            src="/art/escape.jpg"
            alt="Astronaut standing on a floating blossom-wrapped train car, generated with ChachuScape"
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 100vw, 33vw"
            className="object-cover transition-transform duration-700 group-hover:scale-[1.03]"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/25 to-black/10" />
          <Glow className="-bottom-24 -right-24 h-72 w-72 bg-fuchsia-600/25 opacity-60" />
          <div className="absolute inset-x-0 bottom-0 p-7">
            <CardTag>Style Remix</CardTag>
            <h3 className="mt-4 text-xl font-medium tracking-tight text-white [font-family:var(--font-jakarta)] sm:text-2xl">
              Any style, one tap
            </h3>
            <p className="mt-2 max-w-[16rem] text-sm leading-relaxed text-zinc-400">
              Blend eras, palettes, and lenses without losing your subject.
            </p>
          </div>
        </CardShell>

        {/* ── 3. Medium glass stat — row 2 ─────────────────────────── */}
        <CardShell className="sm:col-span-1 lg:col-span-2 min-h-[210px] p-7">
          <Glow className="-left-20 -top-20 h-56 w-56 bg-violet-600/20 opacity-50" />
          <div className="relative flex h-full flex-col justify-between">
            <span className="text-[10px] font-semibold uppercase micro-label text-zinc-500">
              Render Speed
            </span>
            <div>
              <StatValue>4.2s</StatValue>
              <p className="mt-2 text-sm leading-relaxed text-zinc-500">
                Prompt to finished 4K render.
              </p>
            </div>
          </div>
        </CardShell>

        {/* ── 4. Medium glass stat — row 2 ─────────────────────────── */}
        <CardShell className="sm:col-span-1 lg:col-span-2 min-h-[210px] p-7">
          <Glow className="-right-20 -top-20 h-56 w-56 bg-pink-600/20 opacity-50" />
          <div className="relative flex h-full flex-col justify-between">
            <span className="text-[10px] font-semibold uppercase micro-label text-zinc-500">
              Community
            </span>
            <div>
              <StatValue>120k+</StatValue>
              <p className="mt-2 text-sm leading-relaxed text-zinc-500">
                Dreamers shipping art every week.
              </p>
            </div>
          </div>
        </CardShell>

        {/* ── 5. Wide glass card — row 3 ───────────────────────────── */}
        <CardShell className="sm:col-span-2 lg:col-span-3 min-h-[210px] p-7">
          <Glow className="-bottom-20 left-1/4 h-56 w-56 bg-orange-600/15 opacity-50" />
          <div className="relative flex h-full flex-col justify-between">
            <span className="text-[10px] font-semibold uppercase micro-label text-zinc-500">
              Upscale
            </span>
            <div>
              <StatValue size="small">Up to 8K, print-ready</StatValue>
              <p className="mt-2 max-w-xs text-sm leading-relaxed text-zinc-500">
                One click turns any dream into gallery-grade detail.
              </p>
            </div>
          </div>
        </CardShell>

        {/* ── 6. Wide glass card — row 3 ───────────────────────────── */}
        <CardShell className="sm:col-span-2 lg:col-span-3 min-h-[210px] p-7">
          <Glow className="-bottom-20 right-1/4 h-56 w-56 bg-violet-500/15 opacity-50" />
          <div className="relative flex h-full flex-col justify-between">
            <span className="text-[10px] font-semibold uppercase micro-label text-zinc-500">
              Private Gallery
            </span>
            <div>
              <StatValue size="small">Synced, everywhere</StatValue>
              <p className="mt-2 max-w-xs text-sm leading-relaxed text-zinc-500">
                Every render is saved, versioned, and ready to remix.
              </p>
            </div>
          </div>
        </CardShell>
      </div>
    </section>
  );
}
