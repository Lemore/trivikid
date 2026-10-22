// Generates every app icon from spec/app-icon.png. Run with `npm run icons`;
// the output files are committed, so the build does not depend on this script.
import { mkdir, writeFile } from "node:fs/promises";
import sharp from "sharp";

const SOURCE = "spec/app-icon.png";
const LIGHT_WOOD = "#FBF1E2";

// Resizes the source icon, keeping its transparent rounded corners.
function plain(size) {
  return sharp(SOURCE).resize(size, size).png().toBuffer();
}

// Places the icon (scaled to `scale` of the side) centered on a solid Light Wood square.
async function onLightWood(size, scale) {
  const inner = Math.round(size * scale);
  const icon = await sharp(SOURCE).resize(inner, inner).png().toBuffer();
  return sharp({
    create: { width: size, height: size, channels: 4, background: LIGHT_WOOD },
  })
    .composite([{ input: icon, gravity: "center" }])
    .flatten({ background: LIGHT_WOOD })
    .png()
    .toBuffer();
}

// Wraps PNG images in an ICO container (ICO allows embedded PNG data).
function toIco(images) {
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0); // reserved
  header.writeUInt16LE(1, 2); // type: icon
  header.writeUInt16LE(images.length, 4);

  const entries = [];
  let offset = 6 + 16 * images.length;
  for (const { size, data } of images) {
    const entry = Buffer.alloc(16);
    entry.writeUInt8(size >= 256 ? 0 : size, 0); // width
    entry.writeUInt8(size >= 256 ? 0 : size, 1); // height
    entry.writeUInt8(0, 2); // palette colors
    entry.writeUInt8(0, 3); // reserved
    entry.writeUInt16LE(1, 4); // color planes
    entry.writeUInt16LE(32, 6); // bits per pixel
    entry.writeUInt32LE(data.length, 8);
    entry.writeUInt32LE(offset, 12);
    entries.push(entry);
    offset += data.length;
  }
  return Buffer.concat([header, ...entries, ...images.map((i) => i.data)]);
}

await mkdir("public/icons", { recursive: true });

await writeFile("public/icons/icon-192.png", await plain(192));
await writeFile("public/icons/icon-512.png", await plain(512));
// Maskable: the artwork stays inside the ~80% safe zone and the square is fully filled.
await writeFile("public/icons/icon-maskable-512.png", await onLightWood(512, 0.8));
// iOS renders transparency as black, so the Apple icon is opaque.
await writeFile("app/apple-icon.png", await onLightWood(180, 0.88));

const favicons = await Promise.all(
  [16, 32, 48].map(async (size) => ({ size, data: await plain(size) })),
);
await writeFile("app/favicon.ico", toIco(favicons));

console.log("Icons generated.");
