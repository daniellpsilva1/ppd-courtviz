const { brandDefaults } = require("@ppd/tokens");

function parseArg(prefix) {
  const arg = process.argv.find((a) => a.startsWith(`${prefix}=`));
  return arg ? arg.split("=")[1] : undefined;
}

function resolveBrandHandle() {
  return process.env.PPD_BRAND_HANDLE ?? parseArg("--brand-handle") ?? brandDefaults.handle;
}

function resolveBrandWebsite() {
  const raw = process.env.PPD_BRAND_WEBSITE ?? parseArg("--brand-website") ?? brandDefaults.website;
  return raw.replace(/^https?:\/\//, "").replace(/\/$/, "");
}

function resolveBranding(overrides = {}) {
  const handle = overrides.handle ?? resolveBrandHandle();
  return {
    handle,
    source: overrides.source ?? brandDefaults.sourceLine,
    tagline: overrides.tagline ?? brandDefaults.tagline,
    website: overrides.website ?? resolveBrandWebsite(),
    ...overrides,
  };
}

function brandHashtag() {
  return handleToHashtag(resolveBrandHandle());
}

function handleToHashtag(handle) {
  return handle.replace(/^@/, "").toLowerCase();
}

module.exports = {
  brandHashtag,
  handleToHashtag,
  resolveBrandHandle,
  resolveBrandWebsite,
  resolveBranding,
};
