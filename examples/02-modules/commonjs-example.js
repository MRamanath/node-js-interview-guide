/**
 * CommonJS Module Pattern - Interview Question
 * "Explain module.exports vs exports"
 */

// utils.js would contain:
// module.exports = { function1, function2 }
// exports.function1 = function1 (shorthand)

// Math utilities
function add(a, b) {
  return a + b;
}

function subtract(a, b) {
  return a - b;
}

function multiply(a, b) {
  return a * b;
}

function divide(a, b) {
  if (b === 0) throw new Error('Division by zero');
  return a / b;
}

// Method 1: Export object
module.exports = {
  add,
  subtract,
  multiply,
  divide
};

// Method 2: Export individual (creates new object!)
// exports.add = add;
// exports.subtract = subtract;

// Method 3: Export single function
// module.exports = add;

// Method 4: Export class
class Calculator {
  constructor() {
    this.result = 0;
  }

  add(n) {
    this.result += n;
    return this;
  }

  subtract(n) {
    this.result -= n;
    return this;
  }

  getResult() {
    return this.result;
  }
}

// Uncomment to export class
// module.exports = Calculator;

// IMPORTANT: Don't do this (reassigns exports reference)
// exports = { add, subtract }; // Won't work!

// Module caching demonstration
console.log('Module loaded at:', new Date().toISOString());
module.exports.loadTime = Date.now();

// Usage in another file:
// const math = require('./commonjs-example');
// console.log(math.add(5, 3)); // 8
// const calc = new Calculator();
// console.log(calc.add(5).subtract(2).getResult()); // 3
