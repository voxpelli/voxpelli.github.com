---
layout: post
title: "New service: WebMentions for static pages"
date: 2013-12-18T23:45:00+01:00
lang: en
---

<span class="p-summary">I'm now launching a service that can receive and embeds WebMentions for sites. Useful for eg. static blogs on GitHub Pages.</span>

Earlier this year when I went to the [IndieWebCamp in Brighton](http://indiewebcamp.com/2013/UK), a very nice event, the thing people were most excited about, at least when it came to the actually implementing it, was [WebMentions](http://indiewebcamp.com/webmention).

So when it was time to get hands on with code I wanted to do so as well, my only trouble was: This blog is on Jekyll/GitHub Pages [since two years](/2011/08/moving-to-jekyll-and-english/) and I like it there. How can I then accept something as dynamic as a comment from someone elses blog?

I know you're already thinking it – a hosted solution like Disqus could surely solve my problem and yes indeed, therefore I went ahead and built one. Then came ordinary life and occupied me with other stuff, but now finally a very first rough version is ready for launch and can be found at [webmention.herokuapp.com](https://webmention.herokuapp.com/).

This post will prove that it works by appearing as the first WebMention on <a rel="in-reply-to" href="https://webmention.herokuapp.com/">webmention.herokuapp.com</a> itself and hopefully mentions from others will start appearing both there and on this blog eventually so that maybe I'll become as cool as [Aaron Parecki](http://aaronparecki.com/replies/2013/06/20/1/webmention-indieweb), [Jeremy Keith](http://adactio.com/journal/6495/) and [the others](http://indiewebcamp.com/webmention#IndieWeb_implementations) in the end.

I'm aware that this service isn't totally inline with the spirit of the IndieWeb, that you should own and host your own stuff (I'm not even using IndieAuth yet!), but it's my pragmatic solution for getting a step closer to such a world and a solution I'm happy to share with others.

I'm opening up just **five accounts** for others now, considering this is still an early alpha, and will keep the development [open on GitHub](https://github.com/voxpelli/webpage-webmentions/) – all feedback is welcome!
