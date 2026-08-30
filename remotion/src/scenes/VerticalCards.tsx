import React from "react";
import { AbsoluteFill } from "remotion";
import { C, body, display } from "../theme";
import { GlassCard, Eyebrow } from "../components/Bits";
import { IconCash, IconRoute, IconBox } from "../components/Icons";

const items = [
  { Icon: IconCash, title: "Revenue tracked", sub: "Every collection, every split" },
  { Icon: IconRoute, title: "Routes on autopilot", sub: "Auto mileage + arrival detection" },
  { Icon: IconBox, title: "Inventory handled", sub: "Restock before it runs dry" },
];

export const VerticalCards: React.FC = () => (
  <AbsoluteFill style={{ justifyContent: "center", padding: "0 78px" }}>
    <Eyebrow delay={0}>One system</Eyebrow>
    <div style={{ height: 26 }} />
    <div style={{ display: "grid", gap: 26 }}>
      {items.map((it, i) => (
        <GlassCard key={it.title} delay={4 + i * 9} float={i} style={{ padding: "34px 32px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
            <div
              style={{
                width: 72,
                height: 72,
                flexShrink: 0,
                borderRadius: 20,
                background: "rgba(224,180,74,0.10)",
                border: "1px solid rgba(224,180,74,0.22)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <it.Icon size={36} />
            </div>
            <div>
              <div
                style={{
                  fontFamily: display,
                  fontWeight: 700,
                  fontSize: 40,
                  color: C.text,
                  marginBottom: 6,
                }}
              >
                {it.title}
              </div>
              <div style={{ fontFamily: body, fontSize: 26, color: C.muted }}>{it.sub}</div>
            </div>
          </div>
        </GlassCard>
      ))}
    </div>
  </AbsoluteFill>
);
