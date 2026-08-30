import React from "react";
import { AbsoluteFill, Audio, staticFile } from "remotion";
import { TransitionSeries, springTiming } from "@remotion/transitions";
import { slide } from "@remotion/transitions/slide";
import { wipe } from "@remotion/transitions/wipe";
import { PersistentBackground, PersistentAccents, Vignette } from "./components/Layers";
import { Hook } from "./scenes/Hook";
import { Problem } from "./scenes/Problem";
import { Modules } from "./scenes/Modules";
import { Proof } from "./scenes/Proof";
import { Close } from "./scenes/Close";

const timing = springTiming({ config: { damping: 200 }, durationInFrames: 15 });

export const MainVideo: React.FC<{ voiceover?: string }> = ({ voiceover }) => (
  <AbsoluteFill>
    <PersistentBackground />
    <PersistentAccents />
    {voiceover ? <Audio src={staticFile(voiceover)} /> : null}
    <TransitionSeries>
      <TransitionSeries.Sequence durationInFrames={150}>
        <Hook />
      </TransitionSeries.Sequence>
      <TransitionSeries.Transition presentation={wipe({ direction: "from-bottom-right" })} timing={timing} />
      <TransitionSeries.Sequence durationInFrames={165}>
        <Problem />
      </TransitionSeries.Sequence>
      <TransitionSeries.Transition presentation={slide({ direction: "from-right" })} timing={timing} />
      <TransitionSeries.Sequence durationInFrames={300}>
        <Modules />
      </TransitionSeries.Sequence>
      <TransitionSeries.Transition presentation={slide({ direction: "from-right" })} timing={timing} />
      <TransitionSeries.Sequence durationInFrames={180}>
        <Proof />
      </TransitionSeries.Sequence>
      <TransitionSeries.Transition presentation={wipe({ direction: "from-bottom-right" })} timing={timing} />
      <TransitionSeries.Sequence durationInFrames={165}>
        <Close />
      </TransitionSeries.Sequence>
    </TransitionSeries>
    <Vignette />
  </AbsoluteFill>
);
