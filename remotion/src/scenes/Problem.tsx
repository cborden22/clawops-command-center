import React from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate, spring } from "remotion";
import { C, body, display, glass } from "../theme";
import { Eyebrow } from "../components/Bits";

const notes = [
  { t: "Cash in a bag", x: -0.34, y: -0.24, r: -9 },
  { t: "Texts from owners", x: 0.28, y: -0.3, r: 7 },
  { t: "Spreadsheet v7_FINAL", x: -0.3, y: 0.2, r: 5 },
  { t: "Mileage on a napkin", x: 0.33, y: 0.22, r: -6 },
  { t: "Who got paid?", x: 0.02, y: 0.34, r: 3 },
  { t: "Restock… maybe?", x: -0.05, y: -0.38, r: -4 },
];

export const Problem: React.FC = () => {
  const frame = useCurrentFrame();
  const { width, height, fps } = useVideoConfig();
  const vertical = height > width;
  const collapse = spring({ frame: frame - 62, fps, config: { damping: 22, stiffness: 90 } });

  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
      <div style={{ position: "absolute", top: vertical ? 200 : 120, left: vertical ? 80 : 140 }}>
        <Eyebrow delay={2}>The old way</Eyebrow>
      </div>

      {notes.map((n, i) => {
        const appear = interpolate(frame - i * 5, [0, 18], [0, 1], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        });
        const drift = Math.sin((frame + i * 24) / 30) * 6;
        const x = n.x * width * (1 - collapse);
        const y = n.y * height * 0.7 * (1 - collapse) + drift * (1 - collapse);
        const rot = n.r * (1 - collapse);
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              transform: `translate(${x}px, ${y - collapse * (i - 2.5) * -2}px) rotate(${rot}deg) scale(${1 - collapse * 0.35})`,
              opacity: appear * (1 - collapse * 0.92),
              padding: "18px 28px",
              borderRadius: 14,
              background: "rgba(30,30,34,0.94)",
              border: "1px solid rgba(255,255,255,0.08)",
              boxShadow: "0 18px 40px rgba(0,0,0,0.5)",
              fontFamily: body,
              fontWeight: 500,
              fontSize: vertical ? 30 : 27,
              color: "#CFCBC2",
              whiteSpace: "nowrap",
            }}
          >
            {n.t}
          </div>
        );
      })}

      <div
        style={{
          ...glass,
          opacity: collapse,
          transform: `scale(${0.8 + collapse * 0.2})`,
          padding: vertical ? "44px 52px" : "40px 62px",
          textAlign: "center",
        }}
      >
        <div
          style={{
            fontFamily: display,
            fontWeight: 800,
            fontSize: vertical ? 62 : 66,
            color: C.text,
            letterSpacing: -1.8,
          }}
        >
          One clean system
        </div>
        <div
          style={{
            marginTop: 12,
            fontFamily: body,
            fontSize: vertical ? 28 : 26,
            color: C.gold,
            letterSpacing: 1,
          }}
        >
          ClawOps
        </div>
      </div>
    </AbsoluteFill>
  );
};
