'use strict';

// const pluginRss = require("@11ty/eleventy-plugin-rss");

// const classModifierSimple = (baseClass, ...modifiers) =>
//   baseClass + ' ' + modifiers.map(modifier => `${baseClass}--${modifier}`).join(' ')

module.exports = function (eleventyConfig) {
  // eleventyConfig.addPlugin(pluginRss);

	eleventyConfig.addPassthroughCopy('images');
	// eleventyConfig.addPassthroughCopy('_redirects');
  // eleventyConfig.addPassthroughCopy('favicon.ico');

  // eleventyConfig.addShortcode('classmodifier', classModifierSimple);

  return {
    dataTemplateEngine: false,
    dir: {
      input: './',      // Equivalent to Jekyll's source property
      // includes: '_includes',
      // data: '_data',
      output: './_site', // Equivalent to Jekyll's destination property
      layouts: './_layouts'
    }
  };
};
