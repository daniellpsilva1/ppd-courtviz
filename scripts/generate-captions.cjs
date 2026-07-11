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

function buildHashtags() {
  const brandTag = `#${brandHashtag()}`;
  return {
    instagram: ["#tennis", "#tenniscoach", "#matchanalysis", brandTag, "#tennisstats"],
    tiktok: ["#tennis", "#tennistok", "#matchrecap", brandTag],
    twitter: ["#tennis", "#tennisstats", brandTag],
  };
}

function setScore(sets) {
  return sets.map((s) => `${s.hostScore}-${s.guestScore}`).join(", ");
}

function buildCaptions(ctx) {
  const score = setScore(ctx.sets);
  const HASHTAGS = buildHashtags();
  const insight = primaryCoachInsight({
    enrichedShots: ctx.enrichedShots,
    guestName: ctx.guestName,
    hostName: ctx.hostName,
    points: ctx.points,
  });
  const coachTips = generateCoachInsights(
    {
      enrichedShots: ctx.enrichedShots,
      guestName: ctx.guestName,
      hostName: ctx.hostName,
      points: ctx.points,
    },
    3,
  )
    .map((item) => `• ${item.headline}`)
    .join("\n");

  return {
    instagram: `${ctx.hostName} vs ${ctx.guestName} (${score})\n\n${insight}\n\n${coachTips}\n\n${HASHTAGS.instagram.join(" ")}`,
    tiktok: `${ctx.hostName} vs ${ctx.guestName} — ${score}. ${insight} ${HASHTAGS.tiktok.join(" ")}`,
    twitter: `${ctx.hostName} def. ${ctx.guestName} ${score}. ${insight} ${HASHTAGS.twitter.join(" ")}`,
  };
}

async function main() {
  const ctx = await loadMatchContext();
  const outDir = path.resolve(__dirname, "..", "apps", "demo", "public", "exports", "captions");
  fs.mkdirSync(outDir, { recursive: true });

  const captions = buildCaptions(ctx);
  const manifest = {
    guestName: ctx.guestName,
    hostName: ctx.hostName,
    matchDate: ctx.matchDate,
    matchId: ctx.matchId,
    platforms: captions,
    generatedAt: new Date().toISOString(),
  };

  fs.writeFileSync(path.join(outDir, "captions.json"), JSON.stringify(manifest, null, 2), "utf-8");
  for (const [platform, text] of Object.entries(captions)) {
    fs.writeFileSync(path.join(outDir, `${platform}.txt`), `${text}\n`, "utf-8");
  }

  console.log(`✅ Captions written to ${outDir}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
