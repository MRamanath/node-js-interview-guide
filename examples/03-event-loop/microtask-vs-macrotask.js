/**
 * Microtask vs Macrotask Queue - Interview Question
 * "Explain the difference and execution order"
 */

console.log('=== Microtask Queue vs Macrotask Queue ===\n');

// MICROTASKS (executed after current operation, before next macrotask)
// 1. process.nextTick (Node.js specific, highest priority)
// 2. Promise callbacks (.then, .catch, .finally)
// 3. queueMicrotask

// MACROTASKS (executed one per event loop iteration)
// 1. setTimeout
// 2. setInterval
// 3. setImmediate (Node.js specific)
// 4. I/O operations

// Example 1: Basic difference
console.log('Example 1: Basic Difference');
console.log('Start');

setTimeout(() => console.log('Macrotask: setTimeout'), 0);
Promise.resolve().then(() => console.log('Microtask: Promise'));
queueMicrotask(() => console.log('Microtask: queueMicrotask'));
process.nextTick(() => console.log('Microtask: nextTick'));

console.log('End');
console.log('---\n');

// Example 2: Microtask queue drains completely
setTimeout(() => {
  console.log('Example 2: Microtask Queue Draining');
  
  // This macrotask adds microtasks
  Promise.resolve().then(() => {
    console.log('Microtask 1');
    
    // This microtask adds another microtask
    Promise.resolve().then(() => {
      console.log('Microtask 2 (nested)');
      
      Promise.resolve().then(() => {
        console.log('Microtask 3 (deeply nested)');
      });
    });
  });
  
  // This runs after ALL microtasks complete
  setTimeout(() => {
    console.log('Next macrotask after all microtasks');
  }, 0);
  
  console.log('Macrotask body end');
  console.log('---\n');
}, 100);

// Example 3: Infinite microtask loop (BAD!)
// Uncomment to see the problem:
/*
function infiniteMicrotasks() {
  Promise.resolve().then(() => {
    console.log('Microtask creating another microtask');
    infiniteMicrotasks(); // Creates another microtask
  });
}
infiniteMicrotasks();
setTimeout(() => console.log('This will NEVER run!'), 0);
*/

// Example 4: Real-world scenario
setTimeout(() => {
  console.log('Example 4: Real-world Scenario');
  
  async function fetchData() {
    console.log('1. Starting fetch');
    
    // Simulated async operation
    await Promise.resolve();
    console.log('2. Fetch complete (microtask)');
    
    // More async work
    await Promise.resolve();
    console.log('3. Processing data (microtask)');
    
    return 'data';
  }
  
  fetchData().then(data => {
    console.log('4. Got data:', data);
  });
  
  setTimeout(() => {
    console.log('5. Timer after async operations');
  }, 0);
  
  console.log('6. Function end (synchronous)');
  console.log('---\n');
}, 200);

// Example 5: setImmediate vs setTimeout
setTimeout(() => {
  console.log('Example 5: setImmediate vs setTimeout');
  
  // Inside I/O cycle, setImmediate is always first
  const fs = require('fs');
  
  fs.readFile(__filename, () => {
    setTimeout(() => console.log('setTimeout in I/O'), 0);
    setImmediate(() => console.log('setImmediate in I/O'));
  });
}, 300);

/* KEY TAKEAWAYS:
1. Microtasks have HIGHER priority than macrotasks
2. ALL microtasks execute before next macrotask
3. process.nextTick > Promise > setTimeout/setImmediate
4. Be careful with infinite microtask loops!
5. Inside I/O callbacks, setImmediate executes before setTimeout
*/
