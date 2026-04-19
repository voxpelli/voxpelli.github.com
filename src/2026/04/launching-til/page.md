---
layout: article
title: Launching /til/
date: '2026-04-19T12:00:00.000Z'
lang: en
tags:
  - meta
  - website
  - til
---

I have been scattering small discoveries across too many places for too long. A surprising hex trick on Bluesky, a Wikipedia rabbit hole captured in a commit message, a link filed away in Raindrop with a one-line note — each one a little "huh, I didn't know that" that never really landed anywhere I would find it again.

So I am giving those notes a home. This site now has a [Today I Learned section](/til/), with [its own Atom feed](/til/feed.atom).

## What a TIL is (and what it isn't)

The format is borrowed from a lineage I have been reading for years: [Simon Willison's TILs](https://til.simonwillison.net/), [Julia Evans's blog](https://jvns.ca/) and her [new microblog](https://jvns.ca/blog/2024/11/09/new-microblog/), [thoughtbot's TIL collection](https://github.com/thoughtbot/til). The shared idea is simple: a short, date-stamped note written mostly for your future self, published anyway in case it helps someone else.

A TIL here is not an essay. It is not a tutorial. It is not a considered take. It is one small thing I did not know yesterday and want to remember. Sometimes a paragraph. Sometimes a diagram. Sometimes just a link with a sentence of context.

That is on purpose. The blog is where I write long-form when I have something worked out. [/links/](/links/) is where I share an article with commentary. The TIL section sits below both — lower polish, higher frequency, written while the surprise is still fresh.

## Why now

I recently finished [migrating this site to DomStack](/archive/) and in the process spent a lot of time re-reading my own archives. One thing that stood out: the interesting little findings from the last few years mostly are not here. They are in Bluesky threads, in Raindrop bookmark notes, in git commit bodies, in chats with colleagues. Useful to me in the moment, invisible to anyone else and often lost to me too once the thread scrolls away.

Having the infrastructure freshly in hand made it obvious to add one more convention-based folder and a feed, rather than keep externalising the notes to platforms I do not control. It fits the rest of the stance of this site: microformats, webmentions, own-your-content, feeds that actually work.

## How it will get populated

Two sources, roughly.

First, reverse-POSSE from Bluesky. I am seeding the section with a handful of TIL-tagged posts I already wrote on Bluesky over the last year — short things about IEEE 754 decimal floating point, WebP being a RIFF container, the short-hex color system — re-homed here with attribution back to the original post. That material existed; it just needed a canonical place to live.

Second, from here on, new TILs land here first and can be syndicated outward later. That is the "publish on your own site, syndicate elsewhere" direction, and TIL is a low-stakes place to practice it. If a note turns out to deserve more than a paragraph it can graduate into a full blog post.

## Subscribing

If you read via a feed reader, the TIL section has its own: [/til/feed.atom](/til/feed.atom). The [main feed](/feed.atom) stays focused on longer posts, so subscribe to both if you want everything, or just the TIL feed if you prefer small and frequent over rare and long.

No promises about cadence. The point is to have somewhere low-friction to put the small things, not to hit a quota. If it works, the archive grows on its own.
