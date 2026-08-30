import React from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate } from "remotion";
import { C, body } from "../theme";
import { Eyebrow, Headline, GoldRule } from "../components/Bits";

export const Hook: React.FC = () => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();
  const vertical = height > width;
  const push = interpolate(frame, [0, 150], [0, -18], { extrapolateRight: "clamp" });

  return (
    <AbsoluteFill
      style={{
        justifyContent: "center",
        padding: vertical ? "0 80px" : "0 140px",
        transform: `translateY(${push}px)`,
      }}
    >
      <div style={{ maxWidth: vertical ? 900 : 1250 }}>
        <Eyebrow delay={4}>Built for claw machine operators</Eyebrow>
        <div style={{ height: vertical ? 34 : 30 }} />
        <Headline
          size={vertical ? 92 : 108}
          delay={16}
          lines={[
            { text: "Your route." },
            { text: "Your revenue." },
            { text: "One system.", gold: true },
          ]}
        />
        <div style={{ height: 38 }} />
        <GoldRule delay={54} width={vertical ? 420 : 560} />
        <div style={{ height: 26 }} />
        <Sub delay={64} vertical={vertical} />
      </div>
    </AbsoluteFill>
  );
};

const Sub: React.FC<{ delay: number; vertical: boolean }> = ({ delay, vertical }) => {
  const frame = useCurrentFrame();
  const p = interpolate(frame - delay, [0, 24], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  return (
    <div
      style={{
        opacity: p,
        transform: `translateY(${(1 - p) * 18}px)`,
        fontFamily: body,
        fontWeight: 400,
        fontSize: vertical ? 34 : 30,
        color: C.muted,
        maxWidth: 720,
        lineHeight: 1.45,
      }}
    >
      Locations, collections, inventory, and payouts — tracked the moment they happen.
    </div>
  );
};
