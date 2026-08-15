/**
 * Generate platform-specific captions and hashtags per match.
 */

const fs = require("fs");
const path = require("path");

const demoNodeModules = path.resolve(__dirname, "..", "apps", "demo", "node_modules");
const rootNodeModules = path.resolve(__dirname, "..", "node_modules");
module.paths = [demoNodeModules, rootNodeModules, ...(module.paths || [])];

const { generateCoachInsights, primaryCoachInsight } = require("@ppd/brand");
const { loadMatchContext } = require("./load-match-data.cjs");
const { brandHashtag } = require("./brand-helpers.cjs");
const { BENCH_POSTS_SLIDES } = require("./bench-posts-slides.cjs");
const { setScore } = require("./export-slide-helpers.cjs");
const { selectSlides } = require("./select-slides.cjs");

function buildHashtags() {
  const brandTag = `#${brandHashtag()}`;
  return {
    instagram: ["#tennis", "#tenniscoach", "#matchanalysis", brandTag, "#tennisstats"],
    tiktok: ["#tennis", "#tennistok", "#matchrecap", brandTag],
    twitter: ["#tennis", "#tennisstats", brandTag],
  };
}

function buildCaptions(ctx, slideCount) {
  const score = setScore(ctx.sets);
  const HASHTAGS = buildHashtags();
  const count = slideCount || BENCH_POSTS_SLIDES.length;
  const deckHook = `Swipe through ${count} slides: shot maps → heatmaps → match analysis → coach takeaways.`;
  const primaryInsight = primaryCoachInsight({
    enrichedShots: ctx.enrichedShots,
    guestName: ctx.guestName,
    hostName: ctx.hostName,
    points: ctx.points,
  });
  const allInsights = generateCoachInsights(
    {
      enrichedShots: ctx.enrichedShots,
      guestName: ctx.guestName,
      hostName: ctx.hostName,
      points: ctx.points,
    },
    4,
  );
  // Exclude the primary insight from bullets to avoid duplication.
  const bulletInsights = allInsights.filter((item) => `${item.headline} — ${item.action}` !== primaryInsight).slice(0, 3);
  const coachTips = bulletInsights
    .map((item) => `• ${item.headline}`)
    .join("\n");

  return {
    instagram: `${ctx.hostName} vs ${ctx.guestName} (${score})\n\n${deckHook}\n\n${primaryInsight}\n\n${coachTips}\n\n${HASHTAGS.instagram.join(" ")}`,
    tiktok: `${ctx.hostName} vs ${ctx.guestName} — ${score}. ${deckHook} ${primaryInsight} ${HASHTAGS.tiktok.join(" ")}`,
    twitter: `${ctx.hostName} def. ${ctx.guestName} ${score}. ${primaryInsight} ${HASHTAGS.twitter.join(" ")}`,
  };
}

function parseArg(prefix) {
  const arg = process.argv.find((a) => a.startsWith(`${prefix}=`));
  return arg ? arg.split("=").slice(1).join("=") : undefined;
}

async function main() {
  const matchId = parseArg("--matchId");
  const outArg = parseArg("--out");
  const ctx = await loadMatchContext();

  // When --matchId is provided, use the selector to determine the actual slide count
  let slideCount;
  let selectedSlides;
  if (matchId) {
    selectedSlides = selectSlides(ctx);
    slideCount = selectedSlides.length;
  } else {
    slideCount = BENCH_POSTS_SLIDES.length;
  }

  const outDir = outArg
    ? path.resolve(outArg)
    : path.resolve(__dirname, "..", "apps", "demo", "public", "exports", "captions");
  fs.mkdirSync(outDir, { recursive: true });

  const captions = buildCaptions(ctx, slideCount);
  const manifest = {
    deckSlideCount: slideCount,
    guestName: ctx.guestName,
    hostName: ctx.hostName,
    matchDate: ctx.matchDate,
    matchId: matchId ?? ctx.matchId ?? null,
    platforms: captions,
    generatedAt: new Date().toISOString(),
    schemaVersion: 1,
    selectedSlides: selectedSlides ?? null,
  };

  fs.writeFileSync(path.join(outDir, "captions.json"), JSON.stringify(manifest, null, 2), "utf-8");
  for (const [platform, text] of Object.entries(captions)) {
    fs.writeFileSync(path.join(outDir, `${platform}.txt`), `${text}\n`, "utf-8");
  }

  // Remove stale platform files no longer generated.
  const staleFile = path.join(outDir, "linkedin.txt");
  if (fs.existsSync(staleFile)) fs.unlinkSync(staleFile);

  console.log(`✅ Captions written to ${outDir}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
