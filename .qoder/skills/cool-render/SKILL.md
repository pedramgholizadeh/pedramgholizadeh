---
name: cool-render
description: Hard limits for every video production job on this machine — render, transcode, encode, snapshot, whisper/transcribe, HyperFrames, Remotion, FFmpeg, WebM/MOV/MP4 export. Always use at most 50% of CPU power (length of the job does not matter), never exceed 200 MB per output file, always 30 fps output. Use whenever you launch or queue any media render or export.
---

# Cool, small, 30 fps renders

Three non-negotiable rules for **every** video task on this machine. Wall-clock
time is never a reason to break them — the user accepts slow renders.

1. **Half power, always.** Max 50% of the CPU, so the chassis never heats up.
2. **Max 200 MB per output file.** High quality inside that budget.
3. **30 fps output.** CFR 30, no 60 fps, no variable frame rate.

## 1. Half power

`scripts/cool-run` wraps any command with macOS background QoS (efficiency
cores), `nice -n 15`, and BLAS/OpenMP thread caps at half the physical cores.

```bash
COOL=~/.qoder/skills/cool-render/scripts/cool-run
$COOL --threads          # prints the cap (hw.physicalcpu / 2)
$COOL --check            # load average, thermal state, heavy jobs running now
$COOL npx hyperframes render -o renders/final.mp4 --workers 2
$COOL ffmpeg -threads 4 -i in.mp4 ... out.mp4
```

Rules that go with the wrapper:

- **One heavy job at a time.** Never run a render, a transcode and a
  transcription concurrently — queue them sequentially in the same shell call
  (`a && b && c`) or wait for the notification before starting the next.
  Before launching, run `$COOL --check`; if another job is above ~30% CPU, wait.
- **Never `--workers auto`.** HyperFrames calibrates to all cores. Pass
  `--workers 2` (8-core machine) or `workers = physical cores / 4`, min 1, since
  each worker is a full Chrome process.
- **ffmpeg:** always `-threads $HALF` (or `-filter_threads`/`-filter_complex_threads`
  when filters dominate). Prefer `-preset slow` over more threads: slower
  preset = smaller file at the same quality, and it costs no extra cores.
- **Whisper / ASR:** wrap with `cool-run`; there is no thread flag.
- Iteration renders use `--quality draft` or `looks`; `delivery` runs once, at
  the end, still capped.
- If `pmset -g therm` reports a CPU slowdown or the fan is audible, stop the
  queue, wait a few minutes, then continue.

## 2. Output under 200 MB

Budget the bitrate before the encode, don't discover the size afterwards:

```
video kbit/s ≈ (200 × 8 × 1000 / duration_seconds) − 130   # −130 for the AAC track
```

- HyperFrames: `npx hyperframes render --video-bitrate 12M --max-bitrate 14M`
  (or `--crf 20` plus `--max-bitrate`), then verify with `scripts/fit-size`.
- FFmpeg: `-b:v <computed>k -maxrate <computed>k -bufsize <2×>k` two-pass, or
  `-crf 20 -maxrate <computed>k -bufsize <2×>k`.
- Audio: `-c:a aac -b:a 128k` (voice) / 160k (music-heavy).

`scripts/fit-size <file.mp4> [max_mb]` measures the render and, only if it is
over budget, re-encodes two-pass at half power to the computed bitrate while
keeping 30 fps. It keeps the original as `-oversize.bak.mp4`.

```bash
$COOL npx hyperframes render -o renders/reel.mp4 --workers 2 --quality delivery
~/.qoder/skills/cool-render/scripts/fit-size renders/reel.mp4 200
```

## 3. 30 fps

- Composition: `data-fps="30"` on the root; render at the composition rate.
- FFmpeg: `-r 30` with `-fps_mode cfr` (never leave VFR — phone footage often
  is VFR); when slowing/speeding up, `setpts=PTS/<k>,fps=30`.
- Source at 25/60 fps: convert to 30 CFR in the master step, not at export.

## Verification block (run before reporting a render as done)

```bash
ffprobe -v error -show_entries format=duration,size \
  -show_entries stream=codec_name,r_frame_rate,width,height -of default=noprint_wrappers=1 out.mp4
~/.qoder/skills/cool-render/scripts/cool-run --check
```

Report: MB against the 200 MB budget, `r_frame_rate=30/1`, and that the machine
stayed under the cap. Do not claim a render finished while a capped job is
still running.

## Resources

| Path | Use |
|---|---|
| `scripts/cool-run` | half-power wrapper + `--threads` / `--check` |
| `scripts/fit-size` | 200 MB budget guard, 30 fps preserving |
