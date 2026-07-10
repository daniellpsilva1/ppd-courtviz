import { TransitionSeries } from "@remotion/transitions";
import { fade } from "@remotion/transitions/fade";
import { AbsoluteFill } from "remotion";
import {
  BENCHMARK_DURATIONS,
  BENCHMARK_TOTAL_DURATION,
  BENCHMARK_TRANSITION,
} from "./benchmark-constants";
import { BenchmarkHookScene } from "./scenes/benchmark-hook";
import { BenchmarkHexbinScene } from "./scenes/benchmark-hexbin";
import { BenchmarkInsightScene } from "./scenes/benchmark-insight";
import { BenchmarkOutroScene } from "./scenes/benchmark-outro";

export function BenchmarkStorySocial() {
  return (
    <AbsoluteFill style={{ backgroundColor: "#0E1117" }}>
      <TransitionSeries>
        <TransitionSeries.Sequence durationInFrames={BENCHMARK_DURATIONS.hook}>
          <BenchmarkHookScene />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={fade()} timing={BENCHMARK_TRANSITION} />
        <TransitionSeries.Sequence durationInFrames={BENCHMARK_DURATIONS.hexbin}>
          <BenchmarkHexbinScene />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={fade()} timing={BENCHMARK_TRANSITION} />
        <TransitionSeries.Sequence durationInFrames={BENCHMARK_DURATIONS.insight}>
          <BenchmarkInsightScene />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={fade()} timing={BENCHMARK_TRANSITION} />
        <TransitionSeries.Sequence durationInFrames={BENCHMARK_DURATIONS.outro}>
          <BenchmarkOutroScene />
        </TransitionSeries.Sequence>
      </TransitionSeries>
    </AbsoluteFill>
  );
}

export { BENCHMARK_TOTAL_DURATION };
