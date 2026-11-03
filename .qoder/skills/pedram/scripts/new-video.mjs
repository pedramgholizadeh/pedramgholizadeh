#!/usr/bin/env node
/*
 * new-video.mjs — scaffold a 2:1 Pedram video project from the skill template.
 *
 *   node new-video.mjs <slug> [--title "…"] [--duration 8] [--force]
 *
 * Creates ./videos/<slug>/ with the HyperFrames project, fonts, GSAP,
 * HyperMotion, the SRT tool and empty input/renders/notes folders.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const skillRoot = path.resolve(here, "..");
const template = path.join(skillRoot, "templates", "video-2x1");

const args = process.argv.slice(2);
const slug = args.find((a) => !a.startsWith("--"));
const flag = (name, fallback = null) => {
  const i = args.indexOf(`--${name}`);
  return i >= 0 ? args[i + 1] : fallback;
};

if (!slug) {
  console.error("usage: node new-video.mjs <slug> [--title \"…\"] [--duration 8] [--force]");
  process.exit(1);
}
if (!/^[a-z0-9][a-z0-9-]*$/.test(slug)) {
  console.error("slug must be kebab-case: lowercase letters, digits, dashes");
  process.exit(1);
}

const title = flag("title", slug.replace(/-/g, " "));
const duration = Number(flag("duration", "8"));
const force = args.includes("--force");

const cwd = process.cwd();
const dest = path.join(cwd, "videos", slug);

if (fs.existsSync(dest) && !force) {
  console.error(`refusing to overwrite ${dest} (pass --force to replace)`);
  process.exit(1);
}

fs.mkdirSync(path.dirname(dest), { recursive: true });
fs.cpSync(template, dest, { recursive: true, force: true });

for (const dir of ["input", "renders", "notes", "tools"]) {
  fs.mkdirSync(path.join(dest, dir), { recursive: true });
}

fs.copyFileSync(path.join(skillRoot, "scripts", "srt.mjs"), path.join(dest, "tools", "srt.mjs"));

for (const file of ["SPEC.md", "brief.md"]) {
  const p = path.join(dest, file);
  if (!fs.existsSync(p)) continue;
  const text = fs
    .readFileSync(p, "utf8")
    .replaceAll("__SLUG__", slug)
    .replaceAll("__TITLE__", title)
    .replaceAll("__DURATION__", String(duration));
  fs.writeFileSync(p, text, "utf8");
}

const index = fs.readFileSync(path.join(dest, "index.html"), "utf8");
fs.writeFileSync(
  path.join(dest, "index.html"),
  index.replace(/(<div\s+id="root"[\s\S]*?data-duration=")[\d.]+(")/, `$1${duration}$2`),
  "utf8",
);

fs.writeFileSync(
  path.join(dest, "CREDITS.md"),
  [
    "# Credits",
    "",
    "- **Vazirmatn** — SIL Open Font License 1.1 — https://github.com/rastikerdar/vazirmatn",
    "- **GSAP 3.15.0** — standard no-charge licence for end products that do not charge for access — https://gsap.com/licensing/",
    "- **HyperFrames 0.9.8** — Apache-2.0 — https://github.com/heygen-com/hyperframes",
    "- Motion, layout and look: this project (`assets/hypermotion.js`, `index.html`).",
    "",
  ].join("\n"),
  "utf8",
);

console.log(`created videos/${slug}/`);
console.log("");
console.log("next:");
console.log(`  1. put the subtitle file at videos/${slug}/input/script.fa.srt`);
console.log(`  2. node videos/${slug}/tools/srt.mjs all videos/${slug}`);
console.log(`  3. cd videos/${slug} && npx hyperframes check --json`);
console.log(`  4. cd videos/${slug} && npx hyperframes preview --background`);
console.log(`  5. cd videos/${slug} && npx hyperframes render -o renders/${slug}_2x1.mp4 --quality delivery`);
