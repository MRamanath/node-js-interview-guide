/**
 * Clustering for Multi-Core Performance - Interview Topic
 * "How do you scale Node.js across multiple cores?"
 */

const cluster = require('cluster');
const http = require('http');
const os = require('os');

const numCPUs = os.cpus().length;
const PORT = 3000;

if (cluster.isMaster) {
  console.log(`Master process ${process.pid} is running`);
  console.log(`Spawning ${numCPUs} worker processes...\n`);
  
  const workers = new Map();
  
  // Fork workers
  for (let i = 0; i < numCPUs; i++) {
    const worker = cluster.fork();
    workers.set(worker.process.pid, {
      worker,
      requests: 0,
      startTime: Date.now()
    });
  }
  
  // Worker messages
  cluster.on('message', (worker, msg) => {
    if (msg.cmd === 'request') {
      const workerInfo = workers.get(worker.process.pid);
      if (workerInfo) {
        workerInfo.requests++;
      }
    }
  });
  
  // Worker online
  cluster.on('online', (worker) => {
    console.log(`✓ Worker ${worker.process.pid} is online`);
  });
  
  // Worker exit
  cluster.on('exit', (worker, code, signal) => {
    console.log(`✗ Worker ${worker.process.pid} died (${signal || code})`);
    workers.delete(worker.process.pid);
    
    // Restart worker
    console.log('Starting a new worker...');
    const newWorker = cluster.fork();
    workers.set(newWorker.process.pid, {
      worker: newWorker,
      requests: 0,
      startTime: Date.now()
    });
  });
  
  // Stats every 5 seconds
  setInterval(() => {
    console.log('\n=== Cluster Stats ===');
    console.log('Active workers:', workers.size);
    
    workers.forEach((info, pid) => {
      const uptime = Math.round((Date.now() - info.startTime) / 1000);
      console.log(`Worker ${pid}: ${info.requests} requests (uptime: ${uptime}s)`);
    });
    
    console.log('===================\n');
  }, 5000);
  
  // Graceful shutdown
  process.on('SIGTERM', () => {
    console.log('\nSIGTERM received, shutting down gracefully...');
    
    workers.forEach(({ worker }) => {
      worker.send('shutdown');
      setTimeout(() => worker.kill(), 5000);
    });
  });
  
  // Test: Restart workers (zero-downtime)
  // Uncomment to test:
  /*
  setTimeout(() => {
    console.log('\n=== Restarting all workers (zero-downtime) ===');
    const workerList = Array.from(workers.values());
    
    function restartNext(index) {
      if (index >= workerList.length) {
        console.log('All workers restarted!\n');
        return;
      }
      
      const { worker } = workerList[index];
      console.log(`Restarting worker ${worker.process.pid}...`);
      
      worker.kill();
      setTimeout(() => restartNext(index + 1), 1000);
    }
    
    restartNext(0);
  }, 10000);
  */
  
} else {
  // Worker process
  const server = http.createServer((req, res) => {
    // Notify master of request
    process.send({ cmd: 'request' });
    
    // Simulate work
    const start = Date.now();
    
    // CPU-intensive work
    if (req.url === '/heavy') {
      let result = 0;
      for (let i = 0; i < 1e7; i++) {
        result += Math.sqrt(i);
      }
      
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        worker: process.pid,
        result: result.toFixed(2),
        duration: Date.now() - start + 'ms'
      }));
    }
    
    // Fast endpoint
    else if (req.url === '/fast') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        worker: process.pid,
        message: 'Fast response',
        duration: Date.now() - start + 'ms'
      }));
    }
    
    // Health check
    else if (req.url === '/health') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        worker: process.pid,
        uptime: process.uptime(),
        memory: process.memoryUsage()
      }));
    }
    
    // Info
    else {
      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.end(`
        <h1>Clustering Demo</h1>
        <p>Handled by worker: <strong>${process.pid}</strong></p>
        <p>Available cores: ${numCPUs}</p>
        <h2>Endpoints:</h2>
        <ul>
          <li><a href="/fast">/fast</a> - Fast response</li>
          <li><a href="/heavy">/heavy</a> - CPU-intensive (slow)</li>
          <li><a href="/health">/health</a> - Health check</li>
        </ul>
        <h2>Load Test:</h2>
        <pre>
# Test clustering performance
ab -n 1000 -c 10 http://localhost:3000/fast

# Without clustering (single process):
# node single-process-server.js
# ab -n 1000 -c 10 http://localhost:3000/fast
        </pre>
      `);
    }
  });
  
  server.listen(PORT, () => {
    console.log(`Worker ${process.pid} started`);
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
        console.error(`Worker ${process.pid} forced shutdown`);
        process.exit(1);
      }, 5000);
    }
  });
}

/* COMPARISON - Single Process Server (for testing):

const http = require('http');
http.createServer((req, res) => {
  if (req.url === '/heavy') {
    let result = 0;
    for (let i = 0; i < 1e7; i++) {
      result += Math.sqrt(i);
    }
    res.end(JSON.stringify({ result }));
  } else {
    res.end('OK');
  }
}).listen(3000);

BENCHMARK RESULTS (typically):
- Single process: ~500 req/s
- Clustered (4 cores): ~2000 req/s (4x improvement!)
*/

/* INTERVIEW POINTS:
1. Clustering allows Node.js to use multiple CPU cores
2. Master process manages workers
3. Workers share the same server port
4. Load balancing is automatic (round-robin)
5. Zero-downtime restart possible
6. Graceful shutdown important
7. PM2 provides clustering built-in
8. Use for CPU-intensive workloads
9. Each worker has separate memory
10. Communication via IPC (process.send)
*/
