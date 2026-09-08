module.exports = function (eleventyConfig) {
  // Root HTML pages. Every new top-level page needs a line here or it never
  // reaches _site and 404s in production.
  eleventyConfig.addPassthroughCopy("index.html");
  eleventyConfig.addPassthroughCopy("contact.html");
  eleventyConfig.addPassthroughCopy("services.html");
  eleventyConfig.addPassthroughCopy("audit.html");

  // Spanish mirror
  eleventyConfig.addPassthroughCopy("es");

  // Decap CMS config (YAML is not processed as a template — needs explicit copy)
  eleventyConfig.addPassthroughCopy({ "content/admin/config.yml": "admin/config.yml" });

  // Static asset folders
  eleventyConfig.addPassthroughCopy("css");
  eleventyConfig.addPassthroughCopy("assets");
  eleventyConfig.addPassthroughCopy("cases");
  eleventyConfig.addPassthroughCopy("js");

  return {
    dir: {
      input: "content",
      output: "_site",
    },
  };
};
