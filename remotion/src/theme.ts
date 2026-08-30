import { loadFont as loadSora } from "@remotion/google-fonts/Sora";
import { loadFont as loadManrope } from "@remotion/google-fonts/Manrope";

const sora = loadSora("normal", { weights: ["600", "700", "800"], subsets: ["latin"] });
const manrope = loadManrope("normal", { weights: ["400", "500", "700"], subsets: ["latin"] });

export const display = sora.fontFamily;
export const body = manrope.fontFamily;

export const C = {
  bg: "#0F0F10",
  bgDeep: "#08080A",
  surface: "#17171A",
  surfaceHi: "#1E1E22",
  gold: "#E0B44A",
  goldSoft: "#F0D28A",
  text: "#F5F1E8",
  muted: "#8A8A93",
  line: "rgba(224,180,74,0.28)",
};

export const glass = {
  background: "linear-gradient(160deg, rgba(38,38,44,0.92) 0%, rgba(20,20,24,0.92) 100%)",
  border: "1px solid rgba(255,255,255,0.07)",
  boxShadow: "0 24px 60px rgba(0,0,0,0.55), inset 0 1px 0 rgba(255,255,255,0.05)",
  borderRadius: 22,
};
