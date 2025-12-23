# 03. Event Loop

## 📚 Overview

The Event Loop is the heart of Node.js's non-blocking I/O model. It allows Node.js to perform non-blocking operations despite JavaScript being single-threaded.

## 🎯 Architecture

```
   ┌───────────────────────────┐
┌─>│           timers          │ ← setTimeout, setInterval
│  └─────────────┬─────────────┘
│  ┌─────────────┴─────────────┐
│  │     pending callbacks     │ ← I/O callbacks (TCP errors, etc.)
│  └─────────────┬─────────────┘
│  ┌─────────────┴─────────────┐
│  │       idle, prepare       │ ← Internal use only
│  └─────────────┬─────────────┘      
│  ┌─────────────┴─────────────┐
│  │           poll            │ ← Retrieve new I/O events
│  │  execute their callbacks  │    Execute I/O callbacks
│  └─────────────┬─────────────┘
│  ┌─────────────┴─────────────┐
│  │           check           │ ← setImmediate callbacks
│  └─────────────┬─────────────┘
│  ┌─────────────┴─────────────┐
└──│      close callbacks      │ ← socket.on('close', ...)
   └───────────────────────────┘
```

## 💻 Examples

### Phase Execution Order

```javascript
console.log('Start');

// Timers Phase
setTimeout(() => {
  console.log('setTimeout');
}, 0);

// Check Phase
setImmediate(() => {
  console.log('setImmediate');
});

// Microtask (Priority)
process.nextTick(() => {
  console.log('process.nextTick');
});

// Microtask (Promise)
Promise.resolve().then(() => {
  console.log('Promise');
});

console.log('End');

/* Output:
Start
End
process.nextTick
Promise
setTimeout
setImmediate
*/
```

### Microtasks vs Macrotasks

```javascript
// MICROTASKS (Higher Priority - Execute First)
process.nextTick(() => {
  console.log('nextTick');
});

Promise.resolve().then(() => {
  console.log('Promise');
});

queueMicrotask(() => {
  console.log('queueMicrotask');
});

// MACROTASKS (Lower Priority - Execute After Microtasks)
setTimeout(() => {
  console.log('setTimeout');
}, 0);

setImmediate(() => {
  console.log('setImmediate');
});

/* Output:
nextTick
Promise
queueMicrotask
setTimeout
setImmediate
*/
```

### Nested Timers

```javascript
setTimeout(() => {
  console.log('Outer setTimeout');
  
  process.nextTick(() => {
    console.log('nextTick inside setTimeout');
  });
  
  setTimeout(() => {
    console.log('Inner setTimeout');
  }, 0);
}, 0);

/* Output:
Outer setTimeout
nextTick inside setTimeout
Inner setTimeout
*/
```

### setImmediate vs setTimeout

```javascript
// Outside I/O cycle - Order is non-deterministic
setTimeout(() => console.log('timeout'), 0);
setImmediate(() => console.log('immediate'));

// Inside I/O cycle - setImmediate always first
const fs = require('fs');
fs.readFile(__filename, () => {
  setTimeout(() => console.log('timeout'), 0);
  setImmediate(() => console.log('immediate'));
  /* Output:
  immediate
  timeout
  */
});
```

### Promise Chain in Event Loop

```javascript
Promise.resolve()
  .then(() => {
    console.log('Promise 1');
    return Promise.resolve();
  })
  .then(() => {
    console.log('Promise 2');
  });

process.nextTick(() => {
  console.log('nextTick after promises');
});

setTimeout(() => {
  console.log('setTimeout');
}, 0);

/* Output:
nextTick after promises
Promise 1
Promise 2
setTimeout
*/
```

### Blocking vs Non-Blocking

```javascript
// BLOCKING (Bad - Freezes event loop)
const fs = require('fs');
const data = fs.readFileSync('file.txt', 'utf8');
console.log(data);
console.log('After read'); // Waits for file read

// NON-BLOCKING (Good - Doesn't freeze event loop)
fs.readFile('file.txt', 'utf8', (err, data) => {
  console.log(data);
});
console.log('After read'); // Executes immediately
```

### Event Loop Lag Detection

```javascript
let start = Date.now();

setTimeout(() => {
  const lag = Date.now() - start - 100;
  console.log(`Expected: 100ms, Actual: ${Date.now() - start}ms`);
  console.log(`Lag: ${lag}ms`);
}, 100);

// Simulate CPU intensive task (blocks event loop)
for (let i = 0; i < 1000000000; i++) {
  // Heavy computation
}

// Timer will execute late due to blocked event loop
```

### Multiple nextTick

```javascript
process.nextTick(() => console.log('nextTick 1'));
process.nextTick(() => console.log('nextTick 2'));
process.nextTick(() => console.log('nextTick 3'));

setTimeout(() => console.log('setTimeout'), 0);

/* Output (all nextTicks before setTimeout):
nextTick 1
nextTick 2
nextTick 3
setTimeout
*/
```

### Recursive nextTick (Danger!)

```javascript
// WARNING: This starves the event loop!
let count = 0;
function recursiveNextTick() {
  if (count < 100) {
    count++;
    process.nextTick(recursiveNextTick);
  }
}

recursiveNextTick();

// This will never execute!
setTimeout(() => {
  console.log('I will never run!');
}, 0);

// Solution: Use setImmediate for recursive calls
function recursiveImmediate() {
  if (count < 100) {
    count++;
    setImmediate(recursiveImmediate); // Allows I/O
  }
}
```

## 🎤 Interview Questions

### Q1: What is the Event Loop in Node.js?
**Answer:** The Event Loop is a mechanism that handles asynchronous operations in Node.js. It allows Node.js to perform non-blocking I/O operations despite JavaScript being single-threaded by offloading operations to the system kernel whenever possible.

### Q2: What are the phases of the Event Loop?
**Answer:**
1. **Timers** - Executes `setTimeout` and `setInterval` callbacks
2. **Pending Callbacks** - Executes I/O callbacks deferred from previous iteration
3. **Idle/Prepare** - Internal use only
4. **Poll** - Retrieve new I/O events, execute I/O callbacks
5. **Check** - Executes `setImmediate` callbacks
6. **Close Callbacks** - Execute close event callbacks (e.g., `socket.on('close')`)

### Q3: What is the difference between process.nextTick() and setImmediate()?
**Answer:**
- `process.nextTick()` - Executes **before** the event loop continues (after current operation, before I/O)
- `setImmediate()` - Executes in the **Check phase** of the event loop
- `nextTick` has higher priority and can cause I/O starvation if overused

```javascript
process.nextTick(() => console.log('nextTick')); // Executes first
setImmediate(() => console.log('immediate'));    // Executes second
```

### Q4: What are microtasks and macrotasks?
**Answer:**
- **Microtasks** (higher priority): `process.nextTick()`, Promises, `queueMicrotask()`
- **Macrotasks** (lower priority): `setTimeout`, `setInterval`, `setImmediate`, I/O operations
- All microtasks execute before the next macrotask

### Q5: Why is Node.js called non-blocking?
**Answer:** Node.js uses asynchronous I/O operations that don't block the main thread. Operations are delegated to the system (via libuv), and callbacks are executed when operations complete. This allows handling many concurrent operations without multiple threads.

### Q6: What is the Poll phase?
**Answer:** The Poll phase:
- Retrieves new I/O events
- Executes I/O-related callbacks
- Most application time is spent here
- Will block and wait for callbacks if there are no timers scheduled

### Q7: Can process.nextTick() cause starvation?
**Answer:** Yes! Recursive `nextTick()` calls can prevent the event loop from continuing, blocking I/O operations:

```javascript
// BAD - Starves I/O
function recursive() {
  process.nextTick(recursive);
}

// GOOD - Allows I/O
function recursive() {
  setImmediate(recursive);
}
```

### Q8: What is the execution order: setTimeout(0) vs setImmediate()?
**Answer:**
- **Outside I/O cycle:** Order is non-deterministic (depends on system performance)
- **Inside I/O cycle:** `setImmediate()` always executes first

```javascript
// Non-deterministic
setTimeout(() => console.log('timeout'), 0);
setImmediate(() => console.log('immediate'));

// setImmediate always first
fs.readFile('file.txt', () => {
  setTimeout(() => console.log('timeout'), 0);
  setImmediate(() => console.log('immediate'));
});
```

### Q9: What is libuv?
**Answer:** libuv is a C library that provides:
- Event loop implementation
- Asynchronous I/O (file system, networking, DNS)
- Thread pool for blocking operations
- Cross-platform abstractions

Node.js is built on top of libuv, which handles all async operations.

### Q10: How does Node.js handle async operations?
**Answer:**
1. Async operation initiated in JavaScript
2. Operation delegated to libuv
3. libuv uses system kernel or thread pool
4. Callback queued when operation completes
5. Event loop executes callback in appropriate phase

JavaScript remains single-threaded throughout.

## 🎯 Best Practices

1. **Use setImmediate for recursive operations**
   ```javascript
   function processNextItem() {
     setImmediate(() => {
       // Process item
       processNextItem();
     });
   }
   ```

2. **Avoid blocking the event loop**
   ```javascript
   // BAD
   for (let i = 0; i < 1000000000; i++) { }
   
   // GOOD - Use worker threads for CPU-intensive tasks
   const { Worker } = require('worker_threads');
   const worker = new Worker('./heavy-computation.js');
   ```

3. **Don't overuse process.nextTick()**
   ```javascript
   // Can cause I/O starvation
   process.nextTick(heavyTask);
   
   // Better
   setImmediate(heavyTask);
   ```

4. **Monitor event loop lag**
   ```javascript
   const start = Date.now();
   setInterval(() => {
     const lag = Date.now() - start - 1000;
     if (lag > 100) {
       console.warn('Event loop lag detected:', lag);
     }
   }, 1000);
   ```

## 📚 Additional Resources

- [Node.js Event Loop Official Docs](https://nodejs.org/en/docs/guides/event-loop-timers-and-nexttick/)
- [libuv Design Overview](http://docs.libuv.org/en/v1.x/design.html)
- [What the heck is the event loop anyway?](https://www.youtube.com/watch?v=8aGhZQkoFbQ) by Philip Roberts

---

[← Previous: Modules](./02-modules.md) | [Next: Streams →](./04-streams.md)
