/**
 * Event Loop Execution Order - Critical Interview Question!
 * "Predict the output order"
 */

console.log('1: Script start');

// Macrotask: Timers phase
setTimeout(() => {
  console.log('2: setTimeout 0ms');
}, 0);

// Macrotask: Check phase
setImmediate(() => {
  console.log('3: setImmediate');
});

// Microtask: process.nextTick (highest priority)
process.nextTick(() => {
  console.log('4: process.nextTick');
});

// Microtask: Promise
Promise.resolve().then(() => {
  console.log('5: Promise.then');
});

// Microtask: queueMicrotask
queueMicrotask(() => {
  console.log('6: queueMicrotask');
});

console.log('7: Script end');

/* EXPECTED OUTPUT ORDER:
1: Script start
7: Script end
4: process.nextTick (microtask - highest priority)
5: Promise.then (microtask)
6: queueMicrotask (microtask)
2: setTimeout 0ms (macrotask - timers phase)
3: setImmediate (macrotask - check phase)

KEY CONCEPTS:
- Synchronous code runs first
- Microtasks run before macrotasks
- process.nextTick > Promises > setTimeout > setImmediate
*/

// ADVANCED EXAMPLE: Nested callbacks
console.log('\n=== Advanced Example ===');

setTimeout(() => {
  console.log('setTimeout 1');
  
  process.nextTick(() => {
    console.log('nextTick inside setTimeout');
  });
  
  Promise.resolve().then(() => {
    console.log('Promise inside setTimeout');
  });
  
  setTimeout(() => {
    console.log('setTimeout 2 (nested)');
  }, 0);
}, 0);

setImmediate(() => {
  console.log('setImmediate 1');
  
  process.nextTick(() => {
    console.log('nextTick inside setImmediate');
  });
});

/* Advanced Output:
setTimeout 1
nextTick inside setTimeout
Promise inside setTimeout
setImmediate 1
nextTick inside setImmediate
setTimeout 2 (nested)
*/
