# 02. Module System

## 📚 Overview

Node.js module system allows you to organize code into reusable pieces. It supports both CommonJS (traditional) and ES Modules (modern) syntax.

## 🎯 Key Concepts

### Module Types

1. **Core Modules** - Built into Node.js (fs, http, path, os)
2. **Local Modules** - Your own files
3. **Third-Party Modules** - npm packages

### CommonJS vs ES Modules

| Feature | CommonJS | ES Modules |
|---------|----------|------------|
| Syntax | `require()` / `module.exports` | `import` / `export` |
| Loading | Synchronous | Asynchronous |
| Analysis | Runtime | Compile-time |
| Tree-shaking | ❌ No | ✅ Yes |
| Top-level await | ❌ No | ✅ Yes |
| File extension | `.js`, `.cjs` | `.mjs`, `.js` with `"type": "module"` |

## 💻 Examples

### CommonJS (Traditional)

```javascript
// math.js - Exporting
function add(a, b) {
  return a + b;
}

function subtract(a, b) {
  return a - b;
}

// Export single function
module.exports = add;

// Export multiple functions
module.exports = {
  add,
  subtract
};

// Export as you define
exports.multiply = (a, b) => a * b;

// app.js - Importing
const math = require('./math');
console.log(math.add(5, 3)); // 8

// Destructure imports
const { add, subtract } = require('./math');
console.log(add(10, 5)); // 15
```

### ES Modules (Modern)

```javascript
// math.mjs - Exporting
export function add(a, b) {
  return a + b;
}

export function subtract(a, b) {
  return a - b;
}

// Default export
export default function multiply(a, b) {
  return a * b;
}

// app.mjs - Importing
import multiply, { add, subtract } from './math.mjs';

console.log(add(5, 3));      // 8
console.log(multiply(4, 2)); // 8

// Import everything
import * as math from './math.mjs';
console.log(math.add(10, 5)); // 15

// Rename imports
import { add as sum } from './math.mjs';
console.log(sum(7, 3)); // 10
```

### Path Module

```javascript
const path = require('path');

const filePath = '/users/john/documents/file.txt';

// Extract parts of path
console.log(path.basename(filePath));  // file.txt
console.log(path.dirname(filePath));   // /users/john/documents
console.log(path.extname(filePath));   // .txt

// Parse path
console.log(path.parse(filePath));
/* Output:
{
  root: '/',
  dir: '/users/john/documents',
  base: 'file.txt',
  ext: '.txt',
  name: 'file'
}
*/

// Join paths
const newPath = path.join('/users', 'john', 'documents', 'file.txt');
console.log(newPath); // /users/john/documents/file.txt

// Resolve absolute path
console.log(path.resolve('file.txt')); 
// /current/working/directory/file.txt

// Check if absolute
console.log(path.isAbsolute('/users/john')); // true
console.log(path.isAbsolute('file.txt'));    // false

// Normalize path (resolve .. and .)
console.log(path.normalize('/users/john/../jane/./file.txt'));
// /users/jane/file.txt

// Get relative path
console.log(path.relative('/users/john', '/users/jane'));
// ../jane

// Platform-specific separator
console.log(path.sep);     // '/' on Unix, '\\' on Windows
console.log(path.delimiter); // ':' on Unix, ';' on Windows
```

### OS Module

```javascript
const os = require('os');

// Platform information
console.log(os.platform());  // darwin, win32, linux
console.log(os.arch());      // x64, arm64
console.log(os.type());      // Darwin, Windows_NT, Linux
console.log(os.release());   // OS version

// System information
console.log(os.hostname());  // computer name
console.log(os.cpus());      // CPU information
console.log(os.cpus().length); // Number of CPUs

// Memory information
console.log(os.totalmem());  // Total memory in bytes
console.log(os.freemem());   // Free memory in bytes

// Convert to GB
const totalMemGB = (os.totalmem() / 1024 / 1024 / 1024).toFixed(2);
console.log(`Total Memory: ${totalMemGB} GB`);

// Directories
console.log(os.homedir());   // /Users/yourname
console.log(os.tmpdir());    // /tmp

// Uptime
console.log(os.uptime());    // System uptime in seconds

// Network interfaces
console.log(os.networkInterfaces());

// User information
console.log(os.userInfo());
/* Output:
{
  username: 'yourname',
  uid: 501,
  gid: 20,
  shell: '/bin/zsh',
  homedir: '/Users/yourname'
}
*/
```

### Module Resolution

```javascript
// Core modules (highest priority)
const fs = require('fs');
const http = require('http');

// Relative paths
const myModule = require('./myModule');      // Same directory
const utils = require('../utils/helper');    // Parent directory

// Absolute paths
const config = require('/absolute/path/config');

// node_modules (searches up directory tree)
const express = require('express');
const lodash = require('lodash');

// Index files
const user = require('./user');  // Loads ./user/index.js

// JSON files
const package = require('./package.json');
const config = require('./config.json');
```

### Dynamic Imports

```javascript
// ES Modules dynamic import
async function loadModule() {
  const module = await import('./math.mjs');
  console.log(module.add(5, 3));
}

// Conditional loading
if (condition) {
  const { feature } = await import('./feature.mjs');
  feature();
}

// CommonJS dynamic require
const moduleName = 'lodash';
const module = require(moduleName);
```

### Creating a Package

```javascript
// package.json
{
  "name": "my-library",
  "version": "1.0.0",
  "main": "index.js",           // Entry point for CommonJS
  "module": "index.mjs",         // Entry point for ES modules
  "exports": {
    ".": {
      "require": "./index.js",   // CommonJS
      "import": "./index.mjs"    // ES modules
    },
    "./utils": "./utils.js"
  },
  "type": "module"               // Use ES modules by default
}

// index.js
module.exports = {
  version: '1.0.0',
  add: (a, b) => a + b
};

// Usage
const myLib = require('my-library');
const utils = require('my-library/utils');
```

## 🎤 Interview Questions

### Q1: What is the difference between CommonJS and ES Modules?
**Answer:**
- **CommonJS:** Uses `require()`/`module.exports`, synchronous loading, runtime analysis
- **ES Modules:** Uses `import`/`export`, static analysis, compile-time, supports tree-shaking
- ESM is the modern standard and preferred for new projects

### Q2: What is module.exports vs exports?
**Answer:**
```javascript
// module.exports is the actual object exported
module.exports = { fn1, fn2 };

// exports is a reference to module.exports
exports.fn1 = () => {};  // ✅ Works

// Reassigning exports breaks the reference
exports = { fn1 };       // ❌ Doesn't work
```

### Q3: How does Node.js resolve modules?
**Answer:** Resolution order:
1. Core modules (e.g., `fs`, `http`)
2. Relative/absolute file paths (e.g., `./file`, `/path/file`)
3. `node_modules` folder (searches up directory tree)
4. Global modules

### Q4: What is require.cache?
**Answer:** Object containing cached modules. Modules are cached after first load.
```javascript
// View cache
console.log(require.cache);

// Delete from cache (force re-import)
delete require.cache[require.resolve('./module')];
```

### Q5: How to handle circular dependencies?
**Answer:**
```javascript
// a.js
exports.value = 'A';
const b = require('./b');

// b.js
exports.value = 'B';
const a = require('./a'); // Gets partial export

// Solutions:
// 1. Restructure to eliminate cycle
// 2. Use dependency injection
// 3. Import at function level
// 4. Extract shared code to separate module
```

### Q6: What is tree-shaking?
**Answer:** Dead code elimination during bundling. Only works with ES Modules because imports are statically analyzable.
```javascript
// library.js
export function used() { }
export function unused() { } // Removed by bundler

// app.js
import { used } from './library';
```

### Q7: Difference between import and require?
**Answer:**
| require() | import |
|-----------|--------|
| CommonJS | ES Modules |
| Synchronous | Asynchronous |
| Runtime | Compile-time |
| Can be conditional | Must be top-level |
| Returns value | Binding reference |

### Q8: What are bare imports?
**Answer:** Imports without path prefix (e.g., `import express from 'express'`)
- Resolved from `node_modules`
- Package name matches directory name
- Can use import maps for custom resolution

### Q9: How to create private module variables?
**Answer:** Don't export them - they're private to the module
```javascript
// Private
const secret = 'private';
function privateHelper() { }

// Public
export function publicAPI() {
  return privateHelper();
}
```

### Q10: What is package.json "type" field?
**Answer:**
```json
{
  "type": "module"  // Treat .js as ES modules
}
// Without "type": "module", .js files use CommonJS
// .mjs always ES modules, .cjs always CommonJS
```

## 🎯 Best Practices

1. **Use ES Modules for new projects**
   ```javascript
   // package.json
   { "type": "module" }
   ```

2. **Use path.join for cross-platform paths**
   ```javascript
   const filePath = path.join(__dirname, 'data', 'file.txt');
   ```

3. **Cache expensive imports**
   ```javascript
   let cachedModule;
   function getModule() {
     if (!cachedModule) {
       cachedModule = require('expensive-module');
     }
     return cachedModule;
   }
   ```

4. **Use named exports for better tree-shaking**
   ```javascript
   export { add, subtract }; // ✅ Tree-shakeable
   export default { add, subtract }; // ❌ Not tree-shakeable
   ```

## 📚 Additional Resources

- [Node.js Modules](https://nodejs.org/api/modules.html)
- [ES Modules](https://nodejs.org/api/esm.html)
- [Path Module](https://nodejs.org/api/path.html)
- [OS Module](https://nodejs.org/api/os.html)

---

[← Previous: Fundamentals](./01-fundamentals.md) | [Next: Event Loop →](./03-event-loop.md)
