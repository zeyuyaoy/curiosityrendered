import { Audio } from "@remotion/media";
import React, { useMemo } from "react";
import { staticFile } from "remotion";
import { Captions } from "../components/Captions";
import { EndCard } from "../components/EndCard";
import { Headline } from "../components/Headline";
import { Sfx } from "../components/Sfx";
import { Stage } from "../components/Stage";
import { Challenge } from "../templates/Challenge";
import { Coins } from "../templates/Coins";
import { DigitSum } from "../templates/DigitSum";
import { Ebbinghaus } from "../templates/Ebbinghaus";
import { Explainer } from "../templates/Explainer";
import { Fibonacci } from "../templates/Fibonacci";
import { Handshakes } from "../templates/Handshakes";
import { MontyHall } from "../templates/MontyHall";
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

const bodies = {
  simulation: Simulation, challenge: Challenge, explainer: Explainer, "monty-hall": MontyHall, ebbinghaus: Ebbinghaus,
  fibonacci: Fibonacci, handshakes: Handshakes, coins: Coins, "digit-sum": DigitSum,
};

export const Episode: React.FC<EpisodeProps> = ({ spec, timings, debug, bare }) => {
  const resolved = useMemo(() => resolveEpisode(EpisodeSpec.parse(spec)), [spec]);
  const { timeline, spec: s } = resolved;
  const captions = useMemo(() => buildCaptions(timeline.beats, timings), [timeline, timings]);
  const Body = bodies[s.template];
  const last = timeline.beats[timeline.beats.length - 1];
  const captionHook = ["monty-hall", "fibonacci", "coins", "digit-sum"].includes(s.template);
  const hookEndMs = (timeline.beats[0].duration / FPS) * 1000;
  const shown = useMemo(() => captionHook ? captions : captions.filter((c) => c.startMs >= hookEndMs), [captions, captionHook, hookEndMs]);

  return (
    <EpisodeContext.Provider value={{ ...resolved, captions, bare: Boolean(bare) }}>
      <Stage debug={debug}>
        <Body />
        {bare ? null : (
          <>
            <Headline hook={s.hook} beats={timeline.beats} />
            {s.cta ? <EndCard at={last.from + Math.round(last.duration * 0.6)} text={s.cta} /> : null}
            <Captions captions={shown} top={s.template === "ebbinghaus" ? 1280 : undefined} />
            <Sfx name="bed" at={0} frames={timeline.durationInFrames} volume={0.05} loop />
            {timings ? <Audio src={staticFile(`episodes/${s.id}/${timings.audio}`)} /> : null}
          </>
        )}
      </Stage>
    </EpisodeContext.Provider>
  );
};
