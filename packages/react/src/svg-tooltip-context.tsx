'use client';

import { createContext, useCallback, useContext, useState, type ReactNode } from 'react';
import type { CourtvizTheme } from '@courtviz/themes';
import { SvgTooltip, type SvgTooltipState } from './svg-tooltip';

interface SvgTooltipBounds {
  height: number;
  width: number;
}

interface SvgTooltipContextValue {
  bounds: SvgTooltipBounds | null;
  hide: () => void;
  show: (x: number, y: number, lines: string[]) => void;
  tooltip: SvgTooltipState;
}

const SvgTooltipContext = createContext<SvgTooltipContextValue | null>(null);

export function SvgTooltipProvider({
  bounds,
  children,
  theme,
}: {
  bounds?: SvgTooltipBounds;
  children: ReactNode;
  theme: CourtvizTheme;
}) {
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

  return (
    <SvgTooltipContext.Provider value={{ bounds: bounds ?? null, hide, show, tooltip }}>
      {children}
      <SvgTooltip bounds={bounds} theme={theme} tooltip={tooltip} />
    </SvgTooltipContext.Provider>
  );
}

export function useSvgTooltip() {
  const context = useContext(SvgTooltipContext);
  const [localTooltip, setLocalTooltip] = useState<SvgTooltipState>({
    lines: [],
    visible: false,
    x: 0,
    y: 0,
  });

  const localShow = useCallback((x: number, y: number, lines: string[]) => {
    setLocalTooltip({ lines, visible: true, x, y });
  }, []);

  const localHide = useCallback(() => {
    setLocalTooltip((current) => ({ ...current, visible: false }));
  }, []);

  if (context) {
    return {
      hide: context.hide,
      show: context.show,
      tooltip: context.tooltip,
    };
  }

  return {
    hide: localHide,
    show: localShow,
    tooltip: localTooltip,
  };
}

export function useHasSvgTooltipProvider() {
  return useContext(SvgTooltipContext) != null;
}
