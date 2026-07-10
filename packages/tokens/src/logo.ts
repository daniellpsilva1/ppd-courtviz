/**
 * Inline SVG logo paths for Peak Performance Data.
 * Vector version of the mountain + waveform circular mark.
 */

export const logoColors = {
  mountain: "#2563EB",
  mountainLight: "#4A90D9",
  mountainShadow: "#1D4ED8",
  waveform: "#38BDF8",
  circleFill: "#FFFFFF",
  circleStroke: "#E2E8F0",
  text: "#0F172A",
} as const;

export const LOGO_ICON_VIEWBOX = "0 0 48 48";

export const logoIconPaths = {
  circle: { cx: 24, cy: 24, r: 22 },
  /** Main mountain mass */
  mountain: "M24 7 L36 31 L12 31 Z",
  /** Snow cap / highlight */
  mountainCap: "M24 10 L30 24 L18 24 Z",
  /** Inner shadow facet */
  mountainShadow: "M24 24 L36 31 L24 31 Z",
  /** EKG waveform across lower third */
  waveformPoints: "8,35 12,31 16,37 20,29 24,34 28,27 32,33 36,28 40,32",
} as const;

export const logoLockup = {
  primary: "PEAK PERFORMANCE",
  secondary: "DATA",
} as const;
