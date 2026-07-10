import { boludaStory, ProductCourtInsight, useBenchmarkPlayerToggle } from "./benchmark-viz";
import "./benchmark.css";

export function BenchmarkAppPreviewPage() {
  const { player, setPlayer } = useBenchmarkPlayerToggle("host");
  const metric = boludaStory.headlineMetrics[1]!;

  return (
    <div className="benchmark-app-shell">
      <header className="benchmark-app-header">
        <p className="benchmark-app-eyebrow">Product preview · Tennis intelligence</p>
        <h1>{metric.label}</h1>
        <p className="benchmark-app-headline">
          {metric.value}
          <span className="benchmark-app-sub">{metric.context}</span>
        </p>
        <p className="benchmark-app-copy">{boludaStory.insight}</p>
      </header>

      <ProductCourtInsight onPlayerChange={setPlayer} player={player} />

      <aside className="benchmark-app-aside" aria-live="polite">
        <h2>Reading the map</h2>
        <ul>
          <li>Hex size = shot frequency in that court cell</li>
          <li>Color = win rate vs. match baseline (orange higher, blue lower)</li>
          <li>Toggle players with keyboard-focusable buttons above the chart</li>
        </ul>
        <p className="benchmark-source">{boludaStory.source}</p>
      </aside>
    </div>
  );
}
