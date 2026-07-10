import { createContext, useContext, type ReactNode } from "react";
import type { CourtScales } from "@courtviz/core";

const CourtScalesContext = createContext<CourtScales | null>(null);

export function CourtScalesProvider({
  scales,
  children,
}: {
  scales: CourtScales;
  children: ReactNode;
}) {
  return (
    <CourtScalesContext.Provider value={scales}>{children}</CourtScalesContext.Provider>
  );
}

export function useCourtScales(): CourtScales {
  const ctx = useContext(CourtScalesContext);
  if (!ctx) {
    throw new Error("useCourtScales must be used within CourtScalesProvider or Court/CourtSurface");
  }
  return ctx;
}

export function useOptionalCourtScales(): CourtScales | null {
  return useContext(CourtScalesContext);
}
