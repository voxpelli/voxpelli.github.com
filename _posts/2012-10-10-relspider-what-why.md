---
layout: post
title: "RelSpider - what and why?"
lang: en
---

The ones following me at GitHub, Twitter and so has perhaps noticed that I've been doing some work on something I call "[RelSpider](https://github.com/voxpelli/relspider)" and perhaps the ones who have seen that has wondered a bit why I've done so and even more why they should care about it.

So - someone pointed me to this blog format thing (thanks [@frebro](https://twitter.com/frebro) - I should do more posts here). Perhaps I should explain it a bit here? Therefor: Here's a quick blog post written after a long day with a lot of coffee.

## RelSpider - I should care because?

You should care because you like me and many other web geeks (Hi Bubblan!) love new cool web services - you're an early adopter that sign up right away - but then what? Who else are on this new service? What stuff there is cool? New services are isolated islands separated from all that I know - but why?

Why indeed - there's no reason for these separated islands. Our internet alter egos don't have to be rebuilt again and again - just like in real life they can be one - consolidated and known everywhere. The data is there - services can already be linked together through [just some simple links](http://microformats.org/wiki/identity-consolidation) - Twitter, GitHub, G+ etc supports it - but who to draw the lines between them and the circle around them? Until earlier this year Google provided an index of all of these relations - their Social Graph API - but at the same time that they started using it themselves in their social search and G+ they decided to shut down the public API.

## RelSpider - what is it?

RelSpider is a proof-of-concept identity graph crawler - it spiders public links that people have added to their profile pages and compiles them into identity graphs that services can ask questions about. Wonder what other identities *A* have and get the response that *A* considers itself to also be *B*, *C* and *D* (or a more [extreme count](http://relspider.herokuapp.com/api/lookup?url=http://twitter.com/voxpelli) of sites)

It's still very much a work in progress - I'm doing some work on it every now and then when I feel like having a break in my studies - but since a few days it at leasts has all the basic features needed for people to actually experiment with it themselves. The index work - now it's just needs some hardening and optimization (and refactoring and some cool features and a double rainbow and a pink unicorn).

## Examples, please, examples!

Take a site like [Hackernytt](http://hackernytt.se/) or [Flattr](https://flattr.com/) (Disclaimer: I used to work for Flattr) - these sites have people vote and donate to stuff created by other people. The main activity comes from someone else than the creator and eg. Flattr did therefor initially require the creators to claim that they owned a piece of content prior to someone being allowed to reward it for the creation of it. But what if I think that someone is worthy a donation that the author could never had figured out that I would consider donation worthy? Should I not be able to donate to that? Why?

Sites like [Hackernytt](http://hackernytt.se/) and [Flattr](https://flattr.com/) should be able to tie the stuff others act on back into their existing social graph - if a piece of content is authored by someone that's already a member of the site then that connection should be discoverable without the creator having to do so manually.

A simple query to RelSpider solves this - ask for the complete identity graph of the content author and match that against known identities of your members - if a connection is found then establish that member as the owner of the content. (Of course some additional steps can be taken to make this more secure - but still the same basic procedure)

## Conclusion

[RelSpider](https://github.com/voxpelli/relspider) makes it possible to make connections between the same users on different platforms. It's an identity graph based on similar public data as the ones used by Google in their social search. The use cases are many - one is to identity the authors of content posted to ones site and make a connection to those authors own accounts on the site. It's a proof-of-concept for now - but it works and that's what matters because that means it can be a starting point for something else.

## (I want to try)

Very well - go to [http://relspider.herokuapp.com/](http://relspider.herokuapp.com/) and go nuts (just please don't kill my free Heroku instance). API-methods can be found [in the README](https://github.com/voxpelli/relspider#api-methods). Just take note: I might and probably will change things and reset things - if you want to do an experimental real world implementation (which I would love!) - then please tell me :)