export interface SpringPreset {
  damping: number;
  stiffness?: number;
  mass?: number;
}

export const motionTokens = {
  springs: {
    snappy: { damping: 200 },
    smooth: { damping: 28, stiffness: 200 },
    bouncy: { damping: 14, stiffness: 120 },
    gentle: { damping: 18, stiffness: 80 },
  },
  durations: {
    fastFrames: 8,
    normalFrames: 18,
    slowFrames: 30,
    stingerFrames: 45,
  },
  easing: {
    courtLine: [0.25, 0.1, 0.25, 1] as const,
    baselineSweep: [0.16, 1, 0.3, 1] as const,
    easeOutExpo: [0.16, 1, 0.3, 1] as const,
  },
} as const;

export type SpringName = keyof typeof motionTokens.springs;
