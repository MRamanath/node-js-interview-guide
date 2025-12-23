# 20. Performance Optimization

## 📚 Overview

Performance optimization ensures your Node.js application runs efficiently, handles high loads, and provides fast responses. This covers profiling, caching, clustering, and best practices.

## 🎯 Key Concepts

### Performance Bottlenecks

```
CPU-bound: Heavy computations → Worker threads
I/O-bound: Database queries → Connection pooling, caching
Memory: Leaks, large objects → Profiling, streaming
Network: API calls → Caching, compression
```

## 💻 Examples

### Profiling

```javascript
// Built-in profiler
node --prof app.js
// Generates isolate-*.log
node --prof-process isolate-*.log > processed.txt

// Chrome DevTools
node --inspect app.js
// Open chrome://inspect

// Performance hooks
const { performance, PerformanceObserver } = require('perf_hooks');

const obs = new PerformanceObserver((items) => {
  console.log(items.getEntries());
  performance.clearMarks();
});
obs.observe({ entryTypes: ['measure'] });

performance.mark('start');
// Operation
performanceExpensiveOperation();
performance.mark('end');
performance.measure('operation', 'start', 'end');

// Memory usage
console.log(process.memoryUsage());
// {
//   rss: 35000000,        // Resident set size
//   heapTotal: 10000000,  // Total heap
//   heapUsed: 5000000,    // Used heap
//   external: 1000000     // C++ objects
// }
```

### Caching

```javascript
// In-memory cache
const NodeCache = require('node-cache');
const cache = new NodeCache({ stdTTL: 600 }); // 10 minutes

async function getCachedUser(id) {
  const cacheKey = `user:${id}`;
  
  // Check cache
  const cached = cache.get(cacheKey);
  if (cached) {
    return cached;
  }
  
  // Cache miss - fetch from DB
  const user = await User.findById(id);
  
  // Store in cache
  cache.set(cacheKey, user);
  
  return user;
}

// Redis cache
const Redis = require('ioredis');
const redis = new Redis();

async function getCachedData(key, fetchFn, ttl = 3600) {
  // Try cache
  const cached = await redis.get(key);
  if (cached) {
    return JSON.parse(cached);
  }
  
  // Fetch data
  const data = await fetchFn();
  
  // Cache it
  await redis.setex(key, ttl, JSON.stringify(data));
  
  return data;
}

// HTTP caching
app.get('/static-data', (req, res) => {
  res.set('Cache-Control', 'public, max-age=3600');
  res.set('ETag', generateETag(data));
  res.json(data);
});

// Cache middleware
function cacheMiddleware(duration) {
  return (req, res, next) => {
    const key = `cache:${req.originalUrl}`;
    
    cache.get(key, (err, data) => {
      if (data) {
        return res.json(JSON.parse(data));
      }
      
      res.originalJson = res.json;
      res.json = (body) => {
        cache.set(key, JSON.stringify(body), duration);
        res.originalJson(body);
      };
      
      next();
    });
  };
}

app.get('/data', cacheMiddleware(600), handler);
```

### Database Optimization

```javascript
// Connection pooling
const pool = new Pool({
  max: 20,
  min: 5,
  idleTimeoutMillis: 30000
});

// Indexing
userSchema.index({ email: 1 });
userSchema.index({ createdAt: -1 });
userSchema.index({ name: 1, email: 1 }); // Compound index

// Query optimization
// Bad - loads all fields
const users = await User.find();

// Good - select specific fields
const users = await User.find().select('name email');

// Pagination
const page = 1;
const limit = 10;
const users = await User.find()
  .skip((page - 1) * limit)
  .limit(limit);

// Lean queries (plain objects, faster)
const users = await User.find().lean();

// Batch operations
await User.insertMany(users); // Faster than loop with save()

// Avoid N+1 queries
// Bad
const users = await User.find();
for (const user of users) {
  user.posts = await Post.find({ userId: user._id });
}

// Good - populate/join
const users = await User.find().populate('posts');
```

### Compression

```javascript
const compression = require('compression');

app.use(compression({
  level: 6, // Compression level (0-9)
  threshold: 1024, // Only compress if > 1KB
  filter: (req, res) => {
    if (req.headers['x-no-compression']) {
      return false;
    }
    return compression.filter(req, res);
  }
}));

// Brotli compression (better than gzip)
const shrinkRay = require('shrink-ray-current');
app.use(shrinkRay());
```

### Streaming

```javascript
// Bad - loads entire file into memory
app.get('/large-file', async (req, res) => {
  const data = await fs.promises.readFile('large-file.txt');
  res.send(data);
});

// Good - streams data
app.get('/large-file', (req, res) => {
  const stream = fs.createReadStream('large-file.txt');
  stream.pipe(res);
});

// CSV export with streaming
app.get('/export', async (req, res) => {
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename=export.csv');
  
  const cursor = User.find().cursor();
  
  for (let user = await cursor.next(); user != null; user = await cursor.next()) {
    res.write(`${user.name},${user.email}\n`);
  }
  
  res.end();
});
```

### Load Balancing with Clustering

```javascript
const cluster = require('cluster');
const os = require('os');

if (cluster.isMaster) {
  const cpus = os.cpus().length;
  
  for (let i = 0; i < cpus; i++) {
    cluster.fork();
  }
  
  cluster.on('exit', (worker) => {
    console.log(`Worker ${worker.id} died, starting new one`);
    cluster.fork();
  });
} else {
  require('./server');
}
```

### Rate Limiting

```javascript
const rateLimit = require('express-rate-limit');

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Max 100 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    res.status(429).json({
      error: 'Too many requests, please try again later'
    });
  }
});

app.use('/api/', limiter);

// Redis-backed rate limiter
const RedisStore = require('rate-limit-redis');

const limiter = rateLimit({
  store: new RedisStore({
    client: redis
  }),
  windowMs: 15 * 60 * 1000,
  max: 100
});
```

### Optimize Event Loop

```javascript
// Bad - blocks event loop
app.get('/cpu-intensive', (req, res) => {
  const result = fibonacci(45); // Blocks!
  res.json({ result });
});

// Good - use worker threads
const { Worker } = require('worker_threads');

app.get('/cpu-intensive', (req, res) => {
  const worker = new Worker('./fib-worker.js', {
    workerData: { n: 45 }
  });
  
  worker.on('message', (result) => {
    res.json({ result });
  });
});

// Check event loop lag
const { monitorEventLoopDelay } = require('perf_hooks');
const h = monitorEventLoopDelay({ resolution: 20 });
h.enable();

setInterval(() => {
  console.log('Event loop delay:', h.mean / 1000000, 'ms');
}, 5000);
```

### Memory Management

```javascript
// Avoid memory leaks

// Bad - growing array never cleaned
let cache = [];
setInterval(() => {
  cache.push(fetchData());
}, 1000);

// Good - bounded cache
const LRU = require('lru-cache');
const cache = new LRU({ max: 500 });

// Clean up timers
const interval = setInterval(() => {}, 1000);
// Later...
clearInterval(interval);

// Weak references for caching
const cache = new WeakMap();
cache.set(object, data); // Automatically cleaned when object is GC'd

// Monitor memory
setInterval(() => {
  const used = process.memoryUsage();
  console.log('Memory:', Math.round(used.heapUsed / 1024 / 1024), 'MB');
}, 10000);
```

### Code Optimization

```javascript
// Use const/let instead of var
const value = 42;

// Avoid try-catch in hot paths
// Bad
for (let i = 0; i < 1000000; i++) {
  try {
    process(i);
  } catch (e) {}
}

// Good
try {
  for (let i = 0; i < 1000000; i++) {
    process(i);
  }
} catch (e) {}

// Use map/reduce instead of loops when appropriate
const doubled = numbers.map(n => n * 2);
const sum = numbers.reduce((a, b) => a + b, 0);

// Debounce/throttle expensive operations
const debounce = (fn, delay) => {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
};

const expensiveOp = debounce(actualOp, 1000);
```

### HTTP/2

```javascript
const http2 = require('http2');
const fs = require('fs');

const server = http2.createSecureServer({
  key: fs.readFileSync('key.pem'),
  cert: fs.readFileSync('cert.pem')
});

server.on('stream', (stream, headers) => {
  stream.respond({
    'content-type': 'text/html',
    ':status': 200
  });
  
  stream.end('<h1>Hello HTTP/2</h1>');
});

server.listen(3000);
```

### Monitoring

```javascript
const prom = require('prom-client');

// Create metrics
const register = new prom.Registry();

const httpRequestDuration = new prom.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code'],
  registers: [register]
});

// Middleware
app.use((req, res, next) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = (Date.now() - start) / 1000;
    httpRequestDuration
      .labels(req.method, req.route?.path || req.path, res.statusCode)
      .observe(duration);
  });
  
  next();
});

// Metrics endpoint
app.get('/metrics', async (req, res) => {
  res.set('Content-Type', register.contentType);
  res.end(await register.metrics());
});
```

## 🎤 Interview Questions

### Q1: How to identify performance bottlenecks?
**Answer:** Use profiling tools (--prof, Chrome DevTools), APM tools (New Relic, Datadog), monitor metrics (CPU, memory, event loop lag).

### Q2: What is event loop blocking?
**Answer:** Long-running synchronous operations block event loop, preventing other requests. Use worker threads or async operations.

### Q3: How does caching improve performance?
**Answer:** Reduces repeated expensive operations (DB queries, API calls). Use in-memory (Redis) or HTTP caching.

### Q4: What is connection pooling?
**Answer:** Reusing database connections instead of creating new ones. Improves performance, reduces overhead.

### Q5: How to optimize database queries?
**Answer:** Add indexes, use pagination, select specific fields, avoid N+1 queries, use lean queries.

### Q6: What is the difference between clustering and worker threads?
**Answer:**
- **Clustering**: Multiple processes, can share ports, for scaling servers
- **Worker Threads**: Same process, for CPU-intensive tasks

### Q7: How does compression work?
**Answer:** Reduces response size (gzip/brotli). Trade-off: CPU for bandwidth. Use for > 1KB responses.

### Q8: What is rate limiting?
**Answer:** Limits requests per user/IP to prevent abuse. Use sliding window or token bucket algorithms.

### Q9: How to prevent memory leaks?
**Answer:** Clear timers, remove event listeners, use WeakMap/WeakSet, monitor memory usage, profile heap.

### Q10: What is lazy loading?
**Answer:** Loading data only when needed. Improves initial load time. Use pagination, infinite scroll.

## 🎯 Best Practices

1. **Enable compression**
   ```javascript
   app.use(compression());
   ```

2. **Use caching strategically**
   ```javascript
   const cached = await redis.get(key);
   if (cached) return cached;
   ```

3. **Implement connection pooling**
   ```javascript
   const pool = new Pool({ max: 20 });
   ```

4. **Monitor performance**
   ```javascript
   // APM, logging, metrics
   ```

5. **Use clustering for multi-core**
   ```javascript
   if (cluster.isMaster) {
     for (let i = 0; i < cpus; i++) cluster.fork();
   }
   ```

## 📚 Additional Resources

- [Node.js Performance Tips](https://nodejs.org/en/docs/guides/simple-profiling/)
- [Clinic.js](https://clinicjs.org/)
- [0x Profiler](https://github.com/davidmarkclements/0x)

---

[← Previous: Testing](./19-testing.md) | [Next: WebSockets →](./21-websockets.md)
