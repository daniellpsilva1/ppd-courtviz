import { TransitionSeries } from "@remotion/transitions";
import { fade } from "@remotion/transitions/fade";
import { AbsoluteFill } from "remotion";
import { theme } from "./ppd-tokens";
import { AudioBed } from "./components/audio-bed";
import { SFXWhoosh } from "./components/sfx-cues";
import { SocialTitleScene } from "./scenes/social-title";
import { OutroScene } from "./scenes/outro";
import { SocialHexbinScene } from "./scenes/social-hexbin";
import { SocialMomentumScene } from "./scenes/social-momentum";
import { SocialStatsScene } from "./scenes/social-stats";
import { SocialCoachInsightsScene } from "./scenes/social-coach-insights";
import { SocialShotPatternsScene } from "./scenes/social-shot-patterns";
import { SocialTrajectoriesScene } from "./scenes/social-trajectories";
import { SocialClutchSpeedScene } from "./scenes/social-clutch-speed";
import { SocialSetBySetScene } from "./scenes/social-set-by-set";
import {
  SOCIAL_DURATIONS,
  SOCIAL_TOTAL_DURATION,
  SOCIAL_TRANSITION,
} from "./social-constants";

export function MatchRecapSocial() {
  return (
    <AbsoluteFill style={{ backgroundColor: theme.background }}>
      <AudioBed totalDuration={SOCIAL_TOTAL_DURATION} />
      <SFXWhoosh delay={SOCIAL_DURATIONS.title - 12} />
      <TransitionSeries>
        <TransitionSeries.Sequence durationInFrames={SOCIAL_DURATIONS.title}>
          <SocialTitleScene />
        </TransitionSeries.Sequence>

        <TransitionSeries.Transition presentation={fade()} timing={SOCIAL_TRANSITION} />

        <TransitionSeries.Sequence durationInFrames={SOCIAL_DURATIONS.hexbin}>
          <SocialHexbinScene />
        </TransitionSeries.Sequence>

        <TransitionSeries.Transition presentation={fade()} timing={SOCIAL_TRANSITION} />

        <TransitionSeries.Sequence durationInFrames={SOCIAL_DURATIONS.trajectories}>
          <SocialTrajectoriesScene />
        </TransitionSeries.Sequence>

        <TransitionSeries.Transition presentation={fade()} timing={SOCIAL_TRANSITION} />

        <TransitionSeries.Sequence durationInFrames={SOCIAL_DURATIONS.patterns}>
          <SocialShotPatternsScene />
        </TransitionSeries.Sequence>

        <TransitionSeries.Transition presentation={fade()} timing={SOCIAL_TRANSITION} />

        <TransitionSeries.Sequence durationInFrames={SOCIAL_DURATIONS.stats}>
          <SocialStatsScene />
        </TransitionSeries.Sequence>

        <TransitionSeries.Transition presentation={fade()} timing={SOCIAL_TRANSITION} />

        <TransitionSeries.Sequence durationInFrames={SOCIAL_DURATIONS.clutchSpeed}>
          <SocialClutchSpeedScene />
        </TransitionSeries.Sequence>

        <TransitionSeries.Transition presentation={fade()} timing={SOCIAL_TRANSITION} />

        <TransitionSeries.Sequence durationInFrames={SOCIAL_DURATIONS.setBySet}>
          <SocialSetBySetScene />
        </TransitionSeries.Sequence>

        <TransitionSeries.Transition presentation={fade()} timing={SOCIAL_TRANSITION} />

        <TransitionSeries.Sequence durationInFrames={SOCIAL_DURATIONS.coach}>
          <SocialCoachInsightsScene />
        </TransitionSeries.Sequence>

        <TransitionSeries.Transition presentation={fade()} timing={SOCIAL_TRANSITION} />

        <TransitionSeries.Sequence durationInFrames={SOCIAL_DURATIONS.momentum}>
          <SocialMomentumScene />
        </TransitionSeries.Sequence>

        <TransitionSeries.Transition presentation={fade()} timing={SOCIAL_TRANSITION} />

        <TransitionSeries.Sequence durationInFrames={SOCIAL_DURATIONS.outro}>
          <OutroScene />
        </TransitionSeries.Sequence>
      </TransitionSeries>
    </AbsoluteFill>
  );
}
