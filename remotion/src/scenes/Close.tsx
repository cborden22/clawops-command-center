import React from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate } from "remotion";
import { C, body, display } from "../theme";
import { GoldRule, useSpringIn } from "../components/Bits";

export const Close: React.FC = () => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();
  const vertical = height > width;
  const s = useSpringIn(6, 20);
  const glow = interpolate(frame, [0, 60], [0, 1], { extrapolateRight: "clamp" });
  const fade = (d: number) =>
    interpolate(frame - d, [0, 24], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", textAlign: "center" }}>
      <div
        style={{
          position: "absolute",
          width: vertical ? 760 : 900,
          height: vertical ? 760 : 900,
          borderRadius: 999,
          background: `radial-gradient(circle, rgba(224,180,74,${0.16 * glow}), transparent 62%)`,
        }}
      />
      <div
        style={{
          opacity: s,
          transform: `scale(${0.9 + s * 0.1})`,
          fontFamily: display,
          fontWeight: 800,
          fontSize: vertical ? 110 : 132,
          letterSpacing: -4,
          color: C.text,
        }}
      >
        <span style={{ color: C.gold }}>Claw</span>Ops
      </div>
      <div style={{ height: 26 }} />
      <div style={{ display: "flex", justifyContent: "center" }}>
        <GoldRule delay={26} width={vertical ? 300 : 380} />
      </div>
      <div style={{ height: 30 }} />
      <div
        style={{
          opacity: fade(34),
          transform: `translateY(${(1 - fade(34)) * 18}px)`,
          fontFamily: body,
          fontWeight: 500,
          fontSize: vertical ? 36 : 34,
          color: C.text,
        }}
      >
        Run your claw machine business like a pro.
      </div>
      <div style={{ height: 34 }} />
      <div
        style={{
          opacity: fade(52),
          display: "inline-flex",
          alignItems: "center",
          gap: 14,
          padding: "18px 34px",
          borderRadius: 999,
          background: C.gold,
          color: "#14110A",
          fontFamily: display,
          fontWeight: 700,
          fontSize: vertical ? 32 : 30,
        }}
      >
        clawops.com
      </div>
      <div style={{ height: 22 }} />
      <div
        style={{
          opacity: fade(64),
          fontFamily: body,
          fontSize: vertical ? 26 : 24,
          color: C.muted,
          letterSpacing: 0.5,
        }}
      >
        7-day free trial · cancel anytime
      </div>
    </AbsoluteFill>
  );
};
