const fs = require("node:fs");

// Case studies ship automatically: any .html in cases/ is published unless its
// name says it's a mockup. Mockups stay in the repo for review but never reach
// _site, so they can't be crawled or shared by accident.
const casePages = fs
  .readdirSync("cases")
  .filter((file) => file.endsWith(".html") && !file.includes("mockup"));

// One page per service (services/*.html), listed the same way.
const servicePages = fs
  .readdirSync("services")
  .filter((file) => file.endsWith(".html"));

module.exports = function (eleventyConfig) {
  // Every page (the root .html files and cases/*.html) extends
  // content/_includes/base.njk, which holds the shared <head>. Pages keep the
  // .html URLs they already had instead of Eleventy's default /page/ folders.
  eleventyConfig.addGlobalData("permalink", "{{ page.filePathStem }}.html");

  eleventyConfig.ignores.add("cases/*mockup*");

  // The CMS draft case and the admin panel stay in the repo but are not
  // published: the draft duplicated the real Resiliencia case with broken
  // images, and nothing else is authored through the CMS.
  eleventyConfig.ignores.add("content/cases/**");
  eleventyConfig.ignores.add("content/admin/**");

  // content/sitemap.njk lists these, so a new case study reaches the sitemap
  // on the next build without touching it.
  eleventyConfig.addGlobalData("sitemapUrls", [
    "/",
    "/services.html",
    ...servicePages.map((file) => `/services/${file}`),
    "/audit.html",
    "/bio.html",
    "/contact.html",
    "/privacy.html",
    ...casePages.map((file) => `/cases/${file}`),
  ]);

  // "Other projects" at the end of every case: the n cases that follow
  // the current one in card.order, wrapping around, so each page shows a
  // different set and a new case with a card joins without editing this.
  eleventyConfig.addFilter("relatedCases", (cases, url, n = 4) => {
    const list = (cases || [])
      .filter((c) => c.data.card)
      .sort((a, b) => (a.data.card.order ?? 99) - (b.data.card.order ?? 99));
    const at = list.findIndex((c) => c.url === url);
    const rest = at < 0 ? list : [...list.slice(at + 1), ...list.slice(0, at)];
    return rest.slice(0, n);
  });

  eleventyConfig.addPassthroughCopy("robots.txt");

  // Spanish mirror
  eleventyConfig.addPassthroughCopy("es");

  // Static asset folders
  eleventyConfig.addPassthroughCopy("css");
  eleventyConfig.addPassthroughCopy("assets");
  eleventyConfig.addPassthroughCopy("js");

  return {
    templateFormats: ["html", "njk"],
    htmlTemplateEngine: "njk",
    dir: {
      input: ".",
      includes: "content/_includes",
      data: "content/_data",
      output: "_site",
    },
  };
};
