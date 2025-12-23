# 13. Clustering

## 📚 Overview

The cluster module allows you to create child processes (workers) that share the same server port, enabling Node.js to take advantage of multi-core systems and improve application performance.

## 🎯 Key Concepts

### Why Clustering?

```
Single Process (1 core)        Cluster Mode (4 cores)
    Node.js                    Master → Worker 1
      ↓                               → Worker 2
   Port 3000                          → Worker 3
                                      → Worker 4
                                   All share Port 3000
```

## 💻 Examples

### Basic Cluster Setup

```javascript
const cluster = require('cluster');
const http = require('http');
const numCPUs = require('os').cpus().length;

if (cluster.isMaster) {
  console.log(`Master ${process.pid} is running`);
  
  // Fork workers
  for (let i = 0; i < numCPUs; i++) {
    cluster.fork();
  }
  
  cluster.on('exit', (worker, code, signal) => {
    console.log(`Worker ${worker.process.pid} died`);
  });
} else {
  // Workers share TCP connection
  http.createServer((req, res) => {
    res.writeHead(200);
    res.end(`Worker ${process.pid} handled request\n`);
  }).listen(3000);
  
  console.log(`Worker ${process.pid} started`);
}
```

### Production-Ready Cluster

```javascript
const cluster = require('cluster');
const http = require('http');
const numCPUs = require('os').cpus().length;

if (cluster.isMaster) {
  console.log(`Master ${process.pid} is running`);
  console.log(`Forking ${numCPUs} workers...`);
  
  // Create workers
  for (let i = 0; i < numCPUs; i++) {
    cluster.fork();
  }
  
  // Worker died - restart it
  cluster.on('exit', (worker, code, signal) => {
    console.log(`Worker ${worker.process.pid} died (${signal || code})`);
    console.log('Starting new worker...');
    cluster.fork();
  });
  
  // Worker came online
  cluster.on('online', (worker) => {
    console.log(`Worker ${worker.process.pid} is online`);
  });
  
  // Worker disconnected
  cluster.on('disconnect', (worker) => {
    console.log(`Worker ${worker.process.pid} disconnected`);
  });
  
  // Handle master process signals
  process.on('SIGTERM', () => {
    console.log('SIGTERM received, shutting down gracefully...');
    
    for (const id in cluster.workers) {
      cluster.workers[id].kill();
    }
  });
  
} else {
  // Worker code
  const server = http.createServer((req, res) => {
    // Simulate some work
    const start = Date.now();
    while (Date.now() - start < 10) {} // 10ms CPU work
    
    res.writeHead(200);
    res.end(`Handled by worker ${process.pid}\n`);
  });
  
  server.listen(3000);
  
  console.log(`Worker ${process.pid} started`);
}
```

### Express with Clustering

```javascript
// server.js
const cluster = require('cluster');
const express = require('express');
const os = require('os');

const PORT = process.env.PORT || 3000;
const numWorkers = process.env.WORKERS || os.cpus().length;

if (cluster.isMaster) {
  masterProcess();
} else {
  workerProcess();
}

function masterProcess() {
  console.log(`Master ${process.pid} is running`);
  console.log(`Starting ${numWorkers} workers...`);
  
  for (let i = 0; i < numWorkers; i++) {
    cluster.fork();
  }
  
  cluster.on('exit', (worker, code, signal) => {
    console.log(`Worker ${worker.process.pid} died. Restarting...`);
    cluster.fork();
  });
  
  // Graceful shutdown
  process.on('SIGTERM', gracefulShutdown);
  process.on('SIGINT', gracefulShutdown);
  
  function gracefulShutdown() {
    console.log('Received kill signal, shutting down gracefully');
    
    Object.values(cluster.workers).forEach(worker => {
      worker.send('shutdown');
      
      setTimeout(() => {
        worker.kill('SIGKILL');
      }, 10000); // Force kill after 10s
    });
  }
}

function workerProcess() {
  const app = express();
  
  app.get('/', (req, res) => {
    res.send(`Hello from worker ${process.pid}`);
  });
  
  app.get('/health', (req, res) => {
    res.json({
      status: 'ok',
      pid: process.pid,
      memory: process.memoryUsage(),
      uptime: process.uptime()
    });
  });
  
  const server = app.listen(PORT, () => {
    console.log(`Worker ${process.pid} listening on port ${PORT}`);
  });
  
  // Graceful shutdown
  process.on('message', (msg) => {
    if (msg === 'shutdown') {
      console.log(`Worker ${process.pid} shutting down...`);
      
      server.close(() => {
        console.log(`Worker ${process.pid} closed`);
        process.exit(0);
      });
      
      // Force close after 5 seconds
      setTimeout(() => {
        process.exit(1);
      }, 5000);
    }
  });
}
```

### Worker Communication

```javascript
// master-worker-communication.js
const cluster = require('cluster');
const http = require('http');

if (cluster.isMaster) {
  const workers = {};
  
  // Fork workers
  for (let i = 0; i < 2; i++) {
    const worker = cluster.fork();
    workers[worker.id] = worker;
    
    // Listen to messages from worker
    worker.on('message', (msg) => {
      console.log(`Master received from worker ${worker.id}:`, msg);
      
      if (msg.cmd === 'REQUEST_COUNT') {
        // Broadcast to all workers
        Object.values(workers).forEach(w => {
          w.send({ cmd: 'GET_COUNT' });
        });
      }
    });
  }
  
  // Send message to specific worker
  setTimeout(() => {
    const worker = workers[Object.keys(workers)[0]];
    worker.send({ cmd: 'CUSTOM_COMMAND', data: 'Hello Worker!' });
  }, 2000);
  
} else {
  let requestCount = 0;
  
  http.createServer((req, res) => {
    requestCount++;
    res.end(`Worker ${process.pid}: ${requestCount} requests\n`);
  }).listen(3000);
  
  // Listen to messages from master
  process.on('message', (msg) => {
    console.log(`Worker ${process.pid} received:`, msg);
    
    if (msg.cmd === 'GET_COUNT') {
      process.send({
        cmd: 'REQUEST_COUNT',
        pid: process.pid,
        count: requestCount
      });
    }
    
    if (msg.cmd === 'CUSTOM_COMMAND') {
      console.log('Custom command data:', msg.data);
    }
  });
  
  // Send message to master
  process.send({
    cmd: 'WORKER_READY',
    pid: process.pid
  });
}
```

### Zero-Downtime Restart

```javascript
const cluster = require('cluster');
const http = require('http');
const os = require('os');

const workers = [];

if (cluster.isMaster) {
  console.log(`Master ${process.pid} started`);
  
  // Fork initial workers
  for (let i = 0; i < os.cpus().length; i++) {
    createWorker();
  }
  
  function createWorker() {
    const worker = cluster.fork();
    workers.push(worker);
    console.log(`Worker ${worker.process.pid} created`);
    return worker;
  }
  
  // Zero-downtime restart
  function restartWorkers() {
    const workersToRestart = [...workers];
    
    function restartNext() {
      if (workersToRestart.length === 0) {
        console.log('All workers restarted');
        return;
      }
      
      const worker = workersToRestart.shift();
      console.log(`Restarting worker ${worker.process.pid}`);
      
      const newWorker = createWorker();
      
      newWorker.once('listening', () => {
        worker.disconnect();
        
        setTimeout(() => {
          worker.kill();
          restartNext();
        }, 1000);
      });
    }
    
    restartNext();
  }
  
  // Trigger restart on SIGUSR2
  process.on('SIGUSR2', () => {
    console.log('SIGUSR2 received, restarting workers...');
    restartWorkers();
  });
  
  cluster.on('exit', (worker, code, signal) => {
    const index = workers.indexOf(worker);
    if (index !== -1) {
      workers.splice(index, 1);
    }
    
    // Only restart if not intentional disconnect
    if (!worker.exitedAfterDisconnect) {
      console.log(`Worker ${worker.process.pid} crashed, restarting...`);
      createWorker();
    }
  });
  
} else {
  const server = http.createServer((req, res) => {
    res.end(`Worker ${process.pid}\n`);
  });
  
  server.listen(3000);
  console.log(`Worker ${process.pid} listening on 3000`);
}

// Usage: kill -SIGUSR2 <master_pid>
```

### Load Balancing Strategies

```javascript
const cluster = require('cluster');

if (cluster.isMaster) {
  // Default: Round-robin on non-Windows, random on Windows
  cluster.schedulingPolicy = cluster.SCHED_RR; // Round-robin
  // OR
  cluster.schedulingPolicy = cluster.SCHED_NONE; // OS handles it
  
  for (let i = 0; i < 4; i++) {
    cluster.fork();
  }
} else {
  require('./app.js');
}
```

### Shared State with Redis

```javascript
// Since workers don't share memory, use Redis for shared state
const cluster = require('cluster');
const express = require('express');
const Redis = require('ioredis');

if (cluster.isMaster) {
  for (let i = 0; i < 4; i++) {
    cluster.fork();
  }
} else {
  const app = express();
  const redis = new Redis();
  
  app.get('/count', async (req, res) => {
    const count = await redis.incr('page_views');
    res.json({
      worker: process.pid,
      totalViews: count
    });
  });
  
  app.get('/session/:id', async (req, res) => {
    const session = await redis.get(`session:${req.params.id}`);
    res.json({ session: JSON.parse(session) });
  });
  
  app.listen(3000);
}
```

### Monitoring Workers

```javascript
const cluster = require('cluster');
const os = require('os');

if (cluster.isMaster) {
  const workerStats = {};
  
  for (let i = 0; i < os.cpus().length; i++) {
    const worker = cluster.fork();
    workerStats[worker.id] = {
      pid: worker.process.pid,
      requests: 0,
      startTime: Date.now()
    };
  }
  
  // Collect stats from workers
  setInterval(() => {
    Object.values(cluster.workers).forEach(worker => {
      worker.send({ cmd: 'GET_STATS' });
    });
  }, 5000);
  
  // Receive stats
  Object.values(cluster.workers).forEach(worker => {
    worker.on('message', (msg) => {
      if (msg.cmd === 'STATS') {
        workerStats[worker.id].requests = msg.requests;
        workerStats[worker.id].memory = msg.memory;
      }
    });
  });
  
  // Display stats
  setInterval(() => {
    console.clear();
    console.log('Worker Statistics:');
    console.log('─'.repeat(60));
    
    Object.entries(workerStats).forEach(([id, stats]) => {
      console.log(`Worker ${stats.pid}:`);
      console.log(`  Requests: ${stats.requests}`);
      console.log(`  Memory: ${(stats.memory / 1024 / 1024).toFixed(2)} MB`);
      console.log(`  Uptime: ${((Date.now() - stats.startTime) / 1000).toFixed(0)}s`);
    });
  }, 10000);
  
} else {
  const http = require('http');
  let requestCount = 0;
  
  http.createServer((req, res) => {
    requestCount++;
    res.end('OK');
  }).listen(3000);
  
  process.on('message', (msg) => {
    if (msg.cmd === 'GET_STATS') {
      process.send({
        cmd: 'STATS',
        requests: requestCount,
        memory: process.memoryUsage().heapUsed
      });
    }
  });
}
```

## 🎤 Interview Questions

### Q1: What is clustering in Node.js?
**Answer:** Creating multiple worker processes that share the same server port, allowing Node.js to utilize multiple CPU cores for better performance.

### Q2: Why use clustering?
**Answer:**
- Node.js is single-threaded
- Clustering utilizes all CPU cores
- Improves throughput and availability
- Automatic load balancing

### Q3: What is the difference between master and worker?
**Answer:**
- **Master**: Manages workers, doesn't handle requests
- **Worker**: Handles actual requests, does the work
- Master forks workers, workers share server port

### Q4: How do workers share a port?
**Answer:** Master process creates socket and passes handle to workers. OS load balancer distributes connections.

### Q5: Do workers share memory?
**Answer:** No. Each worker is a separate process with its own memory. Use IPC, Redis, or databases for shared state.

### Q6: How to achieve zero-downtime deployment?
**Answer:** Restart workers one at a time. Create new worker, wait for it to be ready, then kill old worker.

### Q7: What happens when a worker crashes?
**Answer:** Master receives 'exit' event. Should automatically fork new worker to maintain worker count.

### Q8: Clustering vs Worker Threads?
**Answer:**
- **Cluster**: Separate processes, can share ports, heavier
- **Worker Threads**: Same process, lighter, can't share ports
- Use cluster for scaling, worker threads for CPU tasks

### Q9: How many workers should you create?
**Answer:** Typically number of CPU cores (`os.cpus().length`). Monitor and adjust based on workload.

### Q10: What is cluster.schedulingPolicy?
**Answer:**
- `SCHED_RR`: Round-robin (default on Linux)
- `SCHED_NONE`: OS handles scheduling (default on Windows)

## 🎯 Best Practices

1. **Always restart crashed workers**
   ```javascript
   cluster.on('exit', (worker) => {
     if (!worker.exitedAfterDisconnect) {
       cluster.fork();
     }
   });
   ```

2. **Implement graceful shutdown**
   ```javascript
   process.on('SIGTERM', () => {
     worker.disconnect();
     server.close(() => process.exit(0));
   });
   ```

3. **Use environment variables for worker count**
   ```javascript
   const workers = process.env.WORKERS || os.cpus().length;
   ```

4. **Monitor worker health**
   ```javascript
   setInterval(() => {
     worker.send({ cmd: 'HEALTH_CHECK' });
   }, 30000);
   ```

5. **Use Redis/database for shared state**
   ```javascript
   // Don't rely on in-memory state
   const redis = new Redis();
   ```

## 📚 Additional Resources

- [Node.js Cluster API](https://nodejs.org/api/cluster.html)
- [Cluster Module Guide](https://nodejs.org/en/docs/guides/anatomy-of-an-http-transaction/)

---

[← Previous: Child Process](./12-child-process.md) | [Next: Worker Threads →](./14-worker-threads.md)
