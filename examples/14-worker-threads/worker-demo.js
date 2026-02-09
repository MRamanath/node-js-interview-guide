/**
 * Worker Threads for CPU-Intensive Tasks - Interview Question
 * "When would you use worker threads vs clustering?"
 */

const { Worker, isMainThread, parentPort, workerData } = require('worker_threads');
const path = require('path');
const os = require('os');

// Answer: Use worker threads for CPU-intensive tasks within a single process
// Use clustering for scaling web servers across multiple cores

if (isMainThread) {
  // Main thread - creates workers
  
  console.log('=== Worker Threads Demo ===\n');
  
  // Example 1: Single worker
  async function singleWorkerExample() {
    console.log('Example 1: Single Worker');
    console.log('Calculating fibonacci(40) in worker...');
    
    const start = Date.now();
    const result = await runWorker({ n: 40 });
    
    console.log(`Result: ${result}`);
    console.log(`Time: ${Date.now() - start}ms\n`);
  }
  
  // Example 2: Multiple workers (parallel)
  async function multipleWorkersExample() {
    console.log('Example 2: Multiple Workers (Parallel)');
    
    const tasks = [40, 41, 42, 43];
    
    // Sequential
    console.log('Sequential execution:');
    const start1 = Date.now();
    const results1 = [];
    for (const n of tasks) {
      const result = await runWorker({ n });
      results1.push(result);
    }
    console.log(`Time: ${Date.now() - start1}ms`);
    console.log(`Results: ${results1}\n`);
    
    // Parallel
    console.log('Parallel execution:');
    const start2 = Date.now();
    const results2 = await Promise.all(
      tasks.map(n => runWorker({ n }))
    );
    console.log(`Time: ${Date.now() - start2}ms`);
    console.log(`Results: ${results2}\n`);
  }
  
  // Example 3: Worker pool
  class WorkerPool {
    constructor(workerScript, poolSize = os.cpus().length) {
      this.workerScript = workerScript;
      this.poolSize = poolSize;
      this.workers = [];
      this.queue = [];
      
      // Create workers
      for (let i = 0; i < poolSize; i++) {
        this.workers.push({
          worker: null,
          busy: false
        });
      }
    }
    
    async execute(data) {
      return new Promise((resolve, reject) => {
        const task = { data, resolve, reject };
        
        // Find available worker
        const available = this.workers.find(w => !w.busy);
        
        if (available) {
          this.runTask(available, task);
        } else {
          this.queue.push(task);
        }
      });
    }
    
    runTask(workerSlot, task) {
      workerSlot.busy = true;
      
      const worker = new Worker(__filename, {
        workerData: task.data
      });
      
      workerSlot.worker = worker;
      
      worker.on('message', (result) => {
        task.resolve(result);
        this.finishTask(workerSlot);
      });
      
      worker.on('error', (err) => {
        task.reject(err);
        this.finishTask(workerSlot);
      });
      
      worker.on('exit', (code) => {
        if (code !== 0) {
          task.reject(new Error(`Worker stopped with code ${code}`));
        }
      });
    }
    
    finishTask(workerSlot) {
      workerSlot.busy = false;
      workerSlot.worker = null;
      
      // Process queue
      if (this.queue.length > 0) {
        const nextTask = this.queue.shift();
        this.runTask(workerSlot, nextTask);
      }
    }
    
    async terminate() {
      for (const slot of this.workers) {
        if (slot.worker) {
          await slot.worker.terminate();
        }
      }
    }
  }
  
  async function workerPoolExample() {
    console.log('Example 3: Worker Pool');
    console.log(`Pool size: ${os.cpus().length} workers\n`);
    
    const pool = new WorkerPool(__filename, 4);
    
    // Submit many tasks
    const tasks = Array.from({ length: 20 }, (_, i) => 35 + (i % 5));
    
    console.log('Processing 20 tasks with 4 workers...');
    const start = Date.now();
    
    const results = await Promise.all(
      tasks.map((n, i) => {
        return pool.execute({ n }).then(result => {
          process.stdout.write(`.`);
          return result;
        });
      })
    );
    
    console.log(`\nAll tasks completed in ${Date.now() - start}ms`);
    console.log(`Sample results: ${results.slice(0, 5)}\n`);
    
    await pool.terminate();
  }
  
  // Example 4: Data processing with worker
  async function dataProcessingExample() {
    console.log('Example 4: Data Processing');
    
    const data = Array.from({ length: 1000000 }, (_, i) => ({
      id: i,
      value: Math.random() * 100
    }));
    
    console.log('Processing 1M records in worker...');
    const start = Date.now();
    
    const result = await runWorker({ 
      operation: 'aggregate',
      data
    });
    
    console.log(`Result: ${JSON.stringify(result)}`);
    console.log(`Time: ${Date.now() - start}ms\n`);
  }
  
  // Helper: Run worker
  function runWorker(data) {
    return new Promise((resolve, reject) => {
      const worker = new Worker(__filename, {
        workerData: data
      });
      
      worker.on('message', resolve);
      worker.on('error', reject);
      worker.on('exit', (code) => {
        if (code !== 0) {
          reject(new Error(`Worker stopped with code ${code}`));
        }
      });
    });
  }
  
  // Run examples
  (async () => {
    await singleWorkerExample();
    await multipleWorkersExample();
    await workerPoolExample();
    await dataProcessingExample();
    
    console.log('All examples completed!');
  })();
  
} else {
  // Worker thread - processes data
  
  const { operation, n, data } = workerData;
  
  if (n !== undefined) {
    // Fibonacci calculation
    function fibonacci(n) {
      if (n < 2) return n;
      return fibonacci(n - 1) + fibonacci(n - 2);
    }
    
    const result = fibonacci(n);
    parentPort.postMessage(result);
  }
  
  if (operation === 'aggregate') {
    // Data aggregation
    const sum = data.reduce((acc, item) => acc + item.value, 0);
    const avg = sum / data.length;
    const max = Math.max(...data.map(item => item.value));
    const min = Math.min(...data.map(item => item.value));
    
    parentPort.postMessage({
      count: data.length,
      sum: sum.toFixed(2),
      avg: avg.toFixed(2),
      max: max.toFixed(2),
      min: min.toFixed(2)
    });
  }
}

/* INTERVIEW COMPARISON:

WORKER THREADS:
- Same process, shared memory possible
- Lighter weight than processes
- Good for CPU-intensive calculations
- Can share data efficiently
- Use for: image processing, data parsing, crypto

CLUSTERING:
- Separate processes
- No shared memory
- Good for scaling web servers
- Better isolation (crash doesn't affect others)
- Use for: HTTP servers, API scaling

CHILD PROCESSES:
- Can run any program (not just Node.js)
- Separate processes
- Use for: running external commands, scripts

KEY POINTS:
1. Worker threads don't block the main thread
2. Perfect for CPU-intensive operations
3. Use worker pools for many tasks
4. Can transfer data efficiently (shared memory)
5. Still single-threaded per worker
6. Not for I/O operations (use async for that)
*/
