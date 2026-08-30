import React from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate } from "remotion";
import { C, body, display } from "../theme";
import { Eyebrow, GlassCard, Counter, Label } from "../components/Bits";

export const Proof: React.FC = () => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();
  const vertical = height > width;

  const barP = (i: number) =>
    interpolate(frame - 40 - i * 6, [0, 34], [0, 1], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
      easing: (t) => 1 - Math.pow(1 - t, 3),
    });
  const bars = [0.42, 0.58, 0.5, 0.74, 0.66, 0.88, 0.79, 1];

  return (
    <AbsoluteFill
      style={{ justifyContent: "center", padding: vertical ? "0 70px" : "0 130px" }}
    >
      <Eyebrow delay={2}>Numbers you can trust</Eyebrow>
      <div style={{ height: 34 }} />
      <div
        style={{
          display: "grid",
          gridTemplateColumns: vertical ? "1fr" : "1.25fr 1fr",
          gap: 30,
          alignItems: "stretch",
        }}
      >
        <GlassCard delay={10} style={{ padding: vertical ? "34px 32px" : "40px 44px" }}>
          <Label size={vertical ? 24 : 22}>Collections this month</Label>
          <div style={{ marginTop: 10, display: "flex", alignItems: "baseline", gap: 14 }}>
            <Counter to={18420} prefix="$" size={vertical ? 78 : 88} delay={14} />
            <span
              style={{
                fontFamily: body,
                fontWeight: 700,
                fontSize: vertical ? 26 : 24,
                color: "#6FD08C",
              }}
            >
              ▲ 23%
            </span>
          </div>
          <div
            style={{
              marginTop: 30,
              height: vertical ? 150 : 170,
              display: "flex",
              alignItems: "flex-end",
              gap: vertical ? 14 : 16,
            }}
          >
            {bars.map((b, i) => (
              <div
                key={i}
                style={{
                  flex: 1,
                  height: `${b * barP(i) * 100}%`,
                  borderRadius: 8,
                  background:
                    i === bars.length - 1
                      ? `linear-gradient(180deg, ${C.gold}, rgba(224,180,74,0.35))`
                      : "linear-gradient(180deg, rgba(255,255,255,0.22), rgba(255,255,255,0.06))",
                }}
              />
            ))}
          </div>
        </GlassCard>

        <div style={{ display: "grid", gap: 26 }}>
          <GlassCard delay={24} style={{ padding: vertical ? "28px 30px" : "32px 36px" }}>
            <Label size={vertical ? 24 : 21}>Commission split, done for you</Label>
            <div style={{ marginTop: 14, display: "flex", alignItems: "baseline", gap: 12 }}>
              <Counter to={4230} prefix="$" size={vertical ? 56 : 54} delay={30} />
              <span style={{ fontFamily: body, fontSize: 22, color: C.muted }}>owner payout</span>
            </div>
            <Split delay={40} />
          </GlassCard>

          <GlassCard delay={38} style={{ padding: vertical ? "28px 30px" : "32px 36px" }}>
            <Label size={vertical ? 24 : 21}>Route completed</Label>
            <div
              style={{
                marginTop: 12,
                display: "flex",
                alignItems: "baseline",
                gap: 16,
                fontFamily: display,
                fontWeight: 800,
                fontSize: vertical ? 52 : 50,
                color: C.text,
              }}
            >
              <Counter to={11} size={vertical ? 52 : 50} delay={44} dur={40} />
              <span style={{ fontFamily: body, fontWeight: 500, fontSize: 22, color: C.muted }}>
                stops · 84 mi logged
              </span>
            </div>
          </GlassCard>
        </div>
      </div>
    </AbsoluteFill>
  );
};

const Split: React.FC<{ delay: number }> = ({ delay }) => {
  const frame = useCurrentFrame();
  const p = interpolate(frame - delay, [0, 34], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: (t) => 1 - Math.pow(1 - t, 3),
  });
  return (
    <div style={{ marginTop: 20 }}>
      <div
        style={{
          height: 12,
          borderRadius: 99,
          background: "rgba(255,255,255,0.08)",
          overflow: "hidden",
          display: "flex",
        }}
      >
        <div style={{ width: `${40 * p}%`, background: C.gold }} />
        <div style={{ width: `${60 * p}%`, background: "rgba(255,255,255,0.28)" }} />
      </div>
      <div
        style={{
          marginTop: 10,
          display: "flex",
          justifyContent: "space-between",
          fontFamily: body,
          fontSize: 19,
          color: C.muted,
          opacity: p,
        }}
      >
        <span>Boxing machine 40%</span>
        <span>Claw machines 25%</span>
      </div>
    </div>
  );
};
