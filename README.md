# for-more
[![npm version](https://badge.fury.io/js/for-more.svg)](https://badge.fury.io/js/for-more)
[![Gzip Size](http://img.badgesize.io/https://unpkg.com/for-more@latest/dist/index.umd.min.js?compression=gzip&style=flat-square)](https://unpkg.com/for-more)
[![Monthly Downloads](https://img.shields.io/npm/dm/for-more.svg)](https://www.npmjs.com/package/for-more)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Build Status](https://img.shields.io/github/actions/workflow/status/mlinquan/for-more/ci.yml?branch=main)](https://github.com/mlinquan/for-more/actions)
[![Coverage Status](https://coveralls.io/repos/github/mlinquan/for-more/badge.svg?branch=main)](https://coveralls.io/github/mlinquan/for-more?branch=main)

> A powerful and flexible multithread synchronization loop library with Promise support, TypeScript integration, and cancelable execution.

## 📋 Table of Contents

- [Features](#-features)
- [Installation](#-installation)
- [Import](#-import)
- [Usage](#-usage)
  - [Basic Usage](#basic-usage)
  - [Async/Await Support](#asyncawait-support)
  - [Concurrency Control](#concurrency-control)
  - [Error Handling](#error-handling)
  - [Callback Support](#callback-support)
  - [Cancel Execution](#cancel-execution)
  - [Array-like Objects](#array-like-objects)
  - [TypeScript Usage](#typescript-usage)
- [API Reference](#-api-reference)
  - [forMore(array, options, handler, callback)](#formorearray-options-handler-callback)
  - [array.forMore(options, handler, callback)](#arrayformoreoptions-handler-callback)
  - [ForMoreOptions](#formoreoptions)
  - [CancellablePromise](#cancellablepromise)
- [Module Formats](#-module-formats)
- [Browser Support](#-browser-support)
- [Performance](#-performance)
- [Contributing](#-contributing)
- [License](#-license)

## ✨ Features

- 🔄 **Multithread Synchronization Loop**
- 🤝 **Promise Support** with async/await compatibility
- 📝 **TypeScript Ready** with full type definitions
- 🔧 **Multiple Module Formats**: CommonJS, ESM, UMD
- ⚡ **Concurrency Control**: Configure parallel execution with `lines` or `concurrency`
- 🛑 **Cancelable Execution**: Abort ongoing operations at any time
- 🎯 **Flexible Error Handling**: Custom error handlers and abort options
- 📦 **Lightweight**: Small bundle size (~2KB gzipped)
- 🚀 **High Performance**: Optimized for parallel execution
- 🔗 **Array Prototype Extension**: Use as `array.forMore()` method
- 🔢 **Array-like Objects Support**: Works with any array-like structure

## 📦 Installation

```bash
npm install for-more --save
# or
yarn add for-more
# or
pnpm add for-more
```

## 📥 Import

### CommonJS

```js
const forMore = require('for-more');
require('for-more'); // Extends Array.prototype
```

### ES Module

```js
import forMore from 'for-more';
import 'for-more'; // Extends Array.prototype
```

### UMD (Browser)

```html
<script src="https://unpkg.com/for-more"></script>
<!-- or minified -->
<script src="https://unpkg.com/for-more/dist/index.umd.min.js"></script>
```

## 🚀 Usage

### Basic Usage

```js
// Using as a function
forMore([1, 2, 3], 2, function(item, index, array) {
  return item * 2;
}).then(results => {
  console.log(results); // [2, 4, 6]
});

// Using as an Array method
[1, 2, 3].forMore(2, function(item, index, array) {
  return item * 2;
}).then(results => {
  console.log(results); // [2, 4, 6]
});

// Simplified syntax (default concurrency = 1)
[1, 2, 3].forMore(function(item) {
  return item * 2;
}).then(results => {
  console.log(results); // [2, 4, 6]
});
```

### Async/Await Support

```js
// Using async/await with forMore
async function processData() {
  const results = await [1, 2, 3].forMore(2, async function(item, index, array) {
    const response = await fetch(`https://api.example.com/data/${item}`);
    return response.json();
  });
  console.log(results); // Array of fetched data
}

processData();

// Mixed sync and async operations
[1, 2, 3].forMore(2, function(item) {
  if (item % 2 === 0) {
    // Async operation for even numbers
    return new Promise(resolve => {
      setTimeout(() => resolve(item * 2), 100);
    });
  }
  // Sync operation for odd numbers
  return item * 2;
}).then(results => {
  console.log(results); // [2, 4, 6]
});
```

### Concurrency Control

```js
// Using lines option
[1, 2, 3, 4, 5].forMore({
  lines: 3 // Run 3 parallel operations at a time
}, async function(item) {
  await new Promise(resolve => setTimeout(resolve, 50));
  return item;
}).then(results => {
  console.log(results); // [1, 2, 3, 4, 5]
});

// Using concurrency option (alias for lines)
[1, 2, 3, 4, 5].forMore({
  concurrency: 3 // Same as lines: 3
}, async function(item) {
  await new Promise(resolve => setTimeout(resolve, 50));
  return item;
}).then(results => {
  console.log(results); // [1, 2, 3, 4, 5]
});
```

### Error Handling

```js
// Default behavior: Continue on error
[1, 2, 3].forMore(2, function(item) {
  if (item === 2) {
    throw new Error('Test error');
  }
  return item * 2;
}).then(results => {
  console.log(results); // [2, Error, 6]
});

// Abort on error
[1, 2, 3].forMore({
  lines: 2,
  abort: true // Stop execution on first error
}, function(item) {
  if (item === 2) {
    throw new Error('Test error');
  }
  return item * 2;
}).catch(error => {
  console.error(error); // Test error
});

// Custom error handler
[1, 2, 3].forMore({
  lines: 2,
  onError: function(error, index, item) {
    console.error(`Error at index ${index}: ${error.message}`);
    return false; // Return true to abort, false to continue
  }
}, function(item) {
  if (item === 2) {
    throw new Error('Test error');
  }
  return item * 2;
}).then(results => {
  console.log(results); // [2, Error, 6]
});
```

### Callback Support

```js
// Using callback instead of Promise
[1, 2, 3].forMore(2, function(item) {
  return item * 2;
}, function(results, originalArray) {
  console.log(results); // [2, 4, 6]
  console.log(originalArray); // [1, 2, 3]
});

// With both Promise and callback (Promise still resolves)
[1, 2, 3].forMore(2, function(item) {
  return item * 2;
}, function(results) {
  console.log('Callback called:', results);
}).then(results => {
  console.log('Promise resolved:', results);
});
```

### Cancel Execution

```js
// Create a cancellable promise
const promise = [1, 2, 3, 4, 5].forMore(2, async function(item) {
  await new Promise(resolve => setTimeout(resolve, 100));
  return item;
});

// Cancel after 150ms
setTimeout(() => {
  console.log('Cancelling execution...');
  promise.cancel();
}, 150);

promise
  .then(results => {
    console.log('Completed:', results);
  })
  .catch(error => {
    console.error('Error:', error);
  });
```

### Array-like Objects

```js
// Using with NodeList
const elements = document.querySelectorAll('div');
forMore(elements, 2, function(element, index) {
  return element.textContent;
}).then(textContents => {
  console.log(textContents);
});

// Using with custom array-like object
const arrayLike = { 0: 1, 1: 2, 2: 3, length: 3 };
forMore(arrayLike, 2, function(item) {
  return item * 2;
}).then(results => {
  console.log(results); // [2, 4, 6]
});
```

### TypeScript Usage

```typescript
import forMore from 'for-more';
import 'for-more'; // Extends Array.prototype

interface User {
  id: number;
  name: string;
}

const users: User[] = [{ id: 1, name: 'Alice' }, { id: 2, name: 'Bob' }, { id: 3, name: 'Charlie' }];

// Basic TypeScript usage
users.forMore<User, number>(2, (user: User, index: number) => {
  return user.id * 2;
}).then((results: number[]) => {
  console.log(results); // [2, 4, 6]
});

// Async TypeScript usage
users.forMore<User, Promise<string>>(2, async (user: User) => {
  const response = await fetch(`https://api.example.com/users/${user.id}`);
  const data = await response.json();
  return data.name;
}).then((results: string[]) => {
  console.log(results); // Array of user names from API
});

// Using with options
users.forMore<User, number>({
  lines: 2,
  abort: true
}, (user: User) => {
  return user.id * 2;
}).then((results: number[]) => {
  console.log(results); // [2, 4, 6]
});
```

## 📖 API Reference

### forMore(array, options, handler, callback)

#### Parameters

- **array**: `Array | ArrayLike` - The array or array-like object to iterate over
- **options**: `number | ForMoreOptions` - Configuration options or number of parallel lines
- **handler**: `ForMoreCallback<T, U>` - The function to execute for each item
  - **item**: `T` - The current item being processed
  - **index**: `number` - The index of the current item
  - **array**: `T[]` - The original array
  - **returns**: `U | Promise<U>` - The result of processing the item
- **callback**: `Function` (optional) - Callback function when all items are processed
  - **results**: `U[]` - The results of all processed items
  - **originalArray**: `T[]` - The original array

#### Returns

- `CancellablePromise<U[]>` - A promise that resolves with the results of all processed items

### array.forMore(options, handler, callback)

Same as `forMore(array, options, handler, callback)`, but as a method on the Array prototype.

### ForMoreOptions

```typescript
type ForMoreOptions = {
  /** Number of parallel execution lines (default: 1) */
  lines?: number;
  /** Alias for lines, number of concurrent operations (default: 1) */
  concurrency?: number;
  /** Abort on error (default: false) */
  abort?: boolean;
  /** Custom Promise library (default: global Promise) */
  promiseLibrary?: PromiseConstructor;
  /** Callback function when all items are processed */
  callback?: (results: any[], originalArray: any[]) => void;
  /** Custom error handler, return true to abort */
  onError?: (error: any, index: number, item: any) => boolean;
};
```

### CancellablePromise

```typescript
type CancellablePromise<T> = Promise<T> & {
  /** Cancel ongoing execution */
  cancel: () => void;
};
```

## 📦 Module Formats

The library is available in multiple formats:

| Format | File | Entry Point |
|--------|------|-------------|
| CommonJS | `dist/index.cjs.js` | `main` |
| ES Module | `dist/index.esm.js` | `module` |
| UMD | `dist/index.umd.js` | `unpkg` |
| UMD (minified) | `dist/index.umd.min.js` | - |
| TypeScript Definitions | `dist/index.d.ts` | `types` |

## 🌐 Browser Support

| Chrome | Firefox | Safari | Edge | IE |
|--------|---------|--------|------|----|
| ✅ 60+ | ✅ 55+ | ✅ 11+ | ✅ 79+ | ✅ 10+ |

## ⚡ Performance

- **Bundle Size**: ~2KB gzipped
- **Execution Speed**: Optimized for parallel execution
- **Memory Usage**: Efficient memory management
- **Scalability**: Handles large arrays with ease

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

### Development Setup

```bash
# Install dependencies
npm install

# Build the library
npm run build

# Run tests
npm test

# Run tests with coverage
npm run test:coverage

# Watch for changes and rebuild
npm run watch
```

## 📄 License

MIT

## 📞 Contact

- **Author**: LinQuan
- **GitHub**: [https://github.com/mlinquan/for-more](https://github.com/mlinquan/for-more)
- **NPM**: [https://www.npmjs.com/package/for-more](https://www.npmjs.com/package/for-more)

---

**for-more** - Your reliable multithread synchronization loop library! 🚀