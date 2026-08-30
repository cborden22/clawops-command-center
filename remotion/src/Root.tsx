import React from "react";
import { Composition } from "remotion";
import { MainVideo } from "./MainVideo";
import { VerticalVideo } from "./VerticalVideo";

export const RemotionRoot: React.FC = () => (
  <>
    <Composition
      id="main-30-landscape"
      component={MainVideo}
      durationInFrames={900}
      fps={30}
      width={1920}
      height={1080}
      defaultProps={{ voiceover: undefined as string | undefined }}
    />
    <Composition
      id="main-08-vertical"
      component={VerticalVideo}
      durationInFrames={240}
      fps={30}
      width={1080}
      height={1920}
      defaultProps={{ voiceover: undefined as string | undefined }}
    />
  </>
);
