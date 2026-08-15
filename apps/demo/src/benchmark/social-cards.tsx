import { computeZoneWinRates } from "@courtviz/core";
import { enrichedShots, momentumPoints } from "@courtviz/data/fixtures";
import { boludaStory } from "./benchmark-viz";
import { CourtSurface, FigureDocument, HexbinLayer, MomentumChart, useCourtScales, ZoneBarChart, type ZoneBarDatum } from "@courtviz/react";
import { getPlayerColor, ppdSocial } from "@courtviz/themes";
import { memo, useMemo } from "react";

const socialTheme = ppdSocial;

function SocialHexbin({ player }: { player: "host" | "guest" }) {
  const scales = useCourtScales();
  return (
    <HexbinLayer
      colorScale="efficiency"
      gridsize={6}
      half="full"
      player={player}
      scales={scales}
      shots={enrichedShots}
      theme={socialTheme}
    />
  );
}

const SocialCourt = memo(function SocialCourt({
  height,
  width,
  offsetX,
  offsetY,
}: {
  width: number;
  height: number;
  offsetX: number;
  offsetY: number;
}) {
  return (
    <CourtSurface
      height={height}
      idPrefix="social-court"
      offsetX={offsetX}
      offsetY={offsetY}
      surface={boludaStory.surface}
      theme={socialTheme}
      width={width}
    >
      <SocialHexbin player="host" />
    </CourtSurface>
  );
});

/** 4:5 Instagram / feed portrait (1080×1350) */
export function SocialPortraitCard() {
  return (
    <FigureDocument
      accessibleSummary={boludaStory.socialCaption}
      height={1350}
      id="social-4-5"
      source={boludaStory.source}
      subtitle={boludaStory.insight}
      theme={socialTheme}
      title={boludaStory.title}
      width={1080}
    >
      <text
        fill={socialTheme.inkMuted}
        fontFamily={`${socialTheme.fonts.condensedFont}, ${socialTheme.fonts.condensedFontFallback}`}
        fontSize={14}
        fontWeight={700}
        letterSpacing={3}
        x={60}
        y={-8}
      >
        PPD INSIGHTS
      </text>
      <SocialCourt height={780} offsetX={150} offsetY={20} width={780} />
      <text
        fill={socialTheme.playerHost}
        fontFamily={`${socialTheme.fonts.condensedFont}, ${socialTheme.fonts.condensedFontFallback}`}
        fontSize={36}
        fontWeight={700}
        x={60}
        y={860}
      >
        {boludaStory.frozenMetrics.hostTopZoneWinPct}% deuce-side win rate
      </text>
      <text
        fill={socialTheme.inkMuted}
        fontFamily={`${socialTheme.fonts.bodyFont}, ${socialTheme.fonts.bodyFontFallback}`}
        fontSize={18}
        x={60}
        y={900}
      >
        {boludaStory.hostName} def. {boludaStory.guestName} · {boludaStory.setScore}
      </text>
    </FigureDocument>
  );
}

/** 1:1 carousel / X card (1080×1080) */
export function SocialSquareCard() {
  return (
    <FigureDocument
      accessibleSummary={boludaStory.socialCaption}
      height={1080}
      id="social-1-1"
      source={boludaStory.source}
      subtitle={`${boludaStory.hostName} ${boludaStory.setScore}`}
      theme={socialTheme}
      title="Territorial advantage"
      width={1080}
    >
      <SocialCourt height={620} offsetX={230} offsetY={10} width={620} />
      <text
        fill={socialTheme.ink}
        fontFamily={`${socialTheme.fonts.bodyFont}, ${socialTheme.fonts.bodyFontFallback}`}
        fontSize={16}
        x={60}
        y={720}
      >
        {boludaStory.socialCaption}
      </text>
    </FigureDocument>
  );
}

/** 9:16 Instagram Story (1080×1920) — safe-area aware for story UI overlays */
export function SocialStoryCard() {
  const safeTop = 220;
  const safeBottom = 340;

  return (
    <FigureDocument
      accessibleSummary={boludaStory.socialCaption}
      height={1920}
      id="social-9-16"
      source={boludaStory.source}
      subtitle={boludaStory.insight}
      theme={socialTheme}
      title={boludaStory.title}
      width={1080}
    >
      <text
        fill={socialTheme.inkMuted}
        fontFamily={`${socialTheme.fonts.condensedFont}, ${socialTheme.fonts.condensedFontFallback}`}
        fontSize={16}
        fontWeight={700}
        letterSpacing={4}
        x={60}
        y={safeTop - 20}
      >
        PPD INSIGHTS
      </text>
      <SocialCourt height={700} offsetX={190} offsetY={safeTop + 40} width={700} />
      <text
        fill={socialTheme.playerHost}
        fontFamily={`${socialTheme.fonts.condensedFont}, ${socialTheme.fonts.condensedFontFallback}`}
        fontSize={48}
        fontWeight={700}
        x={60}
        y={safeTop + 800}
      >
        {boludaStory.frozenMetrics.hostTopZoneWinPct}%
      </text>
      <text
        fill={socialTheme.ink}
        fontFamily={`${socialTheme.fonts.condensedFont}, ${socialTheme.fonts.condensedFontFallback}`}
        fontSize={28}
        fontWeight={600}
        x={60}
        y={safeTop + 850}
      >
        deuce-side win rate
      </text>
      <text
        fill={socialTheme.inkMuted}
        fontFamily={`${socialTheme.fonts.bodyFont}, ${socialTheme.fonts.bodyFontFallback}`}
        fontSize={22}
        x={60}
        y={safeTop + 910}
      >
        {boludaStory.hostName} def. {boludaStory.guestName} · {boludaStory.setScore}
      </text>
      <text
        fill={socialTheme.inkMuted}
        fontFamily={`${socialTheme.fonts.bodyFont}, ${socialTheme.fonts.bodyFontFallback}`}
        fontSize={18}
        x={60}
        y={safeTop + 960}
      >
        {boludaStory.socialCaption}
      </text>
      <text
        fill={socialTheme.inkMuted}
        fontFamily={`${socialTheme.fonts.bodyFont}, ${socialTheme.fonts.bodyFontFallback}`}
        fontSize={14}
        opacity={0.6}
        textAnchor="end"
        x={1020}
        y={1920 - safeBottom + 20}
      >
        {boludaStory.source}
      </text>
    </FigureDocument>
  );
}

/** Carousel slide with pagination indicator (1080×1080) */
export function SocialCarouselCard({
  slideIndex = 0,
  slideCount = 4,
}: {
  slideIndex?: number;
  slideCount?: number;
}) {
  const titles = ["Court Dominance", "Momentum Shifts", "Key Stats", "Takeaways"];
  const subtitles = [
    "Hexbin efficiency map",
    "Cumulative point differential",
    "Head-to-head comparison",
    "Actionable insights",
  ];
  const title = titles[slideIndex] ?? titles[0]!;
  const subtitle = subtitles[slideIndex] ?? subtitles[0]!;

  const zoneData = useMemo(() => {
    const hostZones = computeZoneWinRates(enrichedShots, "host")
      .filter((z) => z.total >= 8 && z.winRate !== null)
      .sort((a, b) => (b.winRate ?? 0) - (a.winRate ?? 0))
      .slice(0, 4);
    const guestZones = computeZoneWinRates(enrichedShots, "guest")
      .filter((z) => z.total >= 8 && z.winRate !== null)
      .sort((a, b) => (b.winRate ?? 0) - (a.winRate ?? 0))
      .slice(0, 3);
    const rows: ZoneBarDatum[] = [
      ...hostZones.map((z) => ({
        zone: z.zone,
        winRate: z.winRate,
        total: z.total,
        playerLabel: "host",
        color: getPlayerColor("host", socialTheme),
      })),
      ...guestZones.map((z) => ({
        zone: z.zone,
        winRate: z.winRate,
        total: z.total,
        playerLabel: "guest",
        color: getPlayerColor("guest", socialTheme),
      })),
    ];
    return rows;
  }, []);

  return (
    <FigureDocument
      accessibleSummary={boludaStory.socialCaption}
      height={1080}
      id={`carousel-${slideIndex}`}
      source={boludaStory.source}
      subtitle={subtitle}
      theme={socialTheme}
      title={title}
      width={1080}
    >
      {slideIndex === 0 && <SocialCourt height={620} offsetX={230} offsetY={10} width={620} />}
      {slideIndex === 1 && (
        <g transform="translate(40 10)">
          <MomentumChart
            accessibleSummary="Momentum shifts across sets showing cumulative point differential"
            height={620}
            hostPlayer="host"
            points={momentumPoints}
            showBreakPoints
            showSetBoundaries
            showSetLabels
            theme={socialTheme}
            width={1000}
          />
        </g>
      )}
      {slideIndex === 2 && (
        <g transform="translate(60 10)">
          <ZoneBarChart data={zoneData} height={620} theme={socialTheme} width={960} />
        </g>
      )}
      {slideIndex === 3 && (
        <text
          fill={socialTheme.ink}
          fontFamily={`${socialTheme.fonts.bodyFont}, ${socialTheme.fonts.bodyFontFallback}`}
          fontSize={20}
          x={60}
          y={40}
        >
          {boludaStory.insight}
        </text>
      )}
      {/* Pagination dots */}
      <g transform={`translate(${1080 / 2 - (slideCount * 20) / 2}, 1000)`}>
        {Array.from({ length: slideCount }).map((_, i) => (
          <circle
            cx={i * 20 + 6}
            cy={0}
            fill={i === slideIndex ? socialTheme.playerHost : socialTheme.inkMuted}
            key={i}
            opacity={i === slideIndex ? 1 : 0.4}
            r={5}
          />
        ))}
      </g>
    </FigureDocument>
  );
}

/** Stat Highlight card (1080×1080) — single big number */
export function SocialStatHighlightCard({
  label = "Break Point Conversion",
  playerColor,
  playerName,
  statValue = "67%",
  subtitle,
}: {
  label?: string;
  playerColor?: string;
  playerName?: string;
  statValue?: string;
  subtitle?: string;
}) {
  const color = playerColor ?? socialTheme.playerHost ?? socialTheme.ink;
  const name = playerName ?? boludaStory.hostName;
  const sub = subtitle ?? `${boludaStory.hostName} def. ${boludaStory.guestName} · ${boludaStory.setScore}`;

  return (
    <FigureDocument
      accessibleSummary={`${label}: ${statValue} for ${name}`}
      height={1080}
      id="stat-highlight"
      source={boludaStory.source}
      subtitle={sub}
      theme={socialTheme}
      width={1080}
    >
      <text
        fill={socialTheme.inkMuted}
        fontFamily={`${socialTheme.fonts.condensedFont}, ${socialTheme.fonts.condensedFontFallback}`}
        fontSize={18}
        fontWeight={700}
        letterSpacing={4}
        textAnchor="middle"
        x={540}
        y={120}
      >
        {label.toUpperCase()}
      </text>
      <text
        fill={color}
        fontFamily={`${socialTheme.fonts.condensedFont}, ${socialTheme.fonts.condensedFontFallback}`}
        fontSize={180}
        fontWeight={700}
        textAnchor="middle"
        x={540}
        y={420}
      >
        {statValue}
      </text>
      <text
        fill={socialTheme.ink}
        fontFamily={`${socialTheme.fonts.bodyFont}, ${socialTheme.fonts.bodyFontFallback}`}
        fontSize={28}
        textAnchor="middle"
        x={540}
        y={480}
      >
        {name}
      </text>
    </FigureDocument>
  );
}
