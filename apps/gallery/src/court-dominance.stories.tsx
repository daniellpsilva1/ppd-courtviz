import type { Story } from "@ladle/react";
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

export const CourtDominanceInteractiveStory: Story = () => (
  <div data-testid="court-dominance-interactive" style={{ background: ppd.background, padding: 24 }}>
    <CourtDominanceInteractive
      enrichedShots={enrichedShots}
      guestName={guestName}
      hostName={hostName}
      points={points}
      surface={surface}
      theme={ppd}
    />
  </div>
);

CourtDominanceInteractiveStory.storyName = "Spike — Court Dominance (interactive)";

export const CourtDominanceThreeStory: Story = () => (
  <div style={{ background: ppd.background, padding: 24, height: 560 }}>
    <CourtDominanceThreeStage enrichedShots={enrichedShots} surface={surface} theme={ppd} height={520} />
  </div>
);

CourtDominanceThreeStory.storyName = "Spike — Court Dominance (Three stage)";

/** 9:16 capture target for seekable MP4 export (Playwright) */
export const CourtDominanceVideoExportStory: Story = () => (
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

CourtDominanceVideoExportStory.storyName = "Spike — Court Dominance (video export 9:16)";

/** Static PNG export (1080×1920 interactive hexbin) */
export const CourtDominancePosterExportStory: Story = () => (
  <div
    id="courtviz-poster-root"
    style={{ background: ppd.background, padding: 48, width: 1080, minHeight: 1920 }}
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

CourtDominancePosterExportStory.storyName = "Spike — Court Dominance (poster export)";

/**
 * Default "spike" entry — interactive HexbinLayer only.
 * (Previously stacked a blank-looking Three canvas under Ladle and looked broken.)
 */
export const CourtDominanceSpike: Story = () => (
  <div data-testid="court-dominance-interactive" style={{ background: ppd.background, padding: 24 }}>
    <p style={{ color: ppd.inkMuted, fontFamily: ppd.fonts.bodyFont, fontSize: 13, marginTop: 0 }}>
      Interactive HexbinLayer spike. For 3D orbit use “Three stage”. For the MP4 open{" "}
      <code>exports/spike/court-dominance/court-dominance-9x16.mp4</code>.
    </p>
    <CourtDominanceInteractive
      enrichedShots={enrichedShots}
      guestName={guestName}
      hostName={hostName}
      points={points}
      surface={surface}
      theme={ppd}
    />
  </div>
);

CourtDominanceSpike.storyName = "Spike — Court Dominance (start here)";
