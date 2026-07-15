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
const { SLIDES } = require("./deck-slides.cjs");
const { setScore } = require("./export-slide-helpers.cjs");

function buildHashtags() {
  const brandTag = `#${brandHashtag()}`;
  return {
    instagram: ["#tennis", "#tenniscoach", "#matchanalysis", brandTag, "#tennisstats"],
    tiktok: ["#tennis", "#tennistok", "#matchrecap", brandTag],
    twitter: ["#tennis", "#tennisstats", brandTag],
  };
}

function buildCaptions(ctx) {
  const score = setScore(ctx.sets);
  const HASHTAGS = buildHashtags();
  const deckHook = `Swipe through ${SLIDES.length} slides: serve report → patterns → coach takeaways.`;
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

async function main() {
  const ctx = await loadMatchContext();
  const outDir = path.resolve(__dirname, "..", "apps", "demo", "public", "exports", "captions");
  fs.mkdirSync(outDir, { recursive: true });

  const captions = buildCaptions(ctx);
  const manifest = {
    deckSlideCount: SLIDES.length,
    guestName: ctx.guestName,
    hostName: ctx.hostName,
    matchDate: ctx.matchDate,
    matchId: ctx.matchId,
    platforms: captions,
    generatedAt: new Date().toISOString(),
    schemaVersion: 1,
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
