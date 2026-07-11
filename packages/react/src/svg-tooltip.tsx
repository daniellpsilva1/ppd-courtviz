'use client';

import { useCallback, useState } from "react";
import type { CourtvizTheme } from "@courtviz/themes";

export interface SvgTooltipState {
  lines: string[];
  visible: boolean;
  x: number;
  y: number;
}

export function useSvgTooltipLocal() {
  const [tooltip, setTooltip] = useState<SvgTooltipState>({
    lines: [],
    visible: false,
    x: 0,
    y: 0,
  });

  const show = useCallback((x: number, y: number, lines: string[]) => {
    setTooltip({ lines, visible: true, x, y });
  }, []);

  const hide = useCallback(() => {
    setTooltip((current) => ({ ...current, visible: false }));
  }, []);

  return { hide, show, tooltip };
}

export function SvgTooltip({
  bounds,
  theme,
  tooltip,
}: {
  bounds?: { width: number; height: number };
  theme: CourtvizTheme;
  tooltip: SvgTooltipState;
}) {
  if (!tooltip.visible || tooltip.lines.length === 0) return null;

  const lineHeight = 14;
  const pad = 8;
  const margin = 6;
  const maxChars = Math.max(...tooltip.lines.map((line) => line.length));
  const width = Math.min(220, Math.max(72, maxChars * 6.2)) + pad * 2;
  const height = tooltip.lines.length * lineHeight + pad * 2;

  let x = tooltip.x + 12;
  let y = tooltip.y - height - 8;

  if (y < margin) {
    y = tooltip.y + 12;
  }

  if (bounds) {
    if (x + width > bounds.width - margin) {
      x = tooltip.x - width - 12;
    }
    x = Math.max(margin, Math.min(x, bounds.width - width - margin));
    y = Math.max(margin, Math.min(y, bounds.height - height - margin));
  } else {
    y = Math.max(margin, y);
  }

  return (
    <g pointerEvents="none">
      <rect
        fill={theme.ink}
        height={height}
        opacity={0.92}
        rx={4}
        width={width}
        x={x}
        y={y}
      />
      {tooltip.lines.map((line, index) => (
        <text
          fill={theme.background}
          fontFamily={`${theme.fonts.bodyFont}, ${theme.fonts.bodyFontFallback}`}
          fontSize={11}
          key={index}
          x={x + pad}
          y={y + pad + (index + 1) * lineHeight - 4}
        >
          {line}
        </text>
      ))}
    </g>
  );
}
