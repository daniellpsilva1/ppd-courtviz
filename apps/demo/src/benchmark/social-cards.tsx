import { enrichedShots } from "@courtviz/data/fixtures";
import { boludaStory, editorialTheme } from "./benchmark-viz";
import { CourtSurface, FigureDocument, HexbinLayer, useCourtScales } from "@courtviz/react";
import { memo } from "react";

function SocialHexbin({ player }: { player: "host" | "guest" }) {
  const scales = useCourtScales();
  return (
    <HexbinLayer
      gridsize={6}
      half="full"
      player={player}
      scales={scales}
      shots={enrichedShots}
      theme={editorialTheme}
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
      theme={editorialTheme}
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
      theme={editorialTheme}
      title={boludaStory.title}
      width={1080}
    >
      <text
        fill={editorialTheme.inkMuted}
        fontFamily={`${editorialTheme.fonts.condensedFont}, ${editorialTheme.fonts.condensedFontFallback}`}
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
        fill={editorialTheme.playerHost}
        fontFamily={`${editorialTheme.fonts.condensedFont}, ${editorialTheme.fonts.condensedFontFallback}`}
        fontSize={36}
        fontWeight={700}
        x={60}
        y={860}
      >
        {boludaStory.frozenMetrics.hostTopZoneWinPct}% deuce-side win rate
      </text>
      <text
        fill={editorialTheme.inkMuted}
        fontFamily={`${editorialTheme.fonts.bodyFont}, ${editorialTheme.fonts.bodyFontFallback}`}
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
      theme={editorialTheme}
      title="Territorial advantage"
      width={1080}
    >
      <SocialCourt height={620} offsetX={230} offsetY={10} width={620} />
      <text
        fill={editorialTheme.ink}
        fontFamily={`${editorialTheme.fonts.bodyFont}, ${editorialTheme.fonts.bodyFontFallback}`}
        fontSize={16}
        x={60}
        y={720}
      >
        {boludaStory.socialCaption}
      </text>
    </FigureDocument>
  );
}
