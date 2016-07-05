---
layout: post
title: "3 tricks to better handle npm modules"
date: 2016-07-05T19:10:00+02:00
lang: en
---

Developing with npm modules isn't just installing modules and then updating them. In a team environment you might not even know when a new module should be installed or when its version requirement has changed. This can cause lots of weird unexpected behaviors when the installed modules doesn't match the expectations of the app – and that annoys and is a waste of time.

Here I'll give you three tricks to avoid that. Tricks which I've begun to use over the years and which we're currently using at my latest project, the development of the new sites for [Sydsvenskan](http://www.sydsvenskan.se/) and [HD](http://www.hd.se/).

## 1. Verify installed versions against package.json

When rapidly developing a new site, establishing the basic features etc, new modules gets added quite a lot. Often after a rebase one realize that one is missing a module after ones [nodemon](http://nodemon.io/) process suddenly crash with some unexpected weird error.

I created [installed-check](https://github.com/voxpelli/node-installed-check) to solve that. To have a script I could run to check if my installed modules still fulfilled the requirements set out by the package.json or whether it was time to install some more. All checked locally, without any slow network lookups or such.

If any module were missing or were outside the version requirements it would exit with an error.

I then hooked that script into my `npm test` script and into [husky](https://github.com/typicode/husky) (at `postapplypatch` and `postmerge`) so that whenever I pulled down new code or ran my tests it verified that my installation was up to date.

With that in place everyone in the team could stop worry about whether they were missing a module locally and we could all stop wasting time debugging issues that were due to changes in the package.json requirements. Happy developers!

## 2. Verify that package.json is in sync with actual module usage

While tests may pass just fine locally, if one doesn't commit all the dependency requirements then it's hard for them to pass anywhere else.

Likewise refactored code may work just fine, but one may not have realized that a removed `require()` was the very last one for a given module.

Therefore I always run [dependency-check](https://github.com/maxogden/dependency-check) (which I now co-maintain) in my `npm test`. To ensure that uncommitted dependencies are caught early and that no extra modules are kept around and weighing down the project after they are no longer in use.

I also make `npm test` run before code is pushed remotely by setting up a `prepush` git hook using [husky](https://github.com/typicode/husky). That way neither I or anyone else in the team can accidentally push code with any such mistakes. (I've found `prepush` to work better for this than `precommit` – more pragmatic, with happier developers as a result)

## 3. Verify engine requirements of installed modules

How do you express what versions of node.js your library supports? There's the [engines field](https://docs.npmjs.com/files/package.json#engines) in package.json for that:

```json
"engines": {
  "node": ">=5.0.0"
}
```

Simple. You know what engine you support and you politely tell others so that they easily can find out as well.

But how do you detect when others update their requirements and how do you avoid that you get dependencies that have stricter engine requirements than you yourself have? Surely there must be able to verify that automatically?

Check out the just released `2.0.0` version of [installed-check](https://github.com/voxpelli/node-installed-check): It has a new optional flag, `--engine-check`, that makes it also check the engine requirements of all of the installed dependencies.

If the engine requirements of any installed dependencies doesn't match yours, then an error will be returned along with a suggestion of a stricter engine requirement whenever possible.

By running that in your `npm test` you can easily early detect whenever an engine requirement change and either avoid the change altogether or move along with it and release a new major version yourself with the new stricter engine requirements. (Changed engine requirements are always to be considered a breaking change, which requires a new major version according to [Semantic Versioning](http://semver.org/))

Only gotcha with this approach is that not all modules explicitly define their engine requirements in their package.json. By default installed-check ignores any such modules and doesn't treat undefined engine requirements as an error. By setting either or both of the `--verbose` and `--strict` flags one can make it warn or throw errors whenever it encounters such a module though.

## Example: Run all the tricks

Install the modules:

```bash
npm install --save-dev installed-check
npm install --save-dev dependency-check
npm install --save-dev husky
```

Set them up to run:

```json
{
  "scripts": {
    "test": "installed-check -e && dependency-check . && dependency-check . --extra --no-dev",
    "prepush": "npm test",
    "postapplypatch": "installed-check -e",
    "postmerge": "installed-check -e"
  }
}
```

Then profit from a more solid dependency workflow and a more happy development team!
