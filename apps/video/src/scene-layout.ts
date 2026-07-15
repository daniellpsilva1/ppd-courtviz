const VERTICAL_HEADER = 172;
const VERTICAL_CHROME = {
  scoreBar: 66,
  callout: 72,
  gap: 20,
  bottomPad: 24,
  safeInset: 48,
};

export const VERTICAL_FOOTER =
  VERTICAL_CHROME.scoreBar +
  VERTICAL_CHROME.callout +
  VERTICAL_CHROME.gap +
  VERTICAL_CHROME.bottomPad +
  VERTICAL_CHROME.safeInset;

export const LANDSCAPE_HEADER = 140;
export const LANDSCAPE_FOOTER = 200;

const LANDSCAPE_CHROME = {
  scoreBar: 40,
  callout: 72,
  gap: 20,
  bottomPad: 28,
};

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

export function verticalContentLayout(canvasHeight: number, sidePadding = 40) {
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
