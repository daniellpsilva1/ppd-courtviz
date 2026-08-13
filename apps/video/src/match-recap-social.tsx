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

function OpaqueWrap({ children }: { children: React.ReactNode }) {
  return (
    <AbsoluteFill style={{ backgroundColor: theme.background }}>
      {children}
    </AbsoluteFill>
  );
}

export function MatchRecapSocial() {
  return (
    <AbsoluteFill style={{ backgroundColor: theme.background }}>
      <AudioBed totalDuration={SOCIAL_TOTAL_DURATION} />
      <SFXWhoosh delay={SOCIAL_DURATIONS.title - 12} />
      <TransitionSeries>
        <TransitionSeries.Sequence durationInFrames={SOCIAL_DURATIONS.title}>
          <OpaqueWrap>
            <SocialTitleScene />
          </OpaqueWrap>
        </TransitionSeries.Sequence>

        <TransitionSeries.Transition presentation={fade()} timing={SOCIAL_TRANSITION} />

        <TransitionSeries.Sequence durationInFrames={SOCIAL_DURATIONS.hexbin} premountFor={12}>
          <OpaqueWrap>
            <SocialHexbinScene />
          </OpaqueWrap>
        </TransitionSeries.Sequence>

        <TransitionSeries.Transition presentation={fade()} timing={SOCIAL_TRANSITION} />

        <TransitionSeries.Sequence durationInFrames={SOCIAL_DURATIONS.trajectories} premountFor={12}>
          <OpaqueWrap>
            <SocialTrajectoriesScene />
          </OpaqueWrap>
        </TransitionSeries.Sequence>

        <TransitionSeries.Transition presentation={fade()} timing={SOCIAL_TRANSITION} />

        <TransitionSeries.Sequence durationInFrames={SOCIAL_DURATIONS.patterns} premountFor={12}>
          <OpaqueWrap>
            <SocialShotPatternsScene />
          </OpaqueWrap>
        </TransitionSeries.Sequence>

        <TransitionSeries.Transition presentation={fade()} timing={SOCIAL_TRANSITION} />

        <TransitionSeries.Sequence durationInFrames={SOCIAL_DURATIONS.stats} premountFor={12}>
          <OpaqueWrap>
            <SocialStatsScene />
          </OpaqueWrap>
        </TransitionSeries.Sequence>

        <TransitionSeries.Transition presentation={fade()} timing={SOCIAL_TRANSITION} />

        <TransitionSeries.Sequence durationInFrames={SOCIAL_DURATIONS.clutchSpeed} premountFor={12}>
          <OpaqueWrap>
            <SocialClutchSpeedScene />
          </OpaqueWrap>
        </TransitionSeries.Sequence>

        <TransitionSeries.Transition presentation={fade()} timing={SOCIAL_TRANSITION} />

        <TransitionSeries.Sequence durationInFrames={SOCIAL_DURATIONS.setBySet} premountFor={12}>
          <OpaqueWrap>
            <SocialSetBySetScene />
          </OpaqueWrap>
        </TransitionSeries.Sequence>

        <TransitionSeries.Transition presentation={fade()} timing={SOCIAL_TRANSITION} />

        <TransitionSeries.Sequence durationInFrames={SOCIAL_DURATIONS.coach} premountFor={12}>
          <OpaqueWrap>
            <SocialCoachInsightsScene />
          </OpaqueWrap>
        </TransitionSeries.Sequence>

        <TransitionSeries.Transition presentation={fade()} timing={SOCIAL_TRANSITION} />

        <TransitionSeries.Sequence durationInFrames={SOCIAL_DURATIONS.momentum} premountFor={12}>
          <OpaqueWrap>
            <SocialMomentumScene />
          </OpaqueWrap>
        </TransitionSeries.Sequence>

        <TransitionSeries.Transition presentation={fade()} timing={SOCIAL_TRANSITION} />

        <TransitionSeries.Sequence durationInFrames={SOCIAL_DURATIONS.outro}>
          <OpaqueWrap>
            <OutroScene />
          </OpaqueWrap>
        </TransitionSeries.Sequence>
      </TransitionSeries>
    </AbsoluteFill>
  );
}
