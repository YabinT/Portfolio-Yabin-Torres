const fs = require("node:fs");

// Case studies ship automatically: any .html in cases/ is published unless its
// name says it's a mockup. Mockups stay in the repo for review but never reach
// _site, so they can't be crawled or shared by accident.
const casePages = fs
  .readdirSync("cases")
  .filter((file) => file.endsWith(".html") && !file.includes("mockup"));

module.exports = function (eleventyConfig) {
  // Root HTML pages. Every new top-level page needs a line here or it never
  // reaches _site and 404s in production.
  eleventyConfig.addPassthroughCopy("index.html");
  eleventyConfig.addPassthroughCopy("contact.html");
  eleventyConfig.addPassthroughCopy("services.html");
  eleventyConfig.addPassthroughCopy("audit.html");

  for (const file of casePages) {
    eleventyConfig.addPassthroughCopy(`cases/${file}`);
  }

  // content/sitemap.njk lists these, so a new case study reaches the sitemap
  // on the next build without touching it.
  eleventyConfig.addGlobalData("sitemapUrls", [
    "/",
    "/services.html",
    "/audit.html",
    "/contact.html",
    ...casePages.map((file) => `/cases/${file}`),
  ]);

  eleventyConfig.addPassthroughCopy("robots.txt");

  // Spanish mirror
  eleventyConfig.addPassthroughCopy("es");

  // The CMS draft case and the admin panel stay in the repo but are not
  // published: the draft duplicated the real Resiliencia case with broken
  // images, and nothing else is authored through the CMS.
  eleventyConfig.ignores.add("content/cases/**");
  eleventyConfig.ignores.add("content/admin/**");

  // Static asset folders
  eleventyConfig.addPassthroughCopy("css");
  eleventyConfig.addPassthroughCopy("assets");
  eleventyConfig.addPassthroughCopy("js");

  return {
    dir: {
      input: "content",
      output: "_site",
    },
  };
};
