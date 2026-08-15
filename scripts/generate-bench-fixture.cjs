/**
 * Generate frozen bench-landing.json fixture from match data.
 *
 * Defaults to Boluda demo data; supports --matchId (Supabase) or --cache (JSON)
 * for per-match fixture generation.
 */

const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const demoNodeModules = path.resolve(__dirname, "..", "apps", "demo", "node_modules");
const rootNodeModules = path.resolve(__dirname, "..", "node_modules");
module.paths = [demoNodeModules, rootNodeModules, ...(module.paths || [])];

const {
  enrichShots,
  extractPointsForMomentum,
  getOfficialStatValue,
  match: boludaMatch,
  points: boludaPoints,
  sets: boludaSets,
  shots: boludaShots,
  stats: boludaStats,
  guestName: boludaGuestName,
  hostName: boludaHostName,
  matchDate: boludaMatchDate,
  surface: boludaSurface,
} = require("@courtviz/data");

const { loadMatchContext } = require("./load-match-data.cjs");

const {
  computePointsWonRate,
  computeFirstServeInRate,
  computeBreakPointConversion,
  computeRallyBucketStats,
  computeZoneWinRates,
  computePatternStats,
  MIN_SAMPLE,
} = require("@courtviz/core");

const MIN_SERVE_SPEED_KMH = 40;
const MAX_SERVE_SPEED_KMH = 215;
const NET_Y = 11.885;
const DEPTH_DEEP_MIN_M = 8.5;
const DEPTH_SHORT_MAX_M = 6.4;

function isPlausibleServeSpeed(speed) {
  return speed >= MIN_SERVE_SPEED_KMH && speed <= MAX_SERVE_SPEED_KMH;
}

function filterPlausibleServeSpeeds(speeds) {
  const plausible = speeds.filter(isPlausibleServeSpeed);
  if (plausible.length >= 3) return plausible;
  const sorted = [...speeds].sort((a, b) => a - b);
  const q1 = sorted[Math.floor(sorted.length * 0.25)] ?? 0;
  const q3 = sorted[Math.floor(sorted.length * 0.75)] ?? 0;
  const iqrCap = q3 + 1.5 * (q3 - q1);
  return speeds.filter(
    (speed) => speed > 0 && speed <= Math.min(MAX_SERVE_SPEED_KMH, iqrCap || MAX_SERVE_SPEED_KMH),
  );
}

function pctValue(rate) {
  if (rate == null || Number.isNaN(rate)) return "—";
  return `${Math.round(rate * 1000) / 10}%`;
}

function pctFromCount(won, total) {
  if (!total) return null;
  return Math.round((won / total) * 1000) / 10;
}

function resolvePlayerName(summary, player) {
  if (player === "host") return summary.hostName;
  if (player === "guest") return summary.guestName;
  return player ?? "Player";
}

function resolveServeType(type) {
  if (!type) return "other";
  const normalized = type.toLowerCase();
  if (normalized.includes("first")) return "first";
  if (normalized.includes("second")) return "second";
  return "other";
}

function formatMatchLabel(summary) {
  return `${summary.hostName} vs ${summary.guestName}`;
}

function computeDominantSurface(matches) {
  const counts = new Map();
  for (const m of matches) {
    const key = m.surface ?? "unknown";
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  return [...counts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? "hard";
}

function toShotPreview(enrichedShotsData) {
  return enrichedShotsData.map((shot) => ({
    bounce_depth: shot.bounceDepth ?? null,
    bounce_side: shot.bounceSide ?? null,
    bounce_x: shot.bounceX ?? null,
    bounce_y: shot.bounceY ?? null,
    bounce_zone: shot.bounceZone ?? null,
    direction: shot.direction ?? null,
    ended_by: shot.endedBy ?? null,
    game_number: shot.gameNumber,
    hit_depth: shot.hitDepth ?? null,
    hit_side: shot.hitSide ?? null,
    hit_x: shot.hitX ?? null,
    hit_y: shot.hitY ?? null,
    hit_z: shot.hitZ ?? null,
    hit_zone: shot.hitZone ?? null,
    id: `${shot.setNumber}-${shot.gameNumber}-${shot.pointNumber}-${shot.shotNumber}`,
    is_break_point: shot.isBreakPoint ?? false,
    is_match_point: shot.isMatchPoint ?? false,
    is_set_point: shot.isSetPoint ?? false,
    is_terminal: shot.isTerminal ?? false,
    player: shot.player,
    point_number: shot.pointNumber,
    point_winner: shot.pointWinner ?? null,
    rally_length: shot.rallyLength ?? null,
    result: shot.result ?? null,
    set_number: shot.setNumber,
    shot_number: shot.shotNumber,
    speed_kmh: shot.speedKmh ?? null,
    spin: shot.spin ?? null,
    stroke: shot.stroke ?? null,
    type: shot.type ?? null,
  }));
}

function shotAccuracyForPlayer(playerShots) {
  if (!playerShots.length) return null;
  const inCount = playerShots.filter((s) => s.result === "In").length;
  return Math.round((inCount / playerShots.length) * 1000) / 10;
}

function avgNonServeSpeed(playerShots) {
  const speeds = playerShots
    .filter((s) => s.stroke !== "Serve" && s.speedKmh != null && s.speedKmh > 0)
    .map((s) => s.speedKmh);
  if (!speeds.length) return null;
  return Math.round(speeds.reduce((a, b) => a + b, 0) / speeds.length);
}

function normalizeDirection(direction) {
  const normalized = direction?.trim().toLowerCase() ?? "";
  const map = {
    "cross court": "crosscourt",
    crosscourt: "crosscourt",
    "down the line": "downTheLine",
    "down the t": "downTheT",
    "inside in": "insideIn",
    "inside out": "insideOut",
    middle: "middle",
    "out wide": "outWide",
  };
  return map[normalized] ?? "unknown";
}

function computeDepthAggression(enrichedShotsData, player) {
  let deep = 0;
  let mid = 0;
  let short = 0;
  let depthTotal = 0;
  let io = 0;
  let ii = 0;
  let cc = 0;
  let dl = 0;
  let dirTotal = 0;

  for (const s of enrichedShotsData) {
    if (s.player !== player) continue;
    const stroke = (s.stroke || "").toLowerCase();
    if (stroke && stroke !== "serve" && stroke !== "feed" && s.result === "In" && s.bounceY != null) {
      const d = Math.abs(s.bounceY - NET_Y);
      depthTotal++;
      if (d >= DEPTH_DEEP_MIN_M) deep++;
      else if (d <= DEPTH_SHORT_MAX_M) short++;
      else mid++;
    }
    if (stroke.includes("forehand") || stroke.includes("backhand")) {
      const dir = normalizeDirection(s.direction);
      if (dir === "unknown") continue;
      dirTotal++;
      if (dir === "crosscourt") cc++;
      else if (dir === "downTheLine" || dir === "downTheT") dl++;
      else if (dir === "insideOut") io++;
      else if (dir === "insideIn") ii++;
    }
  }

  return {
    aggressionPct: dirTotal > 0 ? Math.round(((io + ii) / dirTotal) * 100) : 0,
    ccCount: cc,
    ccDlRatio: dl > 0 ? Math.round((cc / dl) * 100) / 100 : null,
    deep,
    deepPct: depthTotal > 0 ? Math.round((deep / depthTotal) * 100) : 0,
    dlCount: dl,
    insideIn: ii,
    insideOut: io,
    mid,
    midPct: depthTotal > 0 ? Math.round((mid / depthTotal) * 100) : 0,
    short,
    shortPct: depthTotal > 0 ? Math.round((short / depthTotal) * 100) : 0,
    totalDepth: depthTotal,
    totalDirection: dirTotal,
  };
}

function serializeRate(rate) {
  return {
    rate: rate?.rate ?? null,
    total: rate?.total ?? 0,
    won: rate?.won ?? 0,
  };
}

function serializeRallyBuckets(buckets) {
  return buckets.map((b) => ({
    bucket: b.bucket,
    total: b.total,
    winRate: b.winRate,
    won: b.won,
  }));
}

function serializeZoneWinRates(zones) {
  return zones.map((z) => ({
    total: z.total,
    winRate: z.winRate,
    won: z.won,
    zone: z.zone,
  }));
}

function serializePatternStats(pattern) {
  return {
    firstStrike: serializeRate(pattern.firstStrike),
    returnInPlay: serializeRate(pattern.returnInPlay),
    servePlusOne: (pattern.servePlusOne || []).map((row) => ({
      stroke: row.stroke,
      total: row.total,
      winRate: row.winRate,
      won: row.won,
    })),
  };
}

function computeWinnersErrors(officialStats, player) {
  const fhW = getOfficialStatValue(officialStats, player, "Forehand Winners") ?? 0;
  const bhW = getOfficialStatValue(officialStats, player, "Backhand Winners") ?? 0;
  const sw = getOfficialStatValue(officialStats, player, "Service Winners") ?? 0;
  const fhUe = getOfficialStatValue(officialStats, player, "Forehand Unforced Errors") ?? 0;
  const bhUe = getOfficialStatValue(officialStats, player, "Backhand Unforced Errors") ?? 0;
  const winners = fhW + bhW + sw;
  const unforced = fhUe + bhUe;
  return {
    backhandUnforced: bhUe,
    backhandWinners: bhW,
    forehandUnforced: fhUe,
    forehandWinners: fhW,
    ratio: unforced > 0 ? Math.round((winners / unforced) * 100) / 100 : winners > 0 ? winners : null,
    serviceWinners: sw,
    unforced,
    winners,
  };
}

function officialMatchStats(officialStats) {
  return officialStats
    .filter((row) => row.setNumber === 0)
    .map((row) => ({
      player: row.player,
      set_number: row.setNumber,
      stat_name: row.statName,
      stat_value: row.statValue,
    }));
}

function computeBenchRecords(summary, enrichedShotsData, momentumPts) {
  let fastestServe = null;
  let longestRally = null;
  let bestBreakConv = null;
  let topPointsWon = null;

  const matchLabel = formatMatchLabel(summary);

  const serveSpeeds = shots
    .filter((s) => s.stroke === "Serve" && s.speedKmh != null)
    .map((s) => s.speedKmh);
  const plausibleSpeeds = filterPlausibleServeSpeeds(serveSpeeds);

  for (const shot of shots) {
    if (shot.stroke !== "Serve" || shot.speedKmh == null) continue;
    if (!plausibleSpeeds.includes(shot.speedKmh)) continue;
    if (!fastestServe || shot.speedKmh > fastestServe.valueNumeric) {
      fastestServe = {
        labelKey: "fastestServe",
        matchLabel,
        playerName: resolvePlayerName(summary, shot.player),
        playerSide: shot.player,
        serveType: resolveServeType(shot.type),
        slug: summary.slug,
        value: String(Math.round(shot.speedKmh)),
        valueNumeric: shot.speedKmh,
        bounceX: shot.bounceX ?? null,
        bounceY: shot.bounceY ?? null,
        setNumber: shot.setNumber,
        gameNumber: shot.gameNumber,
        pointNumber: shot.pointNumber,
        shotNumber: shot.shotNumber,
      };
    }
  }

  const rallyByPoint = new Map();
  for (const shot of shots) {
    const key = `${shot.setNumber}-${shot.gameNumber}-${shot.pointNumber}`;
    rallyByPoint.set(key, Math.max(rallyByPoint.get(key) ?? 0, shot.shotNumber));
  }
  for (const [key, rallyLength] of rallyByPoint) {
    if (!longestRally || rallyLength > longestRally.valueNumeric) {
      const [setNumber, gameNumber, pointNumber] = key.split("-");
      longestRally = {
        labelKey: "longestRally",
        matchLabel,
        rallyGame: Number(gameNumber),
        rallyPoint: Number(pointNumber),
        rallySet: Number(setNumber),
        slug: summary.slug,
        value: String(rallyLength),
        valueNumeric: rallyLength,
      };
    }
  }

  for (const player of ["host", "guest"]) {
    const playerName = resolvePlayerName(summary, player);
    const pointsRate = computePointsWonRate(momentumPts, player);
    const pointsPct = (pointsRate.rate ?? 0) * 100;
    if (pointsRate.total > 0 && (!topPointsWon || pointsPct > topPointsWon.valueNumeric)) {
      topPointsWon = {
        context: summary.setScore,
        labelKey: "topPointsWon",
        matchLabel,
        playerName,
        playerSide: player,
        slug: summary.slug,
        value: pctValue(pointsRate.rate),
        valueNumeric: pointsPct,
      };
    }

    const breakRate = computeBreakPointConversion(enrichedShotsData, player);
    const breakPct = (breakRate.rate ?? 0) * 100;
    if (breakRate.total > 0 && (!bestBreakConv || breakPct > bestBreakConv.valueNumeric)) {
      bestBreakConv = {
        context: summary.setScore,
        labelKey: "bestBreakConv",
        matchLabel,
        playerName,
        playerSide: player,
        slug: summary.slug,
        value: pctValue(breakRate.rate),
        valueNumeric: breakPct,
        total: breakRate.total,
        won: breakRate.won,
      };
    }
  }

  return [fastestServe, longestRally, bestBreakConv, topPointsWon].filter((r) => r != null);
}

function parseArg(prefix) {
  const arg = process.argv.find((a) => a.startsWith(`${prefix}=`));
  return arg ? arg.split("=").slice(1).join("=") : undefined;
}

async function main() {
  const matchId = parseArg("--matchId");
  const cachePath = parseArg("--cache");
  const outArg = parseArg("--out");

  let ctx;
  if (matchId || cachePath) {
    ctx = await loadMatchContext();
  } else {
    ctx = {
      enrichedShots: enrichShots(boludaShots, boludaPoints),
      guestName: boludaGuestName,
      hostName: boludaHostName,
      matchDate: boludaMatchDate,
      matchId: boludaMatch.id,
      momentumPoints: extractPointsForMomentum(boludaPoints),
      points: boludaPoints,
      sets: boludaSets,
      shots: boludaShots,
      stats: boludaStats ?? [],
      surface: boludaSurface,
      usingFixture: true,
    };
  }

  const {
    enrichedShots: ctxEnrichedShots,
    guestName,
    hostName,
    matchDate,
    matchId: ctxMatchId,
    momentumPoints: ctxMomentumPoints,
    points,
    sets,
    shots,
    stats,
    surface,
  } = ctx;

  const setScore = sets.map((s) => `${s.hostScore}-${s.guestScore}`).join(" · ");
  const hostSetsWon = sets.filter((s) => s.hostScore > s.guestScore).length;
  const guestSetsWon = sets.filter((s) => s.guestScore > s.hostScore).length;

  const enrichedShotsData = ctxEnrichedShots ?? enrichShots(shots, points);
  const momentumPts = ctxMomentumPoints ?? extractPointsForMomentum(points);
  const shotPreview = toShotPreview(enrichedShotsData);

  const hostPointsRate = computePointsWonRate(momentumPts, "host");
  const guestPointsRate = computePointsWonRate(momentumPts, "guest");
  const hostFirstServe = computeFirstServeInRate(enrichedShotsData, "host");
  const guestFirstServe = computeFirstServeInRate(enrichedShotsData, "guest");
  const hostBreak = computeBreakPointConversion(enrichedShotsData, "host");
  const guestBreak = computeBreakPointConversion(enrichedShotsData, "guest");

  const hostShots = shots.filter((s) => s.player === "host");
  const guestShots = shots.filter((s) => s.player === "guest");
  const hostAccuracy = shotAccuracyForPlayer(hostShots);
  const guestAccuracy = shotAccuracyForPlayer(guestShots);
  const hostAvgSpeed = avgNonServeSpeed(hostShots);
  const guestAvgSpeed = avgNonServeSpeed(guestShots);

  const plausibleServeSpeeds = filterPlausibleServeSpeeds(
    shots.filter((s) => s.stroke === "Serve" && s.speedKmh != null).map((s) => s.speedKmh),
  );
  const avgServeSpeed = plausibleServeSpeeds.length
    ? Math.round(plausibleServeSpeeds.reduce((a, b) => a + b, 0) / plausibleServeSpeeds.length)
    : 0;
  const serveCount = shots.filter((s) => s.stroke === "Serve").length;
  const nonServeShots = shots.filter((s) => s.stroke !== "Serve");
  const shotSpeeds = nonServeShots.map((s) => s.speedKmh).filter((v) => v != null && v > 0);
  const avgShotSpeed = shotSpeeds.length
    ? Math.round(shotSpeeds.reduce((a, b) => a + b, 0) / shotSpeeds.length)
    : 0;
  const inCount = shots.filter((s) => s.result === "In").length;
  const shotAccuracyPct = shots.length ? Math.round((inCount / shots.length) * 1000) / 10 : 0;

  const duelStats = [
    {
      key: "points_won",
      label: "Points won",
      host: pctFromCount(hostPointsRate.won, hostPointsRate.total),
      guest: pctFromCount(guestPointsRate.won, guestPointsRate.total),
      hostWon: hostPointsRate.won,
      hostTotal: hostPointsRate.total,
      guestWon: guestPointsRate.won,
      guestTotal: guestPointsRate.total,
      unit: "%",
    },
    {
      key: "first_serve",
      label: "1st serve in",
      host: pctFromCount(hostFirstServe.won, hostFirstServe.total),
      guest: pctFromCount(guestFirstServe.won, guestFirstServe.total),
      hostWon: hostFirstServe.won,
      hostTotal: hostFirstServe.total,
      guestWon: guestFirstServe.won,
      guestTotal: guestFirstServe.total,
      unit: "%",
    },
    {
      key: "break_conv",
      label: "Break points",
      host: hostBreak.rate != null ? pctFromCount(hostBreak.won, hostBreak.total) : null,
      guest: guestBreak.rate != null ? pctFromCount(guestBreak.won, guestBreak.total) : null,
      hostWon: hostBreak.won,
      hostTotal: hostBreak.total,
      guestWon: guestBreak.won,
      guestTotal: guestBreak.total,
      unit: "%",
    },
    {
      key: "shot_accuracy",
      label: "Shot accuracy",
      host: hostAccuracy,
      guest: guestAccuracy,
      unit: "%",
    },
  ];

  const summary = {
    avgServeSpeed,
    avgShotSpeed,
    duelStats,
    guestName,
    guestSetsWon,
    headline: `${hostName}'s court patterns defined the match on ${surface ?? 'hard'}`,
    heroStats: [
      {
        key: "points_won_pct",
        label: "Points won",
        side: "host",
        value: pctValue(hostPointsRate.rate),
      },
      {
        key: "first_serve_pct",
        label: "1st serve in",
        side: "host",
        value: pctValue(hostFirstServe.rate),
      },
      {
        key: "shot_accuracy_pct",
        label: "Shot accuracy",
        side: "match",
        value: `${shotAccuracyPct}%`,
      },
      {
        key: "avg_shot_speed",
        label: "Avg shot speed",
        side: "match",
        value: `${avgShotSpeed} km/h`,
      },
    ],
    hostName,
    hostSetsWon,
    id: match.id,
    isDoubles: false,
    matchDate: matchDate || "2025-04-09",
    processedAt: new Date().toISOString(),
    setScore,
    serveCount,
    sets: sets.map((s) => ({
      guestScore: s.guestScore,
      hostScore: s.hostScore,
      setNumber: s.setNumber,
      tiebreakGuest: s.tiebreakGuestScore ?? null,
      tiebreakHost: s.tiebreakHostScore ?? null,
    })),
    shotAccuracyPct,
    shotCount: shots.length,
    shotPreview,
    slug: ctx.usingFixture
      ? "demo-boluda-clay-2025-04-09"
      : `match-${ctxMatchId}`,
    source: "swingvision",
    surface: surface ?? "hard",
    totalPoints: points.length,
  };

  const records = computeBenchRecords(summary, enrichedShotsData, momentumPts);

  const rallyBuckets = {
    guest: serializeRallyBuckets(computeRallyBucketStats(enrichedShotsData, "guest")),
    host: serializeRallyBuckets(computeRallyBucketStats(enrichedShotsData, "host")),
  };
  const zoneWinRates = {
    guest: serializeZoneWinRates(computeZoneWinRates(enrichedShotsData, "guest")),
    host: serializeZoneWinRates(computeZoneWinRates(enrichedShotsData, "host")),
  };
  const patternStats = {
    guest: serializePatternStats(computePatternStats(enrichedShotsData, "guest")),
    host: serializePatternStats(computePatternStats(enrichedShotsData, "host")),
  };
  const winnersErrors = {
    guest: computeWinnersErrors(stats, "guest"),
    host: computeWinnersErrors(stats, "host"),
  };
  const depthAggression = {
    guest: computeDepthAggression(enrichedShotsData, "guest"),
    host: computeDepthAggression(enrichedShotsData, "host"),
  };

  const momentumSeries = momentumPts.map((p, index) => ({
    gameNumber: p.gameNumber,
    index,
    isBreakPoint: p.isBreakPoint ?? false,
    isMatchPoint: p.isMatchPoint ?? false,
    isSetPoint: p.isSetPoint ?? false,
    pointNumber: p.pointNumber,
    pointWinner: p.pointWinner,
    setNumber: p.setNumber,
  }));

  const fixture = {
    aggregates: {
      dominantSurface: computeDominantSurface([summary]),
      publishedCount: 1,
      totalMatches: 1,
      totalPoints: points.length,
      totalShots: shots.length,
      matchesWithVideo: 1,
    },
    depthAggression,
    featured: summary,
    matches: [summary],
    momentumSeries,
    patternStats,
    pooledShots: shotPreview,
    rallyBuckets,
    records,
    stats: officialMatchStats(stats),
    winnersErrors,
    zoneWinRates,
  };

  const outPath = outArg
    ? path.resolve(outArg)
    : path.resolve(
        __dirname,
        "..",
        "packages",
        "data",
        "src",
        "fixtures",
        "bench-landing.json",
      );
  fs.writeFileSync(outPath, JSON.stringify(fixture, null, 2), "utf-8");

  const hash = crypto.createHash("sha256").update(JSON.stringify(fixture)).digest("hex").slice(0, 12);
  const withWinner = shotPreview.filter((s) => s.point_winner).length;
  console.log(`✅ Frozen fixture written to ${outPath}`);
  console.log(`   Fixture hash: ${hash}`);
  console.log(`   Shots: ${shotPreview.length} (with point_winner: ${withWinner})`);
  console.log(`   Momentum points: ${momentumSeries.length}`);
  console.log(`   Official stats rows: ${fixture.stats.length}`);
  console.log(`   Records: ${records.map((r) => r.labelKey).join(", ")}`);
  console.log(`   Duel stats: ${duelStats.map((d) => d.key).join(", ")}`);
  console.log(`   MIN_SAMPLE gate: ${MIN_SAMPLE}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
