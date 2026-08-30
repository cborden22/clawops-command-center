import React from "react";
import { AbsoluteFill, Audio, staticFile } from "remotion";
import { TransitionSeries, springTiming } from "@remotion/transitions";
import { slide } from "@remotion/transitions/slide";
import { PersistentBackground, PersistentAccents, Vignette } from "./components/Layers";
import { Hook } from "./scenes/Hook";
import { VerticalCards } from "./scenes/VerticalCards";
import { Close } from "./scenes/Close";

const timing = springTiming({ config: { damping: 200 }, durationInFrames: 12 });

export const VerticalVideo: React.FC<{ voiceover?: string }> = ({ voiceover }) => (
  <AbsoluteFill>
    <PersistentBackground />
    <PersistentAccents />
    {voiceover ? <Audio src={staticFile(voiceover)} /> : null}
    <TransitionSeries>
      <TransitionSeries.Sequence durationInFrames={96}>
        <Hook />
      </TransitionSeries.Sequence>
      <TransitionSeries.Transition presentation={slide({ direction: "from-bottom" })} timing={timing} />
      <TransitionSeries.Sequence durationInFrames={100}>
        <VerticalCards />
      </TransitionSeries.Sequence>
      <TransitionSeries.Transition presentation={slide({ direction: "from-bottom" })} timing={timing} />
      <TransitionSeries.Sequence durationInFrames={68}>
        <Close />
      </TransitionSeries.Sequence>
    </TransitionSeries>
    <Vignette />
  </AbsoluteFill>
);
