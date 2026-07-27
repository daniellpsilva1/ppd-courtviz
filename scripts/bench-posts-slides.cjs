/** Single source of truth for Bench social post slides (portrait 4:5). */

const BENCH_POSTS_FORMAT = "portrait";

const BENCH_POSTS_SLIDES = [
  { id: "cover", title: "The tennis analytics bench", subtitle: "Swipe to see the data →" },
  { id: "scale", title: "By the numbers", subtitle: "Platform-wide aggregates" },
  { id: "live-bench", title: "Live bench data", subtitle: "Pooled shot map and surface mix" },
  { id: "record-fastest-serve", title: "Fastest serve", subtitle: "Bench record" },
  { id: "record-longest-rally", title: "Longest rally", subtitle: "Bench record" },
  { id: "record-best-break", title: "Best break conversion", subtitle: "Bench record" },
  { id: "record-top-points", title: "Top points won", subtitle: "Bench record" },
  { id: "featured-match", title: "Featured story", subtitle: "Editorial match analysis" },
  { id: "featured-insight", title: "Court insight", subtitle: "Shot placement from the featured match" },
  { id: "cta", title: "Want your matches on the bench?", subtitle: "Request access to Peak Performance Data" },
];

const BENCH_POSTS_SLIDE_IDS = BENCH_POSTS_SLIDES.map((s) => s.id);

function benchPostFileName(index, slideId, ext) {
  const padded = String(index + 1).padStart(2, "0");
  return `${padded}-${slideId}.${ext}`;
}

module.exports = {
  BENCH_POSTS_FORMAT,
  BENCH_POSTS_SLIDE_IDS,
  BENCH_POSTS_SLIDES,
  benchPostFileName,
};
