import { computeZoneWinRates } from "@courtviz/core";
import { enrichedShots, momentumPoints } from "@courtviz/data/fixtures";
import {
  buildBoludaStory,
  toCourtvizTheme,
  type BenchmarkStory,
} from "@ppd/brand";
import {
  CourtSurface,
  FigureDocument,
  HexbinLayer,
  MomentumChart,
  useCourtScales,
  ZoneBarChart,
  type ZoneBarDatum,
} from "@courtviz/react";
import { getPlayerColor } from "@courtviz/themes";
import { memo, useMemo, useState } from "react";

export const boludaStory: BenchmarkStory = buildBoludaStory();
export const editorialTheme = toCourtvizTheme("editorial");
export const productTheme = toCourtvizTheme("product");

function HexbinOverlay({
  player,
  theme,
}: {
  player: "host" | "guest";
  theme: ReturnType<typeof toCourtvizTheme>;
}) {
  const scales = useCourtScales();
  return (
    <HexbinLayer
      colorScale="efficiency"
      gridsize={6}
      half="full"
      player={player}
      scales={scales}
      shots={enrichedShots}
      theme={theme}
    />
  );
}

export const HostHexbinFigure = memo(function HostHexbinFigure({
  courtHeight = 520,
  courtWidth = 520,
  figureHeight = 640,
  figureWidth = 900,
}: {
  courtWidth?: number;
  courtHeight?: number;
  figureWidth?: number;
  figureHeight?: number;
}) {
  const chart = boludaStory.charts.find((c) => c.id === "host-hexbin")!;
  return (
    <FigureDocument
      accessibleSummary={chart.annotation}
      height={figureHeight}
      id="host-hexbin"
      source={boludaStory.source}
      subtitle={chart.annotation}
      theme={editorialTheme}
      title={chart.title}
      width={figureWidth}
    >
      <CourtSurface
        height={courtHeight}
        idPrefix="host-hexbin"
        offsetX={(figureWidth - courtWidth) / 2}
        surface={boludaStory.surface}
        theme={editorialTheme}
        width={courtWidth}
      >
        <HexbinOverlay player="host" theme={editorialTheme} />
      </CourtSurface>
    </FigureDocument>
  );
});

export const MomentumFigure = memo(function MomentumFigure({
  width = 820,
  height = 280,
}: {
  width?: number;
  height?: number;
}) {
  const chart = boludaStory.charts.find((c) => c.id === "momentum")!;
  return (
    <FigureDocument
      accessibleSummary={chart.annotation}
      height={height + 120}
      id="momentum"
      source={boludaStory.source}
      subtitle={chart.annotation}
      theme={editorialTheme}
      title={chart.title}
      width={width + 80}
    >
      <g transform="translate(40 8)">
        <MomentumChart
          height={height}
          hostPlayer="host"
          points={momentumPoints}
          theme={editorialTheme}
          width={width}
        />
      </g>
    </FigureDocument>
  );
});

export const ZoneComparisonFigure = memo(function ZoneComparisonFigure() {
  const chart = boludaStory.charts.find((c) => c.id === "zone-comparison")!;
  const zoneData = useMemo(() => {
    const hostZones = computeZoneWinRates(enrichedShots, "host")
      .filter((z) => z.total >= 8)
      .sort((a, b) => b.winRate - a.winRate)
      .slice(0, 4);
    const guestZones = computeZoneWinRates(enrichedShots, "guest")
      .filter((z) => z.total >= 8)
      .sort((a, b) => b.winRate - a.winRate)
      .slice(0, 3);
    const rows: ZoneBarDatum[] = [
      ...hostZones.map((z) => ({
        zone: z.zone,
        winRate: z.winRate,
        total: z.total,
        playerLabel: "host",
        color: getPlayerColor("host", editorialTheme),
      })),
      ...guestZones.map((z) => ({
        zone: z.zone,
        winRate: z.winRate,
        total: z.total,
        playerLabel: "guest",
        color: getPlayerColor("guest", editorialTheme),
      })),
    ];
    return rows;
  }, []);

  return (
    <FigureDocument
      accessibleSummary={chart.annotation}
      height={360}
      id="zone-bar"
      source={boludaStory.source}
      subtitle={chart.annotation}
      theme={editorialTheme}
      title={chart.title}
      width={640}
    >
      <g transform="translate(40 16)">
        <ZoneBarChart data={zoneData} height={240} theme={editorialTheme} width={560} />
      </g>
    </FigureDocument>
  );
});

export function ProductCourtInsight({
  player,
  onPlayerChange,
}: {
  player: "host" | "guest";
  onPlayerChange: (p: "host" | "guest") => void;
}) {
  return (
    <div className="benchmark-app-card">
      <div className="benchmark-app-toolbar" role="toolbar" aria-label="Player filter">
        {(["host", "guest"] as const).map((p) => (
          <button
            aria-pressed={player === p}
            className={player === p ? "active" : ""}
            key={p}
            onClick={() => onPlayerChange(p)}
            type="button"
          >
            {p === "host" ? boludaStory.hostName : boludaStory.guestName}
          </button>
        ))}
      </div>
      <FigureDocument
        accessibleSummary={boludaStory.accessibleSummary}
        background={productTheme.background}
        height={420}
        id="app-insight"
        source={boludaStory.source}
        subtitle={`${player === "host" ? boludaStory.hostName : boludaStory.guestName} · efficiency map`}
        theme={productTheme}
        title="Territorial efficiency"
        width={420}
      >
        <CourtSurface
          height={320}
          idPrefix="app-insight"
          offsetX={50}
          surface={boludaStory.surface}
          theme={productTheme}
          width={320}
        >
          <HexbinOverlay player={player} theme={productTheme} />
        </CourtSurface>
      </FigureDocument>
    </div>
  );
}

export function useBenchmarkPlayerToggle(defaultPlayer: "host" | "guest" = "host") {
  const [player, setPlayer] = useState(defaultPlayer);
  return { player, setPlayer };
}
