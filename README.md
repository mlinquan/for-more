# for-more
[![npm version](https://badge.fury.io/js/for-more.svg)](https://badge.fury.io/js/for-more)
[![Gzip Size](http://img.badgesize.io/https://unpkg.com/for-more@latest/dist/for-more.umd.min.js?compression=gzip&style=flat-square)](https://unpkg.com/for-more)
[![Monthly Downloads](https://img.shields.io/npm/dm/for-more.svg)](https://www.npmjs.com/package/for-more)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

> Multithread Synchronization Loop. Support Promise.

## Install

```bash
npm install for-more --save
#or
yarn add for-more
```

## Import

```js
require('for-more')
//or
var forMore = require('for-more')
//or
import 'for-more'
//or
import forMore from 'for-more'
```

## Usage

```js
// forMore([], options, hander, callback)
// [].forMore(options, handler, callback)
// [].forMore(options, handler).then().catch()
// [].forMore(lines, handler).then().catch()
// [].forMore(handler).then().catch()

[1, 2, 3].forMore(2, function(item, index, array) {
  return item * 2
})
.then(function(results) {
  console.log(results)
})
// [2, 4, 6]

[1, 2, 3].forMore(2, async function(item, index, array) {
  const html = await axios.get('http://www.google.com?q=' + item)
  return html.data
}, function(results) {
  console.log(results)
})

[1, 2, 3].forMore({
  lines: 2, // default is 1
  abort: true // default is false
}, async function(item, index, array) {
  const html = await axios.get('http://www.google.com?q=' + item)
  return html.data
}, function(results) {
  console.log(results)
})

```
