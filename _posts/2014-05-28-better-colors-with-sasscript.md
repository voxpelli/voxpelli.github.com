---
layout: post
title: "Better colors with SassScript"
date: 2014-05-28T11:45:00+02:00
lang: en
---

<span class="p-summary">Preprocessors – it's the new hot thing in the frontend world. Sass is what makes you cool – Sass is what makes a site great. At least that's how the talk goes.</span>

Preprocessors – they give us nested CSS rules, mixins, extends – but do they stop us from making the same stupid mistakes we always do?

When we revisit code a year later or have a team mate help us out in the middle of a "quick" "easy" panic change – aren't we just as prone to do something wrong now as before?

Are preprocessors just a flashy new way of writing the same dumb things we've always done before? If we just do the nesting and mixins – then yes – absolutely. But if we also do some scripting – then no – not at all.

At [Valtech Tech Day](http://www.valtechday.se/) this week I covered some ways dumb stylesheets can be made smart and how SassScript can be key in avoiding stupid mistakes and bringing designs to new levels of perfection.

I presented three examples – all centered around my [sass-color-helpers](https://github.com/voxpelli/sass-color-helpers) library, which I also released during Valtech Tech Day.

1. I discussed how SassScript can apply **consistent color tones** across all elements of a site, through automatic calculations and conversions of colors in different color spaces – HSV, RGB etc.

2. I also went into how SassScript can **measure contrast ratios** – either alerting us when text becomes unreadable (according to WCAG 2.0 guidelines and such) or taking action itself to mitigate it.

3. Lastly I also brought up how SassScripts can be used to **estimate transparencies and colors** of complex flat reference designs (.png, jpg rather than layered .psd) and thus ensure that we get the colors right without guessing – getting clear, traceable and repeatable colors in our stylesheets even when the reference designs are lacking.

4. And as some sugar coating I also ended by geeking out about how one can extend eg. the math libraries available to SassScript so that **even the tougher algorithms** can be implemented in it. Solving a pow($x, 2.4) anyone?

All **the code and examples** from my presentation, along with some documentation, have been **released [freely on GitHub](https://github.com/voxpelli/sass-color-helpers)** and I have also published it to **Bower** – "**sass-color-helpers**".

The presentation itself was in swedish – if you understand that exotic language then you may also take delight in that one – I'll embed it at the end of this post.

I urge you all to go out there and make your stylesheets smarter, more fool proof and more powerful by using SassScript – and perhaps even send me a pull request, support question or feature request in the process if you decide to use my code to improve your colors.

<script async class="speakerdeck-embed" data-id="972c51a0c87701319c445efb9fab1d64" data-ratio="1.77777777777778" src="//speakerdeck.com/assets/embed.js"></script>
