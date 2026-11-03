---
name: pedram
description: Build 2:1 Persian (RTL, Vazirmatn) videos from an SRT with HyperFrames and HyperMotion — Pedram's brand look, caption engine, deterministic motion, render and QA. Use for any Pedram video: subtitle films, voiceover explainers, promos, launch clips and reels.
---

# Pedram video system

The house style for Pedram Gholizadeh's videos: **2:1 canvas, Persian-first RTL, Vazirmatn only, dark graphite ground with a mint (`#55e6a5`) accent, HyperFrames as the renderer, HyperMotion as the motion layer.**

Everything is authored in HTML and rendered frame-by-frame by HyperFrames. The SRT is the script: its cues drive the captions, the scene rhythm and the length. No invented facts, no AI-generated footage, no external assets unless the user supplies them.

## Two video types

| Type | What it is | Template | Read |
|---|---|---|---|
| **1 — Standalone film** | Full-frame 2:1 video from the SRT: title, captions, end card, H.264 MP4. | `templates/video-2x1/` | this file + `references/srt-workflow.md` |
| **2 — Overlay layer** | Transparent 1920 × 960 graphic layer composited **above the user's own footage**: liquid-glass cards, Material icons, typing, counters, SFX. WebM VP9 + alpha (ProRes 4444 blows the 200 MB budget). | `templates/overlay-2x1/` | `references/overlay.md` |

Type 2 never shifts the SRT and never paints a background. Every box is liquid
glass with **5 px radius**, every beat is animated, and SFX are CC0 recordings
timed on the same clock. When the request says "بالای ویدیوی اصلی" / "overlay"
/ "لایه روی ویدیو", build type 2.

## Non-negotiables

1. **Canvas 1920 × 960 (2:1)**, 30 fps unless the user says otherwise. Root element carries `data-width="1920" data-height="960"`. Never use a 16:9 preset.
2. **`<html lang="fa" dir="rtl">`** and `text-align: start`. All copy is Persian. Latin fragments (URLs, code, brand names) get `dir="ltr"` + `unicode-bidi: isolate`.
3. **Vazirmatn only** (100–900, self-hosted woff2 in `assets/fonts/`). No Google Fonts, no fallback Latin face, no letter-spacing on Persian words.
4. **Never split Persian text into letters.** Cursive shaping breaks. Animate whole words (`inline-block`, split on spaces only, ZWNJ stays inside the word).
5. **HyperFrames contract**: every timed element has `class="clip"`, `data-start`, `data-duration`; each composition registers `window.__timelines["<id>"]` after its tweens; no timers, no `Date.now()`, no unseeded `Math.random()`, no `repeat: -1`.
6. **One accent colour** — mint `#55e6a5`. Lime `#e8fe51` may mark one word per shot, never more. No purple/blue gradients, no glass cards, no emoji.
7. **Facts are sacred.** Text comes from the SRT or from the user. Do not add numbers, claims, names or CTAs that are not in the source.
8. **Hold after landing**: a readable line holds ≥ `0.5 s + 0.3 s × words`; end card ≥ 2 s; caption groups never drift after landing.
9. **Check before render**: `npx hyperframes check --json` must pass, stills must be reviewed, then render. Never render from a failing composition.
10. **Half power, 200 MB, 30 fps** (see the `cool-render` skill): every render, snapshot and ASR job runs through `~/.qoder/skills/cool-render/scripts/cool-run` with `--workers 2` (never `auto`), one heavy job at a time, output CFR 30 fps and under 200 MB. Slow renders are the requirement, not the risk.

## Workflow

### 1. Intake (when the SRT arrives)

Ask at most these, in one message — skip anything already answered:

1. The `.srt` file (and the audio/video file if there is one).
2. The one sentence the viewer must remember.
3. Format: default **1920×960, 2:1, 30 fps**; confirm only if they named another ratio.
4. Music/SFX: none by default; if they have a track, get the file.
5. Any brand element to show: logo, site, handle, CTA — verbatim.

Then scaffold and work autonomously; do not pause per scene.

```bash
node .qoder/skills/pedram/scripts/new-video.mjs <slug>
# creates videos/<slug>/ from the 2:1 template
```

Put the SRT at `videos/<slug>/input/script.fa.srt`.

### 2. Parse and plan

```bash
node .qoder/skills/pedram/scripts/srt.mjs parse videos/<slug>/input/script.fa.srt \
  --out videos/<slug>/timeline.json
```

This normalises Persian characters, validates timings, strips SRT tags, and reports:
overlaps, cues over 7 s, reading-speed violations, empty cues, Latin-only cues.
Fix the report before building — never silently drop a cue.

```bash
node .qoder/skills/pedram/scripts/srt.mjs plan videos/<slug>/timeline.json \
  --out videos/<slug>/timeline.json
```

Groups cues into caption cards (3–7 words, max 2 lines, max 68 characters),
splits long cues, merges gaps under 0.12 s, and derives scene boundaries from
silences ≥ 0.9 s.

Write `SPEC.md` in the project root from `references/spec-template.md`:
numbers for the look, one line per scene, the frames to QA. Read
`references/brand-look.md` for the exact tokens.

### 3. Build

```bash
node .qoder/skills/pedram/scripts/srt.mjs build videos/<slug>
```

Writes static caption groups into `compositions/captions-01.html`,
`captions-02.html`, … — six cards per file — adds one captions host per file to
`index.html` (all on track 20), sets the root / title / end-card durations, and
writes `notes/srt-report.md` with every timing it changed.

Then author the non-caption scenes by hand (`compositions/title.html`,
`compositions/endcard.html`, optional chapter cards) following
`references/hypermotion.md` and `references/srt-workflow.md`.

**If the user also supplied audio/video**, add it as a timed `<audio>` /
`<video>` in `index.html` (`id`, `data-start`, `data-duration`, `data-volume`;
video gets `muted` or `data-has-audio="true"`). Captions are authored from the
SRT, not re-transcribed.

### 4. Check and review

```bash
cd videos/<slug>
COOL=~/.qoder/skills/cool-render/scripts/cool-run
$COOL npx hyperframes check --json
$COOL npx hyperframes snapshot --at 0.2,1.5,4,8 --out review/stills   # or --review
```

Look at the stills at 100%, 1600 px and 200 px wide. Persian must read right-to-left,
no clipped descenders (ی، ج، ع), no cut ZWNJ, no Latin fragment flipped.

Expected warnings: `timeline_track_too_dense` on a six-card captions file and
`film_silent` when no audio was supplied. Anything else, especially a lint
*error*, gets fixed before the next step. Then preview:

```bash
npx hyperframes preview --background
```

### 5. Render

```bash
cd videos/<slug>
COOL=~/.qoder/skills/cool-render/scripts/cool-run
$COOL npx hyperframes render -o renders/<slug>_2x1.mp4 --quality delivery \
  --workers 2 --video-bitrate 12M --max-bitrate 14M
~/.qoder/skills/cool-render/scripts/fit-size renders/<slug>_2x1.mp4 200
ffprobe -v error -show_entries stream=width,height,r_frame_rate,codec_name \
  -show_entries format=size -of json renders/<slug>_2x1.mp4
```

`--workers 2` and the bitrate caps are mandatory: the render must stay at half
CPU (the machine may not heat up, however long it takes) and the delivered file
must land under 200 MB at CFR 30 fps.

Deliver: the MP4, the project folder, `brief.md`, `SPEC.md`, `timeline.json`,
and the fonts licence note.

## Files

| Path | Read when |
|---|---|
| `references/brand-look.md` | Colours, background, type scale, do/don't, exact numbers |
| `references/srt-workflow.md` | Persian caption rules, grouping, timing, emphasis, QA |
| `references/hypermotion.md` | Motion vocabulary, easing, RTL direction, per-scene recipes |
| `references/hyperframes-contract.md` | Attributes, timeline rules, 2:1 quirks, lint fixes |
| `references/spec-template.md` | Write `SPEC.md` before the first scene |
| `references/overlay.md` | Type 2: transparent layer, liquid glass, icons, typing, SFX, alpha render |
| `assets/hypermotion.js` | Motion helper used inside compositions |
| `templates/video-2x1/` | Working starter project (title, captions, end card) |
| `templates/overlay-2x1/` | Working transparent overlay starter (glass chip + typing terminal) |
| `scripts/new-video.mjs` | Scaffold a video project |
| `scripts/srt.mjs` | Parse / plan / build from an SRT |
| `scripts/fetch-icons.mjs` | Download Material Symbols SVGs and regenerate `modules/icons.js` |
| `examples/sample.fa.srt` | Parser smoke test |

## About “HyperMotion”

There is no production npm package named `hypermotion` (the registry entry is an
unreleased React experiment). In this skill **HyperMotion** is the project's own
deterministic GSAP motion layer: `assets/hypermotion.js`, loaded inside every
HyperFrames composition, built on the GSAP timeline HyperFrames already seeks.
Use it; do not install an npm package by that name.

## One-line brief for the agent

> Read the SRT, plan the cards, write `SPEC.md`, build the 2:1 HyperFrames
> project in Vazirmatn RTL with the graphite + mint look, check, show stills,
> render.
