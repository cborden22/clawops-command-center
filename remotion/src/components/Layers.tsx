import React from "react";
import { AbsoluteFill, useCurrentFrame, interpolate } from "remotion";
import { C } from "../theme";

export const PersistentBackground: React.FC = () => {
  const frame = useCurrentFrame();
  const drift = Math.sin(frame / 90) * 60;
  const drift2 = Math.cos(frame / 120) * 80;
  return (
    <AbsoluteFill style={{ backgroundColor: C.bgDeep, overflow: "hidden" }}>
      <AbsoluteFill
        style={{
          background: `radial-gradient(900px 700px at ${50 + drift / 12}% ${20 + drift2 / 40}%, rgba(224,180,74,0.16), transparent 60%)`,
        }}
      />
      <AbsoluteFill
        style={{
          background: `radial-gradient(1100px 800px at ${18 - drift / 16}% ${90 + drift2 / 60}%, rgba(60,80,140,0.20), transparent 62%)`,
        }}
      />
      <AbsoluteFill
        style={{
          opacity: 0.35,
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.045) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.045) 1px, transparent 1px)",
          backgroundSize: "88px 88px",
          transform: `translate(${drift / 8}px, ${drift2 / 10}px)`,
        }}
      />
      <AbsoluteFill
        style={{
          background:
            "radial-gradient(120% 100% at 50% 50%, transparent 40%, rgba(0,0,0,0.75) 100%)",
        }}
      />
    </AbsoluteFill>
  );
};

export const PersistentAccents: React.FC = () => {
  const frame = useCurrentFrame();
  const dots = new Array(14).fill(0);
  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      {dots.map((_, i) => {
        const seed = (i * 137.5) % 100;
        const y = ((seed * 9 + frame * (0.35 + (i % 4) * 0.14)) % 118) - 9;
        const x = (seed * 1.7) % 100;
        const size = 2 + (i % 3);
        const o = interpolate(y, [-9, 20, 90, 109], [0, 0.5, 0.5, 0], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        });
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: `${x}%`,
              top: `${100 - y}%`,
              width: size,
              height: size,
              borderRadius: 99,
              background: i % 3 === 0 ? C.gold : "rgba(255,255,255,0.6)",
              opacity: o,
              filter: "blur(0.3px)",
            }}
          />
        );
      })}
    </AbsoluteFill>
  );
};

export const Vignette: React.FC = () => (
  <AbsoluteFill
    style={{
      background: "linear-gradient(180deg, rgba(0,0,0,0.35) 0%, transparent 25%, transparent 72%, rgba(0,0,0,0.5) 100%)",
      pointerEvents: "none",
    }}
  />
);
