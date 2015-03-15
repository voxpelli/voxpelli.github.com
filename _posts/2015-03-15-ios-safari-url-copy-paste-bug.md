---
layout: post
title: "iOS Safari URL copy & paste bug"
date: 2015-03-15T18:15:00+01:00
lang: en
---

Every now and then one stumbles upon a bug that turns out weirder than it initially looked. What I thought to be some JavaScript that blocked some pasting from working out appeared to be a Safari iOS bug.

So – what's the bug? Well – turns out that iOS Safari refuses to paste a URL copied from its own share sheet into any HTML input field. It's like it believes the URL isn't valid input – like its an image or something.

## Steps to reproduce

As a gif:

![Reproduce iOS URL bug]({{ site.url }}/images/2015-03-15/iosbug.gif)

Or on the [same JSBin](http://jsbin.com/yotoli/1/) or eg. [Google](https://www.google.com/) do:

1. Copy URL from share sheet
2. Go to text input field in HTML – try to paste
3. Find out you're unsuccessful
4. Try the URL input field
5. Still no success
6. Paste the URL into a random application, like Notes.app, and copy it again
7. Try pasting it into one of the fields again – it works, right?

## Why is it like this?

No idea.

I guess that there's some kind of metadata added to the URL copied from Safari that tells application what's in the clipboard and that Safari itself interprets that metadata as saying that the URL data isn't valid text data – even for input fields of type "url".

Copying the full URL from the address bar of Safari or a URL from a text source like Notes.app doesn't give the same error. Only place I've found that sets the metadata that Safari then misinterprets is the "Copy" button of the Safari share sheet itself.

## Is there a workaround?

Not that I know of. Except for not asking your users to paste URL:s into fields like this in iOS Safari. Which eg. makes the WebMentions field I myself have on this very blog a bit hard to achieve.

Would love to hear if anyone has had any experience with this themselves or found solutions to it.

Ping me on [@voxpelli](http://twitter.com/voxpelli) or [WebMention](http://indiewebcamp.com/webmention) me on this post.
