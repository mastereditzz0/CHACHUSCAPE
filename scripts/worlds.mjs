import sharp from "sharp";

const W = 1920, H = 1080;

const grad = (stops) =>
  Buffer.from(
    `<svg width="${W}" height="${H}"><defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1">${stops
      .map(([o, c]) => `<stop offset="${o}" stop-color="${c}"/>`)
      .join("")}</linearGradient></defs><rect width="${W}" height="${H}" fill="url(#g)"/></svg>`,
  );

const radial = (cx, cy, r, stops) =>
  Buffer.from(
    `<svg width="${W}" height="${H}"><defs><radialGradient id="r" cx="${cx}" cy="${cy}" r="${r}">${stops
      .map(([o, c]) => `<stop offset="${o}" stop-color="${c}"/>`)
      .join("")}</radialGradient></defs><rect width="${W}" height="${H}" fill="url(#r)"/></svg>`,
  );

// WORLD 01 — IMAGINE: the flower train above the mirror ocean, pastel + airy
// (crop from the original below the baked-in lettering — clean of text)
await sharp("public/art/escape.jpg")
  .extract({ left: 60, top: 300, width: 1140, height: 375 })
  .resize(W, H, { fit: "cover", position: "centre" })
  .modulate({ brightness: 1.04, saturation: 1.06 })
  .composite([
    {
      input: grad([
        [0, "rgba(255,228,242,0.12)"],
        [0.55, "rgba(214,196,255,0.05)"],
        [1, "rgba(255,206,226,0.12)"],
      ]),
      blend: "screen",
    },
  ])
  .webp({ quality: 80 })
  .toFile("public/art/world-imagine-2.webp");

// WORLD 02 — REMIX: dive INTO the same scene — underwater crystal city
// (crop of the train body itself from the original — no astronaut/lettering;
// the train becomes a sunken crystal vessel)
await sharp("public/art/escape.jpg")
  .extract({ left: 380, top: 282, width: 800, height: 378 })
  .resize(1920, 1080)
  .modulate({ brightness: 0.74, saturation: 1.3, hue: -30 })
  .composite([
    {
      input: grad([
        [0, "rgba(13,42,122,0.52)"],
        [0.5, "rgba(42,32,132,0.42)"],
        [1, "rgba(8,16,72,0.62)"],
      ]),
      blend: "multiply",
    },
    {
      input: radial(0.5, 1.0, 0.85, [
        [0, "rgba(56,189,248,0.30)"],
        [1, "rgba(56,189,248,0)"],
      ]),
      blend: "screen",
    },
    {
      input: grad([
        [0, "rgba(130,185,255,0.14)"],
        [0.38, "rgba(130,185,255,0)"],
      ]),
      blend: "screen",
    },
  ])
  .webp({ quality: 80 })
  .toFile("public/art/world-remix-2.webp");

// WORLD 03 — EXPAND: the florals under moonlight — violet forest, glowing path
await sharp("public/art/frame.jpg")
  .resize(2400, 1350, { fit: "cover" })
  .extract({ left: 140, top: 70, width: 1920, height: 1080 })
  .modulate({ brightness: 0.6, saturation: 1.22, hue: 16 })
  .composite([
    {
      input: grad([
        [0, "rgba(36,22,82,0.58)"],
        [0.5, "rgba(62,36,132,0.42)"],
        [1, "rgba(14,9,38,0.68)"],
      ]),
      blend: "multiply",
    },
    {
      input: radial(0.2, 0.14, 0.55, [
        [0, "rgba(196,181,253,0.34)"],
        [1, "rgba(196,181,253,0)"],
      ]),
      blend: "screen",
    },
    {
      input: grad([
        [0.72, "rgba(0,0,0,0)"],
        [1, "rgba(150,116,224,0.20)"],
      ]),
      blend: "screen",
    },
  ])
  .webp({ quality: 80 })
  .toFile("public/art/world-expand-2.webp");

// WORLD 04 — CREATE: the FASTLANE poster (pink truck on the flower hill),
// 2× Lanczos upscale + light sharpen from the 736×414 source.
// NOTE: source lives outside the repo (~/Downloads) — re-copy it there if missing.
await sharp("/home/mastereditzz/Downloads/Fastlane - Vintage Car poster.jpeg")
  .resize(1472, 828, { kernel: "lanczos3" })
  .sharpen({ sigma: 0.6 })
  .webp({ quality: 82 })
  .toFile("public/art/world-create-3.webp");

console.log("worlds generated");
