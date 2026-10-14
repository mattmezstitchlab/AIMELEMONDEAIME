"use client";

import { useSyncExternalStore } from "react";
import { MeshGradient } from "@paper-design/shaders-react";

export type HeroGradientTheme = "wedding" | "planning" | "event";

type MeshPreset = {
  speed: number;
  scale: number;
  distortion: number;
  swirl: number;
  frame: number;
  grainMixer: number;
  grainOverlay: number;
  colors: [string, string, string, string];
  fallback: string;
};

/** Paper Design MeshGradient presets supplied for the current hero visual test. */
const PRESETS: Record<HeroGradientTheme, MeshPreset> = {
  wedding: {
    speed: 0.09,
    scale: 1,
    distortion: 0.2,
    swirl: 0,
    frame: 39026.777999479506,
    grainMixer: 0.53,
    grainOverlay: 0.1,
    colors: ["#FF6295", "#00A6CA", "#00AAE1", "#6200F7"],
    fallback: "radial-gradient(ellipse at 18% 38%, #ff6295 0%, transparent 52%), radial-gradient(ellipse at 77% 32%, #00a6ca 0%, transparent 48%), linear-gradient(125deg, #6200f7, #00aae1)",
  },
  planning: {
    speed: 0.16,
    scale: 1,
    distortion: 0.06,
    swirl: 0,
    frame: 42521.125999479824,
    grainMixer: 0.12,
    grainOverlay: 0.37,
    colors: ["#6398FF", "#520086", "#A374FF", "#8C58E1"],
    fallback: "radial-gradient(ellipse at 24% 28%, #6398ff 0%, transparent 54%), radial-gradient(ellipse at 78% 65%, #a374ff 0%, transparent 52%), linear-gradient(135deg, #520086, #8c58e1)",
  },
  event: {
    speed: 0.08,
    scale: 1.66,
    distortion: 0.32,
    swirl: 0.25,
    frame: 44343.90399951904,
    grainMixer: 0.06,
    grainOverlay: 0,
    colors: ["#FF6663", "#FE0077", "#0873D8", "#B30875"],
    fallback: "radial-gradient(ellipse at 19% 45%, #ff6663 0%, transparent 52%), radial-gradient(ellipse at 72% 28%, #fe0077 0%, transparent 50%), linear-gradient(135deg, #0873d8, #b30875)",
  },
};

const REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)";

function subscribeReducedMotion(onChange: () => void) {
  const media = window.matchMedia(REDUCED_MOTION_QUERY);
  media.addEventListener("change", onChange);
  return () => media.removeEventListener("change", onChange);
}

function getReducedMotionSnapshot() {
  return window.matchMedia(REDUCED_MOTION_QUERY).matches;
}

function getServerReducedMotionSnapshot() {
  return false;
}

export function MeshGradientBackground({ theme }: { theme: HeroGradientTheme }) {
  const preset = PRESETS[theme];
  const prefersReducedMotion = useSyncExternalStore(subscribeReducedMotion, getReducedMotionSnapshot, getServerReducedMotionSnapshot);

  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden" style={{ background: preset.fallback }}>
      <MeshGradient
        speed={prefersReducedMotion ? 0 : preset.speed}
        scale={preset.scale}
        distortion={preset.distortion}
        swirl={preset.swirl}
        frame={preset.frame}
        grainMixer={preset.grainMixer}
        grainOverlay={preset.grainOverlay}
        colors={preset.colors}
        maxPixelCount={1_500_000}
        style={{ position: "absolute", inset: 0, width: "100%", height: "100%", pointerEvents: "none" }}
      />
    </div>
  );
}
