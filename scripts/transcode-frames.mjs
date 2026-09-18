import { mkdirSync } from "node:fs";
import { join } from "node:path";
import sharp from "sharp";

const SRC =
  "/home/mastereditzz/Downloads/Camera_moving_through_golden_doo__20260916142236_frames";
const OUT = join(process.cwd(), "public", "frames");
const COUNT = 60;

mkdirSync(OUT, { recursive: true });

for (let i = 1; i <= COUNT; i++) {
  const n = String(i).padStart(3, "0");
  await sharp(join(SRC, `frame_${n}.png`))
    .jpeg({ quality: 80, mozjpeg: true })
    .toFile(join(OUT, `frame_${n}.jpg`));
  process.stdout.write(`\r${i}/${COUNT}`);
}
console.log("\ndone");
