import { chrome } from "@ppd/tokens";

const VERTICAL_HEADER = chrome.vertical.header;
const VERTICAL_CHROME = chrome.vertical;

export const VERTICAL_FOOTER =
  VERTICAL_CHROME.scoreBar +
  VERTICAL_CHROME.callout +
  VERTICAL_CHROME.gap +
  VERTICAL_CHROME.bottomPad +
  VERTICAL_CHROME.safeInset;

export const LANDSCAPE_HEADER = chrome.landscape.header;
export const LANDSCAPE_FOOTER = chrome.landscape.footer;

const LANDSCAPE_CHROME = chrome.landscape;

export function chromeOffsets(orientation: "vertical" | "landscape") {
  if (orientation === "vertical") {
    const scoreBottom = VERTICAL_CHROME.bottomPad + VERTICAL_CHROME.safeInset;
    const insightBottom = scoreBottom + VERTICAL_CHROME.scoreBar + VERTICAL_CHROME.gap;
    return {
      insightBottom,
      legendBottom: insightBottom + VERTICAL_CHROME.callout + 12,
      scoreBottom,
    };
  }
  const scoreBottom = LANDSCAPE_CHROME.bottomPad;
  const insightBottom = scoreBottom + LANDSCAPE_CHROME.scoreBar + LANDSCAPE_CHROME.gap;
  return {
    insightBottom,
    legendBottom: insightBottom + LANDSCAPE_CHROME.callout + 12,
    scoreBottom,
  };
}

export function verticalContentLayout(canvasHeight: number, sidePadding = 56) {
  const contentTop = VERTICAL_HEADER;
  const contentHeight = canvasHeight - contentTop - VERTICAL_FOOTER;
  return {
    contentBottom: contentTop + contentHeight,
    contentHeight,
    contentTop,
    headerTop: VERTICAL_HEADER - 108,
    sidePadding,
  };
}

export function landscapeContentLayout(canvasHeight: number, sidePadding = 80) {
  const contentTop = LANDSCAPE_HEADER;
  const contentHeight = canvasHeight - contentTop - LANDSCAPE_FOOTER;
  return {
    contentBottom: contentTop + contentHeight,
    contentHeight,
    contentTop,
    headerTop: LANDSCAPE_HEADER - 64,
    sidePadding,
  };
}
