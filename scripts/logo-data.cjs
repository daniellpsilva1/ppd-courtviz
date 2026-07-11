const fs = require("fs");
const path = require("path");

const logoPath = path.resolve(__dirname, "..", "packages", "brand", "assets", "ppd-logo.png");

function getLogoDataUri() {
  const buffer = fs.readFileSync(logoPath);
  return `data:image/png;base64,${buffer.toString("base64")}`;
}

module.exports = { getLogoDataUri, logoPath };
