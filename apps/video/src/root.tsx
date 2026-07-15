import { Composition } from "remotion";
import { FPS, HEIGHT, TOTAL_DURATION, WIDTH } from "./constants";
import { CourtHero3D } from "./scenes/court-hero-3d";
import { MatchRecap } from "./match-recap";
import { MatchRecapSocial } from "./match-recap-social";
import {
  SOCIAL_FPS,
  SOCIAL_HEIGHT,
  SOCIAL_TOTAL_DURATION,
  SOCIAL_WIDTH,
} from "./social-constants";
import {
  BENCHMARK_FPS,
  BENCHMARK_HEIGHT,
  BENCHMARK_WIDTH,
} from "./benchmark-constants";
import { BenchmarkStorySocial, BENCHMARK_TOTAL_DURATION } from "./benchmark-recap-social";

export function RemotionRoot() {
  return (
    <>
      <Composition
        component={MatchRecap}
        durationInFrames={TOTAL_DURATION}
        fps={FPS}
        height={HEIGHT}
        id="MatchRecap"
        width={WIDTH}
      />
      <Composition
        component={MatchRecapSocial}
        durationInFrames={SOCIAL_TOTAL_DURATION}
        fps={SOCIAL_FPS}
        height={SOCIAL_HEIGHT}
        id="MatchRecapSocial"
        width={SOCIAL_WIDTH}
      />
      <Composition
        component={BenchmarkStorySocial}
        durationInFrames={BENCHMARK_TOTAL_DURATION}
        fps={BENCHMARK_FPS}
        height={BENCHMARK_HEIGHT}
        id="BenchmarkStorySocial"
        width={BENCHMARK_WIDTH}
      />
      <Composition
        component={CourtHero3D}
        durationInFrames={120}
        fps={FPS}
        height={HEIGHT}
        id="CourtHero3D"
        width={WIDTH}
      />
    </>
  );
}
