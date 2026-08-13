"use client";

import { useEffect, useState } from "react";
import type { EnrichedShot } from "@courtviz/core";
import type { CourtvizTheme } from "@courtviz/themes";
import { ppd } from "@courtviz/themes";
import { BounceMarkers, CourtStage, DominanceCameraRig } from "@courtviz/three";

export interface CourtDominanceThreeStageProps {
  enrichedShots: EnrichedShot[];
  surface?: "clay" | "hard" | "grass";
  theme?: CourtvizTheme;
  height?: number;
  frame?: number;
  fps?: number;
  registerSeekHook?: boolean;
}

declare global {
  interface Window {
    __courtvizSeekToFrame?: (frame: number) => void;
  }
}

export function CourtDominanceThreeStage({
  enrichedShots,
  surface = "clay",
  theme = ppd,
  height = 480,
  frame: frameProp = 0,
  fps = 30,
  registerSeekHook = false,
}: CourtDominanceThreeStageProps) {
  const [frame, setFrame] = useState(frameProp);

  useEffect(() => {
    setFrame(frameProp);
  }, [frameProp]);

  useEffect(() => {
    if (!registerSeekHook || typeof window === "undefined") return;
    const onSeek = (e: Event) => {
      const detail = (e as CustomEvent<number>).detail;
      setFrame(detail);
    };
    window.__courtvizSeekToFrame = (f: number) => setFrame(f);
    window.addEventListener("courtviz-seek", onSeek);
    return () => {
      delete window.__courtvizSeekToFrame;
      window.removeEventListener("courtviz-seek", onSeek);
    };
  }, [registerSeekHook]);

  const groundstrokes = enrichedShots.filter((s) => s.stroke !== "Serve" && s.result === "In");

  return (
    <div style={{ height, width: "100%" }}>
      <CourtStage
        theme={theme}
        surface={surface}
        enableOrbit={!registerSeekHook}
        useDefaultCamera={false}
        // Keep always-on so headless/export seeks still paint after invalidate
        frameloop="always"
      >
        <DominanceCameraRig frame={frame} fps={fps} />
        <BounceMarkers
          shots={groundstrokes}
          theme={theme}
          useHalfCourtNormalization
          maxMarkers={200}
        />
      </CourtStage>
    </div>
  );
}
