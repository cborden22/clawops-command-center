import React from "react";
import { useCurrentFrame, useVideoConfig, interpolate, spring } from "remotion";
import { C, display, body, glass } from "../theme";

export const useReveal = (delay = 0, dur = 22) => {
  const frame = useCurrentFrame();
  const p = interpolate(frame - delay, [0, dur], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: (t) => 1 - Math.pow(1 - t, 3),
  });
  return {
    opacity: p,
    filter: `blur(${(1 - p) * 14}px)`,
    transform: `translateY(${(1 - p) * 34}px)`,
  } as React.CSSProperties;
};

export const useSpringIn = (delay = 0, damping = 16) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return spring({ frame: frame - delay, fps, config: { damping, stiffness: 170 } });
};

export const Eyebrow: React.FC<{ children: React.ReactNode; delay?: number }> = ({
  children,
  delay = 0,
}) => {
  const s = useReveal(delay, 18);
  return (
    <div
      style={{
        ...s,
        display: "inline-flex",
        alignItems: "center",
        gap: 12,
        fontFamily: body,
        fontWeight: 700,
        letterSpacing: 4,
        textTransform: "uppercase",
        color: C.gold,
      }}
    >
      <span style={{ width: 34, height: 2, background: C.gold, display: "inline-block" }} />
      {children}
    </div>
  );
};

export const GoldRule: React.FC<{ delay?: number; width: number; thickness?: number }> = ({
  delay = 0,
  width,
  thickness = 2,
}) => {
  const frame = useCurrentFrame();
  const p = interpolate(frame - delay, [0, 28], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: (t) => 1 - Math.pow(1 - t, 4),
  });
  return (
    <div
      style={{
        width: width * p,
        height: thickness,
        background: `linear-gradient(90deg, ${C.gold}, rgba(224,180,74,0.05))`,
        borderRadius: 2,
      }}
    />
  );
};

export const Headline: React.FC<{
  lines: { text: string; gold?: boolean }[];
  size: number;
  delay?: number;
  align?: "left" | "center";
}> = ({ lines, size, delay = 0, align = "left" }) => (
  <div style={{ textAlign: align, width: "100%" }}>
    {lines.map((l, i) => {
      return (
        <Line key={i} delay={delay + i * 7} size={size} gold={l.gold} text={l.text} />
      );
    })}
  </div>
);

const Line: React.FC<{ text: string; size: number; delay: number; gold?: boolean }> = ({
  text,
  size,
  delay,
  gold,
}) => {
  const s = useReveal(delay, 26);
  return (
    <div
      style={{
        ...s,
        fontFamily: display,
        fontWeight: 800,
        fontSize: size,
        lineHeight: 1.03,
        letterSpacing: -size * 0.028,
        color: gold ? C.gold : C.text,
      }}
    >
      {text}
    </div>
  );
};

export const GlassCard: React.FC<{
  children: React.ReactNode;
  delay?: number;
  style?: React.CSSProperties;
  float?: number;
}> = ({ children, delay = 0, style, float = 0 }) => {
  const frame = useCurrentFrame();
  const s = useSpringIn(delay, 18);
  const bob = Math.sin((frame + float * 20) / 34) * (float ? 5 : 0);
  return (
    <div
      style={{
        ...glass,
        opacity: s,
        transform: `translateY(${(1 - s) * 40 + bob}px) scale(${0.94 + s * 0.06})`,
        filter: `blur(${(1 - s) * 8}px)`,
        ...style,
      }}
    >
      {children}
    </div>
  );
};

export const Counter: React.FC<{
  to: number;
  delay?: number;
  dur?: number;
  prefix?: string;
  size: number;
}> = ({ to, delay = 0, dur = 55, prefix = "", size }) => {
  const frame = useCurrentFrame();
  const p = interpolate(frame - delay, [0, dur], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: (t) => 1 - Math.pow(1 - t, 4),
  });
  const v = Math.round(to * p);
  return (
    <span
      style={{
        fontFamily: display,
        fontWeight: 800,
        fontSize: size,
        color: C.text,
        fontVariantNumeric: "tabular-nums",
        letterSpacing: -size * 0.03,
      }}
    >
      {prefix}
      {v.toLocaleString("en-US")}
    </span>
  );
};

export const Label: React.FC<{ children: React.ReactNode; size?: number }> = ({
  children,
  size = 22,
}) => (
  <div
    style={{
      fontFamily: body,
      fontWeight: 500,
      fontSize: size,
      color: C.muted,
      letterSpacing: 0.2,
    }}
  >
    {children}
  </div>
);
