import { createRoot } from "react-dom/client";
import {
  enrichedShots,
  guestName,
  hostName,
  points,
  surface,
} from "@courtviz/data";
import { ppd } from "@courtviz/themes";
import {
  CourtDominanceInteractive,
  CourtDominanceThreeStage,
} from "@courtviz/spike";

const mode = new URLSearchParams(window.location.search).get("mode") ?? "three";

function App() {
  if (mode === "poster") {
    return (
      <div
        id="courtviz-poster-root"
        style={{
          background: ppd.background,
          width: 1080,
          height: 1920,
          padding: 48,
          boxSizing: "border-box",
        }}
      >
        <CourtDominanceInteractive
          enrichedShots={enrichedShots}
          guestName={guestName}
          hostName={hostName}
          points={points}
          surface={surface}
          theme={ppd}
          width={480}
          courtHeight={480}
        />
      </div>
    );
  }

  return (
    <div
      id="courtviz-export-root"
      style={{
        background: ppd.background,
        width: 1080,
        height: 1920,
        overflow: "hidden",
      }}
    >
      <CourtDominanceThreeStage
        enrichedShots={enrichedShots}
        surface={surface}
        theme={ppd}
        height={1920}
        registerSeekHook
        fps={30}
      />
    </div>
  );
}

createRoot(document.getElementById("root")!).render(<App />);
