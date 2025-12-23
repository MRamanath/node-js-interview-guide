# 14. Worker Threads

## 📚 Overview

Worker threads enable parallel execution of JavaScript code within a single Node.js process. Unlike clustering (separate processes), worker threads share memory and are lighter weight, perfect for CPU-intensive operations.

## 🎯 Key Concepts

### Worker Threads vs Other Concurrency Models

```
Cluster: Separate processes, share ports, heavy
Worker Threads: Same process, shared memory, lighter  
Child Process: Separate processes, can run any program
Async/Await: Single-threaded, I/O operations
```

## 💻 Examples

### Basic Worker Thread

```javascript
// main.js
const { Worker } = require('worker_threads');

const worker = new Worker('./worker.js');

worker.on('message', (msg) => {
  console.log('Received from worker:', msg);
});

worker.on('error', (err) => {
  console.error('Worker error:', err);
});

worker.on('exit', (code) => {
  console.log(`Worker exited with code ${code}`);
});

worker.postMessage('Hello Worker!');

// worker.js
const { parentPort } = require('worker_threads');

parentPort.on('message', (msg) => {
  console.log('Received from parent:', msg);
  parentPort.postMessage('Hello Parent!');
});
```

### Passing Data

```javascript
// main.js
const { Worker } = require('worker_threads');

const worker = new Worker('./worker.js', {
  workerData: {
    value: 42,
    name: 'Test',
    array: [1, 2, 3]
  }
});

worker.on('message', console.log);

// worker.js
const { parentPort, workerData } = require('worker_threads');

console.log('Worker data:', workerData);
// { value: 42, name: 'Test', array: [1, 2, 3] }

parentPort.postMessage({
  result: workerData.value * 2
});
```

### CPU-Intensive Task

```javascript
// main.js
const { Worker } = require('worker_threads');

function fibonacci(n) {
  return new Promise((resolve, reject) => {
    const worker = new Worker('./fib-worker.js', {
      workerData: { n }
    });
    
    worker.on('message', resolve);
    worker.on('error', reject);
    worker.on('exit', (code) => {
      if (code !== 0) {
        reject(new Error(`Worker stopped with exit code ${code}`));
      }
    });
  });
}

// Calculate multiple fibonacci numbers in parallel
async function main() {
  const results = await Promise.all([
    fibonacci(40),
    fibonacci(41),
    fibonacci(42),
    fibonacci(43)
  ]);
  
  console.log('Results:', results);
}

main();

// fib-worker.js
const { parentPort, workerData } = require('worker_threads');

function fib(n) {
  if (n < 2) return n;
  return fib(n - 1) + fib(n - 2);
}

const result = fib(workerData.n);
parentPort.postMessage(result);
```

### Worker Pool

```javascript
// worker-pool.js
const { Worker } = require('worker_threads');
const os = require('os');

class WorkerPool {
  constructor(workerScript, poolSize = os.cpus().length) {
    this.workerScript = workerScript;
    this.poolSize = poolSize;
    this.workers = [];
    this.freeWorkers = [];
    this.queue = [];
    
    for (let i = 0; i < poolSize; i++) {
      this.addWorker();
    }
  }
  
  addWorker() {
    const worker = new Worker(this.workerScript);
    
    worker.on('message', (result) => {
      worker.currentTask.resolve(result);
      worker.currentTask = null;
      this.freeWorkers.push(worker);
      this.runNext();
    });
    
    worker.on('error', (err) => {
      if (worker.currentTask) {
        worker.currentTask.reject(err);
        worker.currentTask = null;
      }
    });
    
    this.workers.push(worker);
    this.freeWorkers.push(worker);
  }
  
  runTask(data) {
    return new Promise((resolve, reject) => {
      const task = { data, resolve, reject };
      
      const worker = this.freeWorkers.pop();
      if (worker) {
        this.runTaskOnWorker(worker, task);
      } else {
        this.queue.push(task);
      }
    });
  }
  
  runTaskOnWorker(worker, task) {
    worker.currentTask = task;
    worker.postMessage(task.data);
  }
  
  runNext() {
    if (this.queue.length === 0) return;
    
    const worker = this.freeWorkers.pop();
    if (worker) {
      const task = this.queue.shift();
      this.runTaskOnWorker(worker, task);
    }
  }
  
  close() {
    for (const worker of this.workers) {
      worker.terminate();
    }
  }
}

// Usage
const pool = new WorkerPool('./task-worker.js', 4);

async function main() {
  const tasks = Array.from({ length: 100 }, (_, i) => i);
  
  const results = await Promise.all(
    tasks.map(n => pool.runTask({ number: n }))
  );
  
  console.log('All tasks completed');
  pool.close();
}

main();

// task-worker.js
const { parentPort } = require('worker_threads');

parentPort.on('message', (data) => {
  // Simulate CPU-intensive work
  const result = heavyComputation(data.number);
  parentPort.postMessage(result);
});

function heavyComputation(n) {
  let sum = 0;
  for (let i = 0; i < 1000000; i++) {
    sum += Math.sqrt(i) * n;
  }
  return sum;
}
```

### Shared Memory with SharedArrayBuffer

```javascript
// main.js
const { Worker } = require('worker_threads');

// Create shared memory buffer
const sharedBuffer = new SharedArrayBuffer(1024);
const sharedArray = new Int32Array(sharedBuffer);

const worker = new Worker('./shared-worker.js', {
  workerData: { sharedBuffer }
});

// Write to shared memory
sharedArray[0] = 42;
console.log('Main wrote:', sharedArray[0]);

setTimeout(() => {
  console.log('Main reads:', sharedArray[0]); // Worker modified it
}, 1000);

// shared-worker.js
const { workerData } = require('worker_threads');

const sharedArray = new Int32Array(workerData.sharedBuffer);

console.log('Worker reads:', sharedArray[0]); // 42

// Modify shared memory
sharedArray[0] = 100;
console.log('Worker wrote:', sharedArray[0]);
```

### Atomics for Synchronization

```javascript
// main.js
const { Worker } = require('worker_threads');

const sharedBuffer = new SharedArrayBuffer(4);
const sharedArray = new Int32Array(sharedBuffer);

const worker = new Worker('./atomic-worker.js', {
  workerData: { sharedBuffer }
});

// Atomic operations prevent race conditions
Atomics.store(sharedArray, 0, 0);

for (let i = 0; i < 1000; i++) {
  Atomics.add(sharedArray, 0, 1);
}

worker.on('exit', () => {
  console.log('Final value:', Atomics.load(sharedArray, 0));
  // Correctly counts to 2000 (1000 main + 1000 worker)
});

// atomic-worker.js
const { workerData } = require('worker_threads');

const sharedArray = new Int32Array(workerData.sharedBuffer);

for (let i = 0; i < 1000; i++) {
  Atomics.add(sharedArray, 0, 1);
}
```

### Message Channel

```javascript
const { Worker, MessageChannel } = require('worker_threads');

const { port1, port2 } = new MessageChannel();

const worker = new Worker('./channel-worker.js');

// Transfer port2 to worker
worker.postMessage({ port: port2 }, [port2]);

// Communicate via port1
port1.on('message', (msg) => {
  console.log('Received via channel:', msg);
});

port1.postMessage('Hello via channel!');

// channel-worker.js
const { parentPort } = require('worker_threads');

parentPort.on('message', ({ port }) => {
  port.on('message', (msg) => {
    console.log('Worker received via channel:', msg);
    port.postMessage('Response via channel!');
  });
});
```

### Resource Limits

```javascript
const { Worker } = require('worker_threads');

const worker = new Worker('./limited-worker.js', {
  resourceLimits: {
    maxOldGenerationSizeMb: 100,  // Max heap size
    maxYoungGenerationSizeMb: 10, // Max young generation
    codeRangeSizeMb: 10,          // Max code size
    stackSizeMb: 4                // Max stack size
  }
});

worker.on('error', (err) => {
  if (err.message.includes('memory')) {
    console.error('Worker exceeded memory limit');
  }
});
```

### isMainThread Check

```javascript
const { Worker, isMainThread, parentPort } = require('worker_threads');

if (isMainThread) {
  // Main thread code
  console.log('Running in main thread');
  
  const worker = new Worker(__filename); // Same file!
  
  worker.on('message', (msg) => {
    console.log('From worker:', msg);
  });
  
} else {
  // Worker thread code
  console.log('Running in worker thread');
  
  parentPort.postMessage('Hello from worker');
}
```

### Real-World: Image Processing

```javascript
// image-processor.js
const { Worker } = require('worker_threads');
const path = require('path');

class ImageProcessor {
  constructor(concurrency = 4) {
    this.workerScript = path.join(__dirname, 'image-worker.js');
    this.concurrency = concurrency;
  }
  
  async processImages(imagePaths) {
    const chunks = this.chunkArray(imagePaths, this.concurrency);
    const results = [];
    
    for (const chunk of chunks) {
      const chunkResults = await Promise.all(
        chunk.map(imagePath => this.processImage(imagePath))
      );
      results.push(...chunkResults);
    }
    
    return results;
  }
  
  processImage(imagePath) {
    return new Promise((resolve, reject) => {
      const worker = new Worker(this.workerScript, {
        workerData: { imagePath }
      });
      
      worker.on('message', resolve);
      worker.on('error', reject);
      worker.on('exit', (code) => {
        if (code !== 0) {
          reject(new Error(`Worker exit code ${code}`));
        }
      });
    });
  }
  
  chunkArray(array, size) {
    const chunks = [];
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size));
    }
    return chunks;
  }
}

// Usage
const processor = new ImageProcessor(4);

const images = [
  'image1.jpg',
  'image2.jpg',
  'image3.jpg',
  'image4.jpg'
];

processor.processImages(images)
  .then(results => console.log('All images processed:', results))
  .catch(err => console.error('Error:', err));

// image-worker.js
const { parentPort, workerData } = require('worker_threads');
const sharp = require('sharp');

sharp(workerData.imagePath)
  .resize(800, 600)
  .toBuffer()
  .then(buffer => {
    parentPort.postMessage({
      success: true,
      size: buffer.length,
      path: workerData.imagePath
    });
  })
  .catch(err => {
    parentPort.postMessage({
      success: false,
      error: err.message,
      path: workerData.imagePath
    });
  });
```

### Transferable Objects

```javascript
const { Worker } = require('worker_threads');

// ArrayBuffer can be transferred (not copied)
const buffer = new ArrayBuffer(1024);
const view = new Uint8Array(buffer);
view[0] = 42;

const worker = new Worker('./transfer-worker.js');

// Transfer ownership to worker (zero-copy)
worker.postMessage({ buffer }, [buffer]);

// buffer is now unusable in main thread
console.log(buffer.byteLength); // 0 (detached)

// transfer-worker.js
const { parentPort } = require('worker_threads');

parentPort.on('message', ({ buffer }) => {
  const view = new Uint8Array(buffer);
  console.log('Worker received:', view[0]); // 42
  
  // Transfer back
  parentPort.postMessage({ buffer }, [buffer]);
});
```

## 🎤 Interview Questions

### Q1: What are Worker Threads?
**Answer:** Lightweight threads for running JavaScript in parallel within same Node.js process. Share memory, lighter than child processes.

### Q2: Worker Threads vs Cluster?
**Answer:**
- **Worker Threads**: Same process, shared memory, CPU tasks
- **Cluster**: Separate processes, can share ports, scaling servers

### Q3: When to use Worker Threads?
**Answer:** 
- CPU-intensive computations
- Image/video processing
- Cryptography
- Large data transformations
- NOT for I/O operations (already async)

### Q4: Can Worker Threads share memory?
**Answer:** Yes, via SharedArrayBuffer. Must use Atomics for synchronization to avoid race conditions.

### Q5: How to communicate with workers?
**Answer:** 
- `postMessage()` / `on('message')` - Structured cloning
- SharedArrayBuffer - Shared memory
- MessageChannel - Custom channels

### Q6: What is workerData?
**Answer:** Initial data passed to worker at creation time. Read-only in worker via `workerData`.

### Q7: Are Worker Threads truly parallel?
**Answer:** Yes, they run on separate CPU cores. Unlike async/await which is concurrent but single-threaded.

### Q8: What can be transferred to workers?
**Answer:** Serializable data (JSON-like), ArrayBuffers (transferable), MessagePorts. Functions cannot be transferred.

### Q9: How to handle errors in workers?
**Answer:**
```javascript
worker.on('error', (err) => {});      // Uncaught errors
worker.on('exit', (code) => {});      // Exit code != 0
worker.on('messageerror', (err) => {}); // Deserialization error
```

### Q10: What is Atomics?
**Answer:** API for atomic operations on SharedArrayBuffer. Prevents race conditions when multiple threads access same memory.

## 🎯 Best Practices

1. **Use worker pools for multiple tasks**
   ```javascript
   const pool = new WorkerPool('./worker.js', 4);
   ```

2. **Set resource limits**
   ```javascript
   new Worker('./worker.js', {
     resourceLimits: { maxOldGenerationSizeMb: 100 }
   });
   ```

3. **Handle worker errors**
   ```javascript
   worker.on('error', handleError);
   worker.on('exit', checkExitCode);
   ```

4. **Transfer large buffers instead of copying**
   ```javascript
   worker.postMessage({ buffer }, [buffer]);
   ```

5. **Don't overuse workers**
   ```javascript
   // Bad: Create worker for small task
   // Good: Use for CPU-intensive work
   ```

## 📚 Additional Resources

- [Node.js Worker Threads API](https://nodejs.org/api/worker_threads.html)
- [SharedArrayBuffer](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/SharedArrayBuffer)

---

[← Previous: Clustering](./13-clustering.md) | [Next: Database Integration →](./15-database.md)
