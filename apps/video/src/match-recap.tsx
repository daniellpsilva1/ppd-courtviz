import { TransitionSeries } from "@remotion/transitions";
import { fade } from "@remotion/transitions/fade";
import { slide } from "@remotion/transitions/slide";
import { wipe } from "@remotion/transitions/wipe";
import { AbsoluteFill } from "remotion";
import { theme } from "./ppd-tokens";
import { AudioBed } from "./components/audio-bed";
import { SFXWhoosh } from "./components/sfx-cues";
import { FADE_TRANSITION, SCENE_DURATIONS } from "./constants";
import { CoachInsightsScene } from "./scenes/coach-insights";
import { HexbinRevealScene } from "./scenes/hexbin-reveal";
import { MomentumScene } from "./scenes/momentum";
import { OutroScene } from "./scenes/outro";
import { ServePlacementScene } from "./scenes/serve-placement";
import { ShotPatternsScene } from "./scenes/shot-patterns";
import { ShotRainScene } from "./scenes/shot-rain";
import { ShotTrajectoriesScene } from "./scenes/shot-trajectories";
import { StatsSpotlightScene } from "./scenes/stats-spotlight";
import { TitleScene } from "./scenes/title";

export function MatchRecap() {
  return (
    <AbsoluteFill style={{ backgroundColor: theme.background }}>
      <AudioBed />
      <SFXWhoosh delay={SCENE_DURATIONS.title - 10} />
      <TransitionSeries>
        <TransitionSeries.Sequence durationInFrames={SCENE_DURATIONS.title}>
          <TitleScene />
        </TransitionSeries.Sequence>

        <TransitionSeries.Transition presentation={fade()} timing={FADE_TRANSITION} />

        <TransitionSeries.Sequence durationInFrames={SCENE_DURATIONS.shotRain}>
          <ShotRainScene />
        </TransitionSeries.Sequence>

        <TransitionSeries.Transition
          presentation={wipe({ direction: "from-right" })}
          timing={FADE_TRANSITION}
        />

        <TransitionSeries.Sequence durationInFrames={SCENE_DURATIONS.hexbinReveal}>
          <HexbinRevealScene />
        </TransitionSeries.Sequence>

        <TransitionSeries.Transition presentation={fade()} timing={FADE_TRANSITION} />

        <TransitionSeries.Sequence durationInFrames={SCENE_DURATIONS.shotTrajectories}>
          <ShotTrajectoriesScene />
        </TransitionSeries.Sequence>

        <TransitionSeries.Transition
          presentation={slide({ direction: "from-bottom" })}
          timing={FADE_TRANSITION}
        />

        <TransitionSeries.Sequence durationInFrames={SCENE_DURATIONS.servePlacement}>
          <ServePlacementScene />
        </TransitionSeries.Sequence>

        <TransitionSeries.Transition
          presentation={slide({ direction: "from-left" })}
          timing={FADE_TRANSITION}
        />

        <TransitionSeries.Sequence durationInFrames={SCENE_DURATIONS.shotPatterns}>
          <ShotPatternsScene />
        </TransitionSeries.Sequence>

        <TransitionSeries.Transition presentation={fade()} timing={FADE_TRANSITION} />

        <TransitionSeries.Sequence durationInFrames={SCENE_DURATIONS.statsSpotlight}>
          <StatsSpotlightScene />
        </TransitionSeries.Sequence>

        <TransitionSeries.Transition presentation={fade()} timing={FADE_TRANSITION} />

        <TransitionSeries.Sequence durationInFrames={SCENE_DURATIONS.coachInsights}>
          <CoachInsightsScene />
        </TransitionSeries.Sequence>

        <TransitionSeries.Transition presentation={fade()} timing={FADE_TRANSITION} />

        <TransitionSeries.Sequence durationInFrames={SCENE_DURATIONS.momentum}>
          <MomentumScene />
        </TransitionSeries.Sequence>

        <TransitionSeries.Transition presentation={fade()} timing={FADE_TRANSITION} />

        <TransitionSeries.Sequence durationInFrames={SCENE_DURATIONS.outro}>
          <OutroScene />
        </TransitionSeries.Sequence>
      </TransitionSeries>
    </AbsoluteFill>
  );
}
