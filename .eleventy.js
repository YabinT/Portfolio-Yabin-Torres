module.exports = function (eleventyConfig) {
  // Root HTML pages
  eleventyConfig.addPassthroughCopy("index.html");
  eleventyConfig.addPassthroughCopy("contact.html");

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
