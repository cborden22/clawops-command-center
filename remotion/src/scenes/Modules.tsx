import React from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate } from "remotion";
import { C, body, display } from "../theme";
import { Eyebrow, GlassCard } from "../components/Bits";
import {
  IconPin,
  IconCash,
  IconBox,
  IconQr,
  IconRoute,
  IconTarget,
  IconChart,
  IconTeam,
} from "../components/Icons";

const items = [
  { Icon: IconPin, title: "Locations", sub: "Contacts, rates, schedules" },
  { Icon: IconCash, title: "Revenue", sub: "Every collection logged" },
  { Icon: IconBox, title: "Inventory", sub: "Restock before it's empty" },
  { Icon: IconQr, title: "Maintenance", sub: "QR issue reporting" },
  { Icon: IconRoute, title: "Routes", sub: "Auto mileage + geofence" },
  { Icon: IconTarget, title: "Leads CRM", sub: "Pipeline to placement" },
  { Icon: IconChart, title: "Reports", sub: "Know your numbers" },
  { Icon: IconTeam, title: "Team", sub: "Roles and permissions" },
];

export const Modules: React.FC = () => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();
  const vertical = height > width;
  const shown = vertical ? items.slice(0, 6) : items;
  const cols = vertical ? 2 : 4;
  const scale = interpolate(frame, [0, 300], [1, 1.045], { extrapolateRight: "clamp" });

  return (
    <AbsoluteFill
      style={{
        justifyContent: "center",
        padding: vertical ? "0 70px" : "0 120px",
      }}
    >
      <Eyebrow delay={2}>Everything in one place</Eyebrow>
      <div style={{ height: 22 }} />
      <div
        style={{
          fontFamily: display,
          fontWeight: 800,
          fontSize: vertical ? 66 : 74,
          color: C.text,
          letterSpacing: -2,
          maxWidth: 1100,
          ...useFade(6),
        }}
      >
        Eight modules. <span style={{ color: C.gold }}>Zero guesswork.</span>
      </div>
      <div style={{ height: vertical ? 48 : 56 }} />
      <div
        style={{
          display: "grid",
          gridTemplateColumns: `repeat(${cols}, 1fr)`,
          gap: vertical ? 26 : 28,
          transform: `scale(${scale})`,
          transformOrigin: "center top",
        }}
      >
        {shown.map((it, i) => (
          <GlassCard
            key={it.title}
            delay={30 + i * 11}
            float={i}
            style={{ padding: vertical ? "30px 26px" : "30px 28px" }}
          >
            <div
              style={{
                width: 60,
                height: 60,
                borderRadius: 16,
                background: "rgba(224,180,74,0.10)",
                border: "1px solid rgba(224,180,74,0.22)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                marginBottom: 18,
              }}
            >
              <it.Icon size={30} />
            </div>
            <div
              style={{
                fontFamily: display,
                fontWeight: 700,
                fontSize: vertical ? 34 : 30,
                color: C.text,
                marginBottom: 8,
              }}
            >
              {it.title}
            </div>
            <div
              style={{
                fontFamily: body,
                fontSize: vertical ? 24 : 21,
                color: C.muted,
                lineHeight: 1.35,
              }}
            >
              {it.sub}
            </div>
          </GlassCard>
        ))}
      </div>
    </AbsoluteFill>
  );
};

const useFade = (delay: number): React.CSSProperties => {
  const frame = useCurrentFrame();
  const p = interpolate(frame - delay, [0, 24], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  return { opacity: p, filter: `blur(${(1 - p) * 12}px)`, transform: `translateY(${(1 - p) * 24}px)` };
};
