/**
 * Inline SVG logo paths for Peak Performance Data.
 * Vector version of the mountain + waveform circular mark
 * (matches packages/brand/assets/ppd-logo.png silhouette).
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
  /**
   * A-shaped mountain: flat apex, wide sides, serrated base
   * (not a plain triangle — matches official PEAK mark).
   */
  mountain:
    "M14.5 31.5 L20.2 15.2 L22.2 11.2 L25.8 11.2 L27.8 15.2 L33.5 31.5 L29.2 31.5 L27.4 26.8 L24 30.2 L20.6 26.8 L18.8 31.5 Z",
  /** Snow / highlight facet on the upper left ridge */
  mountainCap: "M20.2 15.2 L22.2 11.2 L25.8 11.2 L24 16.8 L21.6 16.2 Z",
  /** Right-side shadow facet */
  mountainShadow: "M24 16.8 L25.8 11.2 L27.8 15.2 L33.5 31.5 L29.2 31.5 L27.4 26.8 L24 30.2 Z",
  /**
   * EKG waveform: sharp QRS peak on the left, then a flat baseline —
   * reads as a pulse, not a random zigzag.
   */
  waveformPoints: "9,33.5 13,33.5 14.5,27 16,38 17.5,33.5 24,33.5 25.5,30.5 27,33.5 39,33.5",
} as const;

export const logoLockup = {
  primary: "PEAK PERFORMANCE",
  secondary: "DATA",
} as const;
