import { boludaStory } from "./benchmark-viz";
import {
  HostHexbinFigure,
  MomentumFigure,
  ZoneComparisonFigure,
} from "./benchmark-viz";
import "./benchmark.css";

export function BenchmarkStoryPage() {
  return (
    <article className="benchmark-editorial">
      <header className="benchmark-masthead">
        <p className="benchmark-kicker">PPD Insights · Match Analysis</p>
        <h1>{boludaStory.title}</h1>
        <p className="benchmark-standfirst">{boludaStory.standfirst}</p>
        <div className="benchmark-meta">
          <span>{boludaStory.matchDate}</span>
          <span>{boludaStory.surface} court</span>
          <span>
            {boludaStory.hostName} def. {boludaStory.guestName} · {boludaStory.setScore}
          </span>
        </div>
      </header>

      <section aria-labelledby="metrics-heading" className="benchmark-metrics">
        <h2 className="visually-hidden" id="metrics-heading">
          Key metrics
        </h2>
        <div className="benchmark-metrics-grid">
          {boludaStory.headlineMetrics.map((m) => (
            <div className="benchmark-metric" key={m.label}>
              <span className="benchmark-metric-label">{m.label}</span>
              <span className="benchmark-metric-value">{m.value}</span>
              {m.context && <span className="benchmark-metric-context">{m.context}</span>}
            </div>
          ))}
        </div>
      </section>

      <section className="benchmark-section">
        <h2>The question</h2>
        <p className="benchmark-lede">{boludaStory.editorialQuestion}</p>
        <p>{boludaStory.insight}</p>
      </section>

      <section className="benchmark-figure-wrap">
        <HostHexbinFigure />
      </section>

      <section className="benchmark-section">
        <h2>Momentum and break points</h2>
        <p>
          With {boludaStory.frozenMetrics.totalBreakPoints} break points, the match turned on
          return-side swings more than first-serve percentage ({boludaStory.frozenMetrics.hostFirstServeInPct}%
          vs {boludaStory.frozenMetrics.guestFirstServeInPct}%).
        </p>
        <div className="benchmark-figure-wrap benchmark-figure-wrap--wide">
          <MomentumFigure />
        </div>
      </section>

      <section className="benchmark-section">
        <h2>Zone comparison</h2>
        <div className="benchmark-figure-wrap">
          <ZoneComparisonFigure />
        </div>
      </section>

      <section className="benchmark-coach">
        <h2>Coach interpretation</h2>
        <p>{boludaStory.coachInterpretation}</p>
      </section>

      <section className="benchmark-methodology">
        <h2>Methodology</h2>
        <p>
          Point winners and rally attribution use SwingVision shot↔point joins. Zone win rates
          require a minimum sample of eight tracked shots. Efficiency hexbins encode frequency
          (size) and win rate vs. corpus baseline (color).
        </p>
        <p className="benchmark-source">{boludaStory.source}</p>
      </section>

      <footer className="benchmark-cta">
        <a href="https://peakperformancedata.app">{boludaStory.cta}</a>
      </footer>
    </article>
  );
}
