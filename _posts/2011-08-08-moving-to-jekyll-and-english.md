---
layout: post
title: "Moving to Jekyll and English"
lang: en
---
I've long had my blog in a Drupal 6 based system, which I set it up during the Christmas of 2008. Drupal however is not a very good blogging tool which has resulted in me only writing a handful of posts since then. [Drupal](http://drupal.org/) is built to be a really powerful and extensible framework that can fit every purpose one can imagine - for a simple little blog that only me myself am going to use that flexibility becomes more of a burden than a help.

That's why I'm now moving my blog over to [Jekyll](http://jekyllrb.com/). To be able to write my posts in raw HTML-files which are assembled together with a simple layout and outputted as static files seems like a much more flexible solution for what I need. I can even use Git to version control my posts and to deploy them and thanks to [GitHub Pages](http://pages.github.com/) I don't even have to host the blog myself (although I am of course still using my own domain so that I can move to another host whenever I want).

Moving from Drupal to Jekyll was simple. There are [lots of sites](https://github.com/mojombo/jekyll/wiki/Sites) out there that shows how to set up layouts etc. (I especially liked [Tom Preston-Werner's](https://github.com/mojombo/mojombo.github.com) and [Alex Payne's](https://github.com/al3x/al3x.github.com)) and there are good documentation of the [template syntax](https://github.com/mojombo/jekyll/wiki/Liquid-Extensions) and such. There's also a simple migration script to create Jekyll posts and redirects for the nodes on your existing Drupal site - which I extended to support [database prefixes](https://github.com/mojombo/jekyll/pull/383) and [url aliases](https://github.com/mojombo/jekyll/pull/384).

With this simpler blogging tool I'm most likely going to blog a bit more - and since it's now easy to also start blogging in english I'm also going to do that in addition to my swedish posts. To help those not understanding swedish that well I have marked my swedish posts with the swedish flag on the front page and I have also replaced the old RSS feed with two new Atom feeds - one that contain <a href="/english.xml" type="application/atom+xml">only the english posts</a> and another feed <a href="/all.xml" type="application/atom+xml">containing all posts</a>.

And lastly: Thanks to <a href="http://twitter.com/peterrosdahl">Peter Rosdahl</a> for feedback regarding design and other things.