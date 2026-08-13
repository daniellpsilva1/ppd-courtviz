/** Single source of truth for Match report deck slides (portrait 4:5). */

const BENCH_POSTS_FORMAT = "portrait";

const BENCH_POSTS_SLIDES = [
  // Open (1–5)
  { id: "cover", title: "Match report", subtitle: "Swipe to map the match →", section: "Open" },
  { id: "match-snapshot", title: "Match snapshot", subtitle: "Scoreline · volume · stroke mix", section: "Open" },
  { id: "territory-host", title: "Territory", subtitle: "Where the host hit most", section: "Open" },
  { id: "territory-guest", title: "Territory", subtitle: "Where the guest hit most", section: "Open" },
  { id: "court-insight", title: "Pressure zones", subtitle: "Where break, set, and match points ended", section: "Open" },

  // Serve (6–13)
  { id: "serve-map-host", title: "Serve placement", subtitle: "Host serve landing zones", section: "Serve" },
  { id: "serve-map-guest", title: "Serve placement", subtitle: "Guest serve landing zones", section: "Serve" },
  { id: "serve-zones-heat", title: "Serve zones", subtitle: "Wide · body · T heat by side", section: "Serve" },
  { id: "serve-1st-vs-2nd", title: "1st vs 2nd serve", subtitle: "Host · guest · official won%", section: "Serve" },
  { id: "serve-speed-court-host", title: "Serve speed", subtitle: "Host velocity on court", section: "Serve" },
  { id: "serve-speed-court-guest", title: "Serve speed", subtitle: "Guest velocity on court", section: "Serve" },
  { id: "serve-plus-one", title: "Serve +1", subtitle: "Third-ball placement after first serve", section: "Serve" },
  { id: "return-placement", title: "Return placement", subtitle: "Where returns land", section: "Serve" },

  // Patterns (14–24)
  { id: "stroke-dots-host", title: "Shot placement", subtitle: "Host shots by stroke type", section: "Patterns" },
  { id: "stroke-dots-guest", title: "Shot placement", subtitle: "Guest shots by stroke type", section: "Patterns" },
  { id: "forehand-map", title: "Forehand map", subtitle: "Every forehand landing", section: "Patterns" },
  { id: "backhand-map", title: "Backhand map", subtitle: "Every backhand landing", section: "Patterns" },
  { id: "crosscourt-flows", title: "Crosscourt", subtitle: "Crosscourt shot flows", section: "Patterns" },
  { id: "down-the-line-flows", title: "Down the line", subtitle: "Down-the-line shot flows", section: "Patterns" },
  { id: "inside-out-in", title: "Inside-out / in", subtitle: "Aggression geometry on court", section: "Patterns" },
  { id: "depth-bands", title: "Depth bands", subtitle: "Short · mid · deep landing share", section: "Patterns" },
  { id: "depth-angle", title: "Depth & angle", subtitle: "Pin deep. Change the geometry.", section: "Patterns" },
  { id: "approach-net", title: "Approach & net", subtitle: "Contact points · nets pinned to tape", section: "Patterns" },
  { id: "volley-map", title: "Volley map", subtitle: "Volley and net contact points", section: "Patterns" },

  // Outcomes (25–34)
  { id: "winners-host", title: "Point endings", subtitle: "Host last In shot · Official W/UE", section: "Outcomes" },
  { id: "winners-guest", title: "Point endings", subtitle: "Guest last In shot · Official W/UE", section: "Outcomes" },
  { id: "errors-out", title: "Out errors", subtitle: "Outside singles · alley muted", section: "Outcomes" },
  { id: "errors-net", title: "Net errors", subtitle: "Point-ending nets · pinned near tape", section: "Outcomes" },
  { id: "zone-win-host", title: "Zone win rate", subtitle: "Host point win % by bounce zone", section: "Outcomes" },
  { id: "zone-win-guest", title: "Zone win rate", subtitle: "Guest point win % by bounce zone", section: "Outcomes" },
  { id: "first-strike-court", title: "First strike", subtitle: "Point endings in four shots or fewer", section: "Outcomes" },
  { id: "rally-short", title: "Short rallies", subtitle: "Where each 1–3 shot point ended", section: "Outcomes" },
  { id: "rally-medium", title: "Medium rallies", subtitle: "Where each 4–6 shot point ended", section: "Outcomes" },
  { id: "rally-long", title: "Long rallies", subtitle: "Where each 7+ shot point ended", section: "Outcomes" },

  // Pressure & records (35–44)
  { id: "break-points-court", title: "Break points", subtitle: "Return and finish locations under pressure", section: "Pressure" },
  { id: "clutch-points", title: "Clutch points", subtitle: "Break · set · match point endings", section: "Pressure" },
  { id: "set-1-density", title: "Set 1 density", subtitle: "Both players · shared scale with Set 2", section: "Pressure" },
  { id: "set-2-density", title: "Set 2 density", subtitle: "Both players · shared scale with Set 1", section: "Pressure" },
  { id: "momentum-court", title: "Momentum", subtitle: "Point winners by set on court", section: "Pressure" },
  { id: "fastest-serve", title: "Fastest serve", subtitle: "Top tracked serve speed", section: "Pressure" },
  { id: "longest-rally", title: "Longest rally", subtitle: "Most shots in a single point", section: "Pressure" },
  { id: "top-points", title: "Top points", subtitle: "Highest-leverage endings · MP › SP › BP", section: "Pressure" },
  { id: "featured-story", title: "Featured story", subtitle: "Head-to-head match analysis", section: "Pressure" },
  { id: "coach-insight-1", title: "Coach insight", subtitle: "Top pattern takeaway on court", section: "Pressure" },

  // Extra analysis (45–49)
  { id: "momentum-swing", title: "Momentum swing", subtitle: "Longest point streaks on court", section: "Pressure" },
  { id: "hex-efficiency", title: "Hex efficiency", subtitle: "Win % by court zone · host vs guest", section: "Pressure" },
  { id: "zone-bars", title: "Zone bars", subtitle: "Point win % by bounce zone · side by side", section: "Pressure" },
  { id: "serve-diamond", title: "Serve diamond", subtitle: "1st serve % · win% · speed · aces", section: "Pressure" },
  { id: "error-profile", title: "Error profile", subtitle: "Forced · unforced · net · out by stroke", section: "Pressure" },

  // Close (50–55)
  { id: "coach-insight-2", title: "Coach insight", subtitle: "Second pattern takeaway on court", section: "Close" },
  { id: "coach-insight-3", title: "Coach insight", subtitle: "Third pattern takeaway on court", section: "Close" },
  { id: "head-to-head-courts", title: "Head to head", subtitle: "Host and guest courts side by side", section: "Close" },
  { id: "match-dna", title: "Match DNA", subtitle: "Serve · winners · errors · depth", section: "Close" },
  { id: "cta-court", title: "Every shot. Mapped.", subtitle: "Court-first match intelligence", section: "Close" },
  { id: "cta", title: "Your matches. This clarity.", subtitle: "Sign up free at peakperformancedata.app", section: "Close" },
];

const BENCH_POSTS_SLIDE_IDS = BENCH_POSTS_SLIDES.map((s) => s.id);

const BENCH_POSTS_SECTIONS = ["Open", "Serve", "Patterns", "Outcomes", "Pressure", "Close"];

function benchPostFileName(index, slideId, ext) {
  const padded = String(index + 1).padStart(2, "0");
  return `${padded}-${slideId}.${ext}`;
}

module.exports = {
  BENCH_POSTS_FORMAT,
  BENCH_POSTS_SECTIONS,
  BENCH_POSTS_SLIDE_IDS,
  BENCH_POSTS_SLIDES,
  benchPostFileName,
};
