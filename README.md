# voxpelli.com

Personal blog built with [DomStack](https://github.com/bcomnes/domstack) (`@domstack/static`).

## Setup

```bash
npm install
```

## Development

```bash
npm run dev
```

## Build

```bash
npm run build
```

## Test

```bash
npm test
```

## Ping Superfeedr

After adding a new post:

```bash
curl -X POST http://voxpelli.superfeedr.com/ -d "hub.mode=publish" -d "hub.url=http://voxpelli.com/all.xml"
curl -X POST http://voxpelli.superfeedr.com/ -d "hub.mode=publish" -d "hub.url=http://voxpelli.com/english.xml"
```
