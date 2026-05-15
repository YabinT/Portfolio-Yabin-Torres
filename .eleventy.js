module.exports = function (eleventyConfig) {
  // Root HTML pages
  eleventyConfig.addPassthroughCopy("index.html");
  eleventyConfig.addPassthroughCopy("contact.html");

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
