import React from "react";
import { C } from "../theme";

type P = { size?: number; color?: string };

const S: React.FC<P & { children: React.ReactNode }> = ({ size = 34, color = C.gold, children }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke={color}
    strokeWidth={1.7}
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    {children}
  </svg>
);

export const IconPin: React.FC<P> = (p) => (
  <S {...p}>
    <path d="M12 21s7-5.5 7-11a7 7 0 1 0-14 0c0 5.5 7 11 7 11Z" />
    <circle cx="12" cy="10" r="2.6" />
  </S>
);
export const IconCash: React.FC<P> = (p) => (
  <S {...p}>
    <rect x="2.5" y="6" width="19" height="12" rx="2.5" />
    <circle cx="12" cy="12" r="2.8" />
    <path d="M6 10v4M18 10v4" />
  </S>
);
export const IconBox: React.FC<P> = (p) => (
  <S {...p}>
    <path d="M12 2.7 20.5 7v10L12 21.3 3.5 17V7L12 2.7Z" />
    <path d="M3.5 7 12 11.5 20.5 7M12 11.5V21.3" />
  </S>
);
export const IconQr: React.FC<P> = (p) => (
  <S {...p}>
    <rect x="3" y="3" width="7" height="7" rx="1.4" />
    <rect x="14" y="3" width="7" height="7" rx="1.4" />
    <rect x="3" y="14" width="7" height="7" rx="1.4" />
    <path d="M14 14h3v3h-3zM20 14h1M14 20h3M20 18v3" />
  </S>
);
export const IconRoute: React.FC<P> = (p) => (
  <S {...p}>
    <circle cx="5.5" cy="18.5" r="2.4" />
    <circle cx="18.5" cy="5.5" r="2.4" />
    <path d="M8 18.5h6a4 4 0 0 0 0-8H10a4 4 0 0 1 0-8h6" />
  </S>
);
export const IconTarget: React.FC<P> = (p) => (
  <S {...p}>
    <circle cx="12" cy="12" r="8.6" />
    <circle cx="12" cy="12" r="4.6" />
    <circle cx="12" cy="12" r="1.1" fill={p.color ?? C.gold} />
  </S>
);
export const IconChart: React.FC<P> = (p) => (
  <S {...p}>
    <path d="M4 20V4M4 20h16" />
    <path d="M8 17V11M12.5 17V7.5M17 17v-4" />
  </S>
);
export const IconTeam: React.FC<P> = (p) => (
  <S {...p}>
    <circle cx="9" cy="8.5" r="3.2" />
    <path d="M3.5 19.5c0-3 2.5-5 5.5-5s5.5 2 5.5 5" />
    <path d="M16 6.4a3 3 0 0 1 0 5.6M17.5 14.8c2 .7 3.2 2.4 3.2 4.7" />
  </S>
);
export const IconWrench: React.FC<P> = (p) => (
  <S {...p}>
    <path d="M15.5 3.5a5.5 5.5 0 0 0-6.9 6.9L3.6 15.4a2 2 0 1 0 2.8 2.8l5-5a5.5 5.5 0 0 0 6.9-6.9l-3 3-2.8-2.8 3-3Z" />
  </S>
);
