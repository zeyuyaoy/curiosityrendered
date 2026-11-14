import { Audio } from "@remotion/media";
import React, { useMemo } from "react";
import { staticFile } from "remotion";
import { Captions } from "../components/Captions";
import { EndCard } from "../components/EndCard";
import { Headline } from "../components/Headline";
import { Sfx } from "../components/Sfx";
import { Stage } from "../components/Stage";
import { Challenge } from "../templates/Challenge";
import { Explainer } from "../templates/Explainer";
import { Simulation } from "../templates/Simulation";
import { buildCaptions, type Timings } from "./captions";
import { EpisodeContext } from "./context";
import { resolveEpisode } from "./resolve";
import { FPS } from "./timeline";
import { EpisodeSpec, type EpisodeInput } from "./schema";

export type EpisodeProps = {
  spec: EpisodeInput;
  timings: Timings | null;
  debug?: boolean;
  bare?: boolean;
};

const bodies = { simulation: Simulation, challenge: Challenge, explainer: Explainer };

export const Episode: React.FC<EpisodeProps> = ({ spec, timings, debug, bare }) => {
  const resolved = useMemo(() => resolveEpisode(EpisodeSpec.parse(spec)), [spec]);
  const { timeline, spec: s } = resolved;
  const captions = useMemo(() => buildCaptions(timeline.beats, timings), [timeline, timings]);
  const Body = bodies[s.template];
  const last = timeline.beats[timeline.beats.length - 1];
  const hookEndMs = (timeline.beats[0].duration / FPS) * 1000;
  const shown = useMemo(() => captions.filter((c) => c.startMs >= hookEndMs), [captions, hookEndMs]);

  return (
    <EpisodeContext.Provider value={{ ...resolved, captions, bare: Boolean(bare) }}>
      <Stage debug={debug}>
        <Body />
        {bare ? null : (
          <>
            <Headline hook={s.hook} beats={timeline.beats} />
            {s.cta ? <EndCard at={last.from + Math.round(last.duration * 0.6)} text={s.cta} /> : null}
            <Captions captions={shown} />
            <Sfx name="bed" at={0} frames={timeline.durationInFrames} volume={0.05} loop />
            {timings ? <Audio src={staticFile(`episodes/${s.id}/${timings.audio}`)} /> : null}
          </>
        )}
      </Stage>
    </EpisodeContext.Provider>
  );
};
