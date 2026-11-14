import { Audio } from "@remotion/media";
import React from "react";
import { Sequence, staticFile } from "remotion";

export type SfxName = "click" | "tick" | "whoosh" | "ding" | "reveal" | "scan" | "bed";

export const Sfx: React.FC<{ name: SfxName; at: number; volume?: number; frames?: number; loop?: boolean }> = ({
  name,
  at,
  volume = 0.35,
  frames = 60,
  loop,
}) =>
  frames > 0 ? (
    <Sequence from={at} durationInFrames={frames} layout="none">
      <Audio src={staticFile(`sfx/${name}.wav`)} volume={volume} loop={loop} />
    </Sequence>
  ) : null;
