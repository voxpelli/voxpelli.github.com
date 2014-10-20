---
layout: post
title: "Reclaiming the reply with Indie-Config – Overview"
date: 2014-10-20T21:32:00+02:00
lang: en
---

## tl;dr

<span class="p-summary">Have your own site? Want to respond to someone elses site? Doing the [IndieWeb](http://indiewebcamp.com/)-thing and moving your tweets to your own site? Want replying to be as simple as on Twitter? Indie-Config is the answer.</span>

How can other sites open a reply form on your site for you to post on? Think [Twitter Intents](https://dev.twitter.com/web/intents). [Indie-Config](http://indiewebcamp.com/indie-config) can – it registers your personal site as a `web+action:` protocol with `navigator.registerProtocolHandler()` and that way lets the other site know your available endpoints. Problem solved.

## IndieWebCamp UK 2014

Earlier this year I once again attended [IndieWebCamp UK in Brighton](http://indiewebcamp.com/2014/UK) – a very nice event this time around as well – and a fruitful one. Last year resulted in me making a [WebMention service](http://voxpelli.com/2013/12/webmentions-for-static-pages/) – and this year I discussed a lot about a way to link the Reply, Repost and Like buttons of sites to ones own posting interface to achieve a [Twitter Intent](https://dev.twitter.com/web/intents) like experience without something like [MicroPub](http://indiewebcamp.com/micropub) (which isn't always feasible) or a [browser extension](http://indiewebcamp.com/webactions#Web_Action_Browser_Support).

## The Problem

I want my blog to be able to show a [Twitter Intent](https://dev.twitter.com/web/intents)-like dialog from your blog so that you can reply to my blog from your own site just like you now can reply to my blog from Twitter.

## The Proposed Solution

1. You register a `web+action:` protocol with `registerProtocolHandler()` and have it point to a URL on a server, like:<br/> `navigator.registerProtocolHandler('web+action', '/?url=%s', 'Your Blog Name');`
2. When I need to know what endpoints you have, eg. when you click a reply button on my blog, I load the the `web+action:` protocol in iframe, like:<br/> `<iframe src="web+action:load"></iframe>`
3. When the page in the iframe have loaded you should send JSON-encode your endpoint configuration and send it asa a message to my parent frame using [`window.postMessage()`](https://developer.mozilla.org/docs/Web/API/Window.postMessage)
4. I should listen for such a message and try to parse it (preferably checking that it was the frame I added that sent the message) – and voilá – I have your configuration. Using:<br />`window.addEventListener('message')`
5. (If you don't have a configuration then the only way for me to detect that is through a timeout – then I can fallback to eg. Twitter Intents)

## Does it work?

Yes! In Firefox and Chrome it does. I have such a reply button on this very blog and me and [Barnaby Walters](https://waterpigs.co.uk/) did a [Hackday Demo](http://indiewebcamp.com/2014/UK/Demos#Barnaby_and_Pelle) of it during the UK IndieWebCamp where Barnaby registered a handler, went to my site, pressed reply and got a reply form on his own site.

My original implementation also included a semi-broken first try at a Web Component, which didn't work in Chrome, but with a simple regular polyfill instead (until a real Web Component is made) it should all work in Chrome as well.

## The Longer Term

Of course, using `navigator.registerProtocolHandler()`, iframes and `postMessage()` is kind of a hack so in the longer term there should of course be a better solution. A road to that better solution that was also discussed during the IndieWebCamp UK was to build it into a Web Component for the [WebActions](http://indiewebcamp.com/webactions) tag, `<indie-action>`, so that we could start dogfeeding a real world actions tag – learn how such a tag can be used, how it can be styled etc and perhaps prepare for what eventually could be a standard actions tag that's natively implemented in the browser and which naturally then won't have a use for the hackish workaround anymore. 

## Conclusion

So – Indie-Config enables independent sites to open reply windows etc for other independent ones just like one can for Twitter with [Twitter Intent](https://dev.twitter.com/web/intents). All the basics are there, now we just need to dogfeed it, see how it all work in practise and find out how to best use it.

For more info on Indie-Config and Web Actions and to follow what happens with them within the community, check [http://indiewebcamp.com/indie-config](http://indiewebcamp.com/indie-config) and [http://indiewebcamp.com/webactions](http://indiewebcamp.com/webactions).

I'll try to follow up here soon with more posts on how to implement all of this. For now, check the [source of this blog](https://github.com/voxpelli/voxpelli.github.com/tree/master/js) for a simple implementation.
