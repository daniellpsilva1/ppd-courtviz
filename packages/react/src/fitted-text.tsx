/**
 * FittedText — measured SVG text that wraps, shrinks or truncates to fit,
 * emitting <tspan>s. The single replacement for char-ratio width heuristics.
 */

import { memo, useMemo } from "react";
import { fitSvgText, type FitTextMode } from "@courtviz/core";

export interface FittedTextProps {
  fill?: string;
  fontFamily: string;
  fontSize: number;
  fontWeight?: number | string;
  letterSpacing?: number | string;
  /** Line height multiplier (default 1.25). */
  lineHeight?: number;
  maxLines?: number;
  maxWidth: number;
  minFontSize?: number;
  mode?: FitTextMode;
  opacity?: number;
  text: string;
  textAnchor?: "start" | "middle" | "end";
  x: number;
  y: number;
}

export const FittedText = memo(function FittedText({
  fill,
  fontFamily,
  fontSize,
  fontWeight,
  letterSpacing,
  lineHeight = 1.25,
  maxLines = 1,
  maxWidth,
  minFontSize,
  mode,
  opacity,
  text,
  textAnchor = "start",
  x,
  y,
}: FittedTextProps) {
  const fitted = useMemo(
    () =>
      fitSvgText(text, {
        fontFamily,
        fontSize,
        fontWeight,
        maxLines,
        maxWidth,
        minFontSize,
        mode,
      }),
    [fontFamily, fontSize, fontWeight, maxLines, maxWidth, minFontSize, mode, text],
  );

  return (
    <text
      fill={fill}
      fontFamily={fontFamily}
      fontSize={fitted.fontSize}
      fontWeight={fontWeight}
      letterSpacing={letterSpacing}
      opacity={opacity}
      textAnchor={textAnchor}
      x={x}
      y={y}
    >
      {fitted.lines.map((line, index) => (
        <tspan dy={index === 0 ? 0 : fitted.fontSize * lineHeight} key={index} x={x}>
          {line}
        </tspan>
      ))}
    </text>
  );
});
