/**
 * Shared band constants for deck slide renderers.
 * Single source of truth for spacing values previously hardcoded
 * in export-slide-helpers.cjs and scene-layout.ts.
 */

import { chrome } from "@ppd/tokens";

export const SLIDE_BANDS = {
  calloutRowGap: 110,
  zoneBarH: 64,
  zoneSectionOffset: 82,
  zoneLabelGap: 28,
  zoneColumnGap: 36,

  duelSectionH: 30,
  duelMinRowH: 54,
  duelMaxRowBonus: 64,
  duelStartY: 8,

  rallySectionGap: 56,
  rallyMinRowH: 48,
  rallyMaxRowH: 88,
  rallyFooterH: 110,
  rallyHighlightOffset: 64,

  coachCardGap: 20,
  coachCardMinH: 220,
  coachCardMaxH: 320,
  coachCardStartY: 8,

  momentumFooterH: 80,
  momentumStartY: 12,

  densityGap: 20,
  densityLabelH: 44,
  densityStartY: 12,

  errorStartY: 12,

  coverScoreBlock: 120,
  coverCourtAspect: 0.72,

  dualCourtGap: 8,
} as const;

/**
 * @deprecated Use `chrome` from `@ppd/tokens` (`layout.chrome`). Re-exported
 * here so existing consumers keep one source of truth.
 */
export const VIDEO_CHROME = chrome;
