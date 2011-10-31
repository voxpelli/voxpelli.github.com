--- 
layout: post
title: "Activity Streams in Flattr API v2"
lang: en
---
Last week we [announced](http://blog.flattr.net/2011/10/api-v2-beta-out-whats-changed/) a public beta of the [next generation Flattr API](https://developers.flattr.net/v2/). Our last API became a dead end so we decided to rebuild it from scratch with extendability and maintainability in mind and while doing that we decided to throw in some candy as well - the new API eg. uses the now standard combo of [OAuth 2](http://tools.ietf.org/html/draft-ietf-oauth-v2) and [Bearer Tokens](http://tools.ietf.org/html/draft-ietf-oauth-v2-bearer) for authentication and also supports the even more standard JSON as a response format in addition to a [few other formats](https://developers.flattr.net/v2/#formats).

One of the additions I think is most interesting though (not only because it was the part I was responsible for) is the support for the [Activity Streams](http://activitystrea.ms/) standard. Our new API supports exposing "feed"-responses and uses both the original [Activity Streams sprinkled Atom-feeds](http://activitystrea.ms/specs/atom/1.0/) and the newer [JSON-based Activity Streams](http://activitystrea.ms/specs/json/1.0/) format to do that.

The Activity Streams standard describes a format for describing activities that happen within a platform in a way that other platforms can understand and eg. aggregate into something like Facebook's news feed. In the future this can together with a few other standards enable classic feed readers to get a more social dimension and perhaps even challenge Facebook (yeah - I'm dreaming - okay).

Our new Flattr API exposes two activity types through Activity Stream feeds - the posting of things and the flattring of things. These are found in the "things" and "flattrs" feed subresources on user resources. We're using the [verbs](http://activitystrea.ms/registry/verbs/) "post" and "like" for the activities and we're representing the things as objects of the "[bookmark](http://activitystrea.ms/head/activity-schema.html#bookmark)" type. The "like" verb and "bookmark" [object type](http://activitystrea.ms/registry/object_types/) aren't perfect matches - but I do think that they are the closest matches to what flattrs and things are - any suggestions on better alternatives would be very welcome though.

So what do an activity look like? Lets take two examples:

Post activity from me ([source](https://api.flattr.com/rest/v2/users/voxpelli/things.as)):

{% highlight js %}
{
  "published":"2011-08-09T15:03:18+02:00",
  "title":"Moving to Jekyll and English",
  "actor":{
    "displayName":"VoxPelli",
    "url":"https:\/\/flattr.com\/user\/VoxPelli",
    "objectType":"person"
  },
  "verb":"post",
  "object":{
    "displayName":"Moving to Jekyll and English",
    "url":"https:\/\/flattr.com\/thing\/370001",
    "objectType":"bookmark",
    "targetUrl":"http:\/\/voxpelli.com\/2011\/08\/moving-to-jekyll-and-english"
  },
  "url":"https:\/\/flattr.com\/thing\/370001",
  "id":"tag:flattr.com,2011:things\/370001"
}
{% endhighlight %}

Flattr activity from the Flattr student [Melpomene](https://flattr.com/profile/Melpomene) ([source](https://api.flattr.com/rest/v2/users/melpomene/flattrs.as)):

{% highlight js %}
{
  "published":"2011-10-30T18:20:46+01:00",
  "title":"Melpomene flattred \"Flattr: Problem #1 that's not really a problem\"",
  "actor":{
    "displayName":"Melpomene",
    "url":"https:\/\/flattr.com\/user\/Melpomene",
    "objectType":"person"
  },
  "verb":"like",
  "object":{
    "display Name":"Flattr: Problem #1 that's not really a problem",
    "url":"https:\/\/flattr.com\/thing\/424979",
    "objectType":"bookmark",
    "targetUrl":"http:\/\/wp.me\/p1vmdd-iy",
    "author":
    {
      "displayName":"aeliusblythe",
      "url":"https:\/\/flattr.com\/thing\/424979",
      "objectType":"person"
    }
  },
  "id":"tag:flattr.com,2011-10-30:Melpomene\/flattr\/424979"
}
{% endhighlight %}

I hope we can extend these feeds in the future to make them even more useful. If you have any feedback or just want to tell how awesome these feeds are, then please contact me. I'm on [Twitter](http://twitter.com/voxpelli), [Google+](https://plus.google.com/114892733479367518317) and e-mail: [pelle@kodfabrik.se](mailto:pelle@kodfabrik.se)