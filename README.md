### I'm running an experiment on Instagram!

I am producing 100% of my content programmatically using Remotion + React + TypeScript + local Kokoro narration.

This repository requires Node 24+, pnpm, ffmpeg/ffprobe on PATH, and [uv](https://docs.astral.sh/uv/) for narration. The first narration run downloads Kokoro-82M (~330 MB).

```bash
pnpm install
```

## Brand

```bash
pnpm brand
pnpm sfx
```

## An episode

Each episode is one spec, `episodes/<id>.json` (registered in `src/episodes.ts`).

```bash
pnpm check
pnpm studio
pnpm narrate <id>
pnpm render <id> --preview
pnpm render <id>
pnpm validate <id>
pnpm test
```

To correct a word timing by hand, edit `public/episodes/<id>/timings.json` and render again. `pnpm narrate` overwrites that file.

## Launch experiment

The episode specs hold the publication targets, copy, and beat timing. Final exports are in `output/<id>/`, with `reel.mp4`, `cover.png`, `caption.txt`, `transcript.srt`, `manifest.json`, and `validation.json`. The narration and word timings are versioned in `public/episodes/<id>/`.

| Reel | Implementation | Full render on the production Mac |
| --- | --- | --- |
| 01 · Three Algorithms. One Maze. | Maze generation, three search traces, and route comparison | 798 frames. Historical render time unavailable. |
| 02 · Would You Switch Doors? | Door reveal, three-case proof, and seeded 120-game tally | 666 frames and one cover, about 16–17 seconds per export. |
| 03 · Which Circle Is Bigger? | Two circle arrangements and one shared-diameter caliper | 390 frames and one cover, about 11–12 seconds per export. |

Reels 02 and 03 required no follow-up input from the account owner during production. Reel 02 used one visual revision after the full export, and Reel 03 used two preflight stills to check the illusion. Render timings include bundling, encoding, and export validation. The new episodes use 17% and 51% fewer frames, respectively, than Reel 01. There is no comparable record of active production time for Reel 01.

The two masters were played through at 360 × 640 on desktop. Visual checks included 320 px wide frames and square profile crops. Local speech recognition checked the exported narration against the scripts, and the export checks measured about −16 LUFS on both masters. Physical handset playback and Instagram upload were outside this review.

> [!NOTE]
> Remotion is free for individuals and companies with up to 3 employees. Larger companies need a [company license](https://www.remotion.dev/docs/license).
