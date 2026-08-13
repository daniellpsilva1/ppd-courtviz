import type { Story } from "@ladle/react";
import { enrichedShots, guestName, hostName, surface } from "@courtviz/data";
import { PointReplayCourt } from "@courtviz/react";
import { ppd } from "@courtviz/themes";

/** First ~40 shots (~first few games) for a snappy gallery demo */
const previewShots = enrichedShots.filter(
  (s) => s.setNumber === 1 && s.gameNumber <= 2,
);

export const PointReplayInteractive: Story = () => (
  <div
    data-testid="point-replay-interactive"
    style={{ background: ppd.background, padding: 24 }}
  >
    <PointReplayCourt
      shots={previewShots.length > 0 ? previewShots : enrichedShots.slice(0, 80)}
      hostName={hostName}
      guestName={guestName}
      surface={surface}
      theme={ppd}
      width={420}
      height={560}
    />
  </div>
);

PointReplayInteractive.storyName = "Replay — Point by point (2D)";

export const PointReplayFullMatch: Story = () => (
  <div style={{ background: ppd.background, padding: 24 }}>
    <PointReplayCourt
      shots={enrichedShots}
      hostName={hostName}
      guestName={guestName}
      surface={surface}
      theme={ppd}
      width={480}
      height={640}
    />
  </div>
);

PointReplayFullMatch.storyName = "Replay — Full match (2D)";
