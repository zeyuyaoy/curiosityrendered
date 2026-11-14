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

> [!NOTE]
> Remotion is free for individuals and companies with up to 3 employees. Larger companies need a [company license](https://www.remotion.dev/docs/license).
