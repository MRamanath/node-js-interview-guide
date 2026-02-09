/**
 * ES Modules - Interview Question
 * "What's the difference between CommonJS and ES Modules?"
 */

// Named exports
export function add(a, b) {
  return a + b;
}

export function subtract(a, b) {
  return a - b;
}

export const PI = 3.14159;

export class Calculator {
  constructor() {
    this.result = 0;
  }

  add(n) {
    this.result += n;
    return this;
  }

  getResult() {
    return this.result;
  }
}

// Default export
const mathUtils = {
  add,
  subtract,
  multiply: (a, b) => a * b,
  divide: (a, b) => {
    if (b === 0) throw new Error('Division by zero');
    return a / b;
  }
};

export default mathUtils;

// Re-exporting
export { default as MathUtils } from './another-module.mjs';
export * from './utilities.mjs';

// Import examples in another file:
// import mathUtils from './es-modules-example.mjs';
// import { add, subtract, Calculator } from './es-modules-example.mjs';
// import * as Math from './es-modules-example.mjs';

// Key differences:
// 1. ES Modules use import/export, CommonJS uses require/module.exports
// 2. ES Modules are static (parsed at load time)
// 3. ES Modules are asynchronous
// 4. ES Modules have lexical scoping
// 5. No __dirname, __filename in ES Modules (use import.meta.url)

// Get __dirname equivalent in ES Modules
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log('ES Module dirname:', __dirname);
console.log('ES Module filename:', __filename);
