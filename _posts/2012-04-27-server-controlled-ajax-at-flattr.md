---
layout: post
title: "Server-controlled AJAX at Flattr"
lang: en
---
### The short story, distilled to its essence

We built the AJAX-parts for the new social feed feature with a combination of [jquery.form.js](http://jquery.malsup.com/form/) and [jquery.alterbyobject.js](https://github.com/voxpelli/jquery-alterbyobject) – a combo that leaves the server in constant control of what's happening.

The server defines regular forms for the AJAX-requests and then defines JSON-responses to those requests that specifies how pages should be altered.

All in all a clean and easy solution for keeping AJAX DRY in your regular server-side MVC site.

{% highlight js %}
(function () {
  var handleModifyResponse = function (data, statusText, xhr, $form) {
    if (data.targets) {
      $form.alterByObject(data.targets);
    }
  };

  $('form#epic-one').ajaxForm({
    dataType: 'json',
    success: handleModifyResponse
  });
}());
{% endhighlight %}

### The long story where I write a lot and use cool words

In building the new social feed feature on Flattr.com I once again came across the issue of deciding who would be controlling the interface – would it be client-side javascript or server-side php?

Initially it feels good to hack some javascript and make everything go swooshy and pretty – but when it comes to saving changes in the database and rendering views, then that's typically something handles by the server-side. Hacking is cool – but duplicating your normal form- and template-methods just to go all swooshy? It will cause headaches and isn't cool.

So, after hacking some javascripts and realizing that I was yet again beginning to hard code the interactions of a page I decided that enough was enough and that I needed a solution that scaled.

I wasn't very keen on reinventing our form system and dealing with CSRF-protecting etc. yet again so I searched in my memory and found the very nice but mildy forgotten [jQuery Form plugin](http://jquery.malsup.com/form/). I could hook that on top of an ordinary form and it would make it go all ajaxy and swooshy and cool without duplicating any of the existing form logic – awesome.

But saving stuff wasn't enough – without any visual feedback it would be a lousy experience. So - question was if the server should respond with a HTML replacement or with a JSON containing just the needed data? Well - the server-side would in this case often not have enough data about the context to really re-render everything so I needed something more granular. JSON it was.

What to include in the JSON? Well – in the past I have often just returned the minimal amount of data needed for the javascript to, with its own renderers and templates, make all changes - but this time I was lazy. Why assemble a custom JSON on the server-side just to have even more custom code on the client to could make use of that specific JSON? It felt like yet another case of duplication – surely it could be done easier.

That's when I created the [jQuery alterByObject plugin](https://github.com/voxpelli/jquery-alterbyobject). It takes a JSON-object that describes a few targets within a context and a few rules by which to change those targets. Targets can in turn have targets themselves so it can get very granular – all without any custom code on the client-side.

Pair the alterByObject and the jQuery Form plugins with a standard response handler and you have a flow where the server-side is in control from start to finish. The server describes how the client-side should react to changes that has been made through a server-side rendered form so that the server-side rendered page looks like the server wants it to look – clean and simple.

I started using this pattern on the main social feed page on Flattr, then carried it over to the first configuration pages for the social feed, then to all of them and lastly I added it to the follow buttons on the profile pages and it all works beautifully – from super large masonry layouts to super tiny follow buttons the javascript responsible for submitting changes and providing feedback is all the same and works superb for everything.

All in all I'm very happy with the result. It's perhaps not the prettiest of solutions code wise but it's easy to implement, works like it should and gives no headache. I also heard someone say that beauty isn't everything and I would say that alterByObject and jQuery Form is a pretty cool solution for making things all swooshy, ajaxy and awesome – in the end it's not how the code looks but how well the user interfaces works that matters.

Try it yourself!