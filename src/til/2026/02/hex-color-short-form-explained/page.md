---
layout: article
title: 'Short hex in CSS is just 32-bit color, one digit per nibble'
date: '2026-02-03T21:12:28.757Z'
category: til
lang: en
tags: [css, color, hex]
topic: css
via: 'https://bsky.app/profile/voxpelli.com/post/3mdybmqjvz22o'
---
Quoting [Ben Hong](https://bsky.app/profile/bencodezen.io/post/3mdxy5j6gqs2k):

> I've been working with CSS for more than 10 years and #TIL that apparently there is a hex color code for "transparent": #0000

That's actually the 32 bit color system in short hex form.

1 byte / 8 bits for every channel (red, green, blue, alpha).
8 bits = 2^8 = 256 (0 to 255).

Short hex form in CSS color duplicates every hex digit when resolved:

```
#1234 = #11223344 (rgba)
```

Every channel expresses a relative value between the min and max of that channel within the color space used (mostly sRGB).

`#1234` =

- Red: 0x11 = 17 &asymp; 6.67% of 255
- Green: 0x22 = 34 &asymp; 13.33% of 255
- Blue: 0x33 = 51 = 20% of 255
- Alpha: 0x44 = 68 = 26.67% of 255

So, in sRGB it's that color at roughly 25% opaque.

## More bits per channel

If we skip spending 8 bits on alpha precision and spend them on color instead, then we get what e.g. HDR10 has: 10 bits per color for a total of 30 bit.

2^10 = 1 024

So we get four times the precision per color channel and as such can get four times as smooth gradients.

Though the secret sauce of something like HDR10 is not just that it uses 10 bit colors and thus gets four times the precision per color channel &mdash; it's that it also has a much wider color space to use that precision in. Apparently [Rec. 2020](https://en.wikipedia.org/wiki/Rec._2020):

> In coverage of the CIE 1931 color space, the Rec. 2020 color space covers 75.8%, the DCI-P3 digital cinema color space covers 53.6%, the Adobe RGB color space covers 52.1%, and the Rec. 709 color space covers 35.9%.

Rec. 709 and sRGB being roughly the same.

<small>(Originally posted as a [thread on Bluesky](https://bsky.app/profile/voxpelli.com/post/3mdybmqjvz22o).)</small>
