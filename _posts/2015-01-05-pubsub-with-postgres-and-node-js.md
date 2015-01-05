---
layout: post
title: "Publish/subscribe with Postgres and Node.js"
date: 2015-01-05T21:00:00+01:00
lang: en
---

A few years ago *realtime* was the buzzword of the day. The killer feature of something could be that it did something old – but in *realtime*.

Nowadays realtime is something that we’ve come to expect. Tweets, comments, news – all content should be delivered to you right away, no matter if you’re browsing the web or walking around with the phone in your pocket.

But solving *realtime* in code hasn’t become as straight forward. The typical simple web application just saves stuff to a database. It pushes to it and it pulls from it. And there’s no *realtime* in pulling.

To solve *realtime* one needs to add a push to the pull. A message queue system like [RabbitMQ](http://www.rabbitmq.com/) excels at that, but adding an extra dependency to an application adds complexity and might scare you of. The alternative many would point to is Redis, but you may not be aware that your current database might have a publish/subscribe system built in to it.

If you use Postgres it does.

## Realtimeness for WebMentions

When [Stuart Langridge](http://www.kryogenix.org/) sent me a [pull request](https://github.com/voxpelli/webpage-webmentions/pull/14) for a realtime [EventSource](https://developer.mozilla.org/en-US/docs/Server-sent_events/Using_server-sent_events) endpoint for my [WebMention endpoint](https://webmention.herokuapp.com/) I was thrilled and saw an opportunity to try out something I had heard about long ago: PostgreSQL:s [`LISTEN`](http://www.postgresql.org/docs/9.3/static/sql-listen.html) and [`NOTIFY`](http://www.postgresql.org/docs/9.3/static/sql-notify.html). They would enable the endpoint to scale horizontally beyond a single instance – which for Node.js in general, and [Heroku](http://heroku.com/) hosting in particular, is great. All without any extra dependencies and the complexities they would add when it comes to hosting environments etc.

## Postgres Pubsub and the pg-pubsub module

Publishing is simple in Postgres. Using the ordinary database connection one just sends a `NOTIFY` query with an arbitrary channel name (doesn’t have to be predefined) and optionally a text payload to accompany it. In my case the query looked like:

```
NOTIFY mentions, '{"eid":123}'
```

Subscribing is also simple, one just do:

```
LISTEN mentions
```

But maintaining a persistent connection over time with retrial on failures as well as ensuring that all subscriptions are properly set up for each connection and teared down on application shutdown takes a bit more code – not much – but a little.

So I then created the [pg-pubsub](https://www.npmjs.com/package/pg-pubsub) module to package all that code behind a neat little interface and have it maintain a persistent connection, subscribe to notification channels and retry on connection failures for me.

I decided to utilise my newly created [promised-retry](https://www.npmjs.com/package/promised-retry) module to set up theretry mechanism and then added the simple `addChannel
()`, `removeChannel()` and `close()` methods that one would expect from a publish/subscribe listener to enable the setup and teardown of the module.

All in all that resulted all you needing to do to subscribe to Postgres notifications being:

{% highlight javascript %}
var PGPubsub = require('pg-pubsub');

var pubsubInstance = new PGPubsub('postgres://username@localhost/tablename');

pubsubInstance.addChannel('channelName', function (channelPayload) {
  // Handle the notification and its payload
  // If the payload was JSON it has already been parsed for you
});
{% endhighlight %}

## Conclusion

So – if you’re already using Postgres (if you’re not, then you should consider doing so for [other reasons](http://www.databasesoup.com/2014/12/your-hanukkah-present-postgresql-94.html)) then this is likely the simplest way you could go about adding some realtimeness to your multi-instance Node.js application. A simple `NOTIFY` query whenever something interesting happens and simple listener instance for receiving them.

I haven’t dug into the performance of `LISTEN`/`NOTIFY` compared to full message queues or [Redis Pubsub](http://redis.io/topics/pubsub), but for prototyping and getting something up and running as well as for the simplicity of a project in regards to external dependencies it certainly wins over the alternatives. And switching later on would be fairly straight forward. Pubsub-mechanisms isn’t really rocket science. Making a RabbitMQ-wrapper with the same API as [pg-pubsub](https://www.npmjs.com/package/pg-pubsub) would be very simple.
