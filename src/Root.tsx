import React from "react";
import { Composition, staticFile, Still } from "remotion";
import { Cover, LogoSizes, Profile } from "./brand/stills";
import { brand } from "./brand/tokens";
import type { Timings } from "./episode/captions";
import { Episode, type EpisodeProps } from "./episode/Episode";
import { EpisodeSpec, type EpisodeInput } from "./episode/schema";
import { toTimeline } from "./episode/timeline";
import { episodes } from "./episodes";

const { width, height, fps } = brand.video;

const loadTimings = async (id: string): Promise<Timings | null> => {
  const res = await fetch(staticFile(`episodes/${id}/timings.json`)).catch(() => null);
  return res?.ok ? ((await res.json()) as Timings) : null;
};

export const Root: React.FC = () => (
  <>
    <Still id="profile" component={Profile} width={1024} height={1024} />
    <Still id="logo-sizes" component={LogoSizes} width={720} height={200} />
    {episodes.map((raw) => {
      const spec = EpisodeSpec.parse(raw);
      const { durationInFrames } = toTimeline(spec.beats);
      const input = raw as EpisodeInput;
      return (
        <React.Fragment key={spec.id}>
          <Composition
            id={spec.id}
            component={Episode}
            width={width}
            height={height}
            fps={fps}
            durationInFrames={durationInFrames}
            defaultProps={{ spec: input, timings: null, debug: false } satisfies EpisodeProps}
            calculateMetadata={async ({ props }) => ({ props: { ...props, timings: await loadTimings(spec.id) } })}
          />
          <Composition
            id={`${spec.id}-cover`}
            component={Cover}
            width={width}
            height={height}
            fps={fps}
            durationInFrames={durationInFrames}
            defaultProps={{ spec: input, debug: false }}
          />
        </React.Fragment>
      );
    })}
  </>
);
