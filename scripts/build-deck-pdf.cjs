/**
 * Build a PDF from exported bench-post PNGs in slide order.
 *
 * Usage:
 *   node scripts/build-deck-pdf.cjs
 *
 * Reads manifest.json from the bench-posts export directory,
 * assembles all PNGs into a single portrait PDF using pdfkit.
 */

const fs = require("fs");
const path = require("path");

const PDFDocument = require("pdfkit");

const { BENCH_POSTS_SLIDES, benchPostFileName } = require("./bench-posts-slides.cjs");

const benchPostsRoot = path.resolve(__dirname, "..", "apps", "demo", "public", "exports", "bench-posts");
const manifestPath = path.join(benchPostsRoot, "manifest.json");

function main() {
  if (!fs.existsSync(manifestPath)) {
    throw new Error(`Manifest not found: ${manifestPath}\nRun "pnpm export:bench-posts" first.`);
  }

  const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf-8"));
  const pageW = manifest.width;
  const pageH = manifest.height;

  const outPath = path.resolve(__dirname, "..", "apps", "demo", "public", "exports", "bench-posts", "00-match-report-deck.pdf");
  const doc = new PDFDocument({
    autoFirstPage: false,
    margin: 0,
    size: [pageW, pageH],
  });

  doc.pipe(fs.createWriteStream(outPath));

  for (const [index, slide] of BENCH_POSTS_SLIDES.entries()) {
    const pngPath = path.join(benchPostsRoot, benchPostFileName(index, slide.id, "png"));
    if (!fs.existsSync(pngPath)) {
      console.warn(`  ⚠ Missing PNG: ${pngPath}, skipping`);
      continue;
    }
    doc.addPage({ margin: 0, size: [pageW, pageH] });
    doc.image(pngPath, 0, 0, { height: pageH, width: pageW });
    console.log(`  ✓ ${benchPostFileName(index, slide.id, "png")}`);
  }

  doc.end();
  console.log(`\n✅ PDF saved to ${outPath}`);
  console.log(`   ${BENCH_POSTS_SLIDES.length} slides · ${pageW}×${pageH}px`);
}

main();
