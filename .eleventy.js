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

  // FIXME: Solve categories – "social", "links" etc – so oen can list the content there. See eg: https://github.com/11ty/eleventy-base-blog/blob/a1f875187d3cb8bd64e9439b77b979f7e5c489c6/_11ty/getTagList.js and https://www.raymondcamden.com/2020/02/27/raymondcamdencom-now-powered-by-eleventy

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
