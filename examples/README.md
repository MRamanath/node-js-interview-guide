# Examples - Node.js Interview Guide

This folder contains practical, production-ready examples for each topic in the Node.js Interview Guide. These examples demonstrate concepts that companies commonly ask about in technical interviews.

## 📁 Folder Structure

```
examples/
├── 01-fundamentals/      # Process, global objects
├── 02-modules/           # CommonJS, ES Modules
├── 03-event-loop/        # Event loop, microtasks, macrotasks
├── 04-streams/           # File streaming, CSV processing
├── 05-file-system/       # File operations
├── 06-http-server/       # HTTP server, REST API
├── 07-express/           # Express.js REST API
├── 08-middleware/        # Authentication, logging, validation
├── 09-async-patterns/    # Callbacks, promises, async/await
├── 13-clustering/        # Multi-core scaling
├── 14-worker-threads/    # CPU-intensive tasks
├── 18-error-handling/    # Error patterns, custom errors
└── 21-websockets/        # Real-time chat
```

## 🚀 How to Run Examples

### Prerequisites
```bash
# Install Node.js 18+
node --version

# Navigate to examples directory
cd examples
```

### Running Individual Examples

```bash
# Fundamentals
node 01-fundamentals/process-info.js
node 01-fundamentals/global-objects.js

# Modules
node 02-modules/commonjs-example.js
node 02-modules/es-modules-example.mjs

# Event Loop
node 03-event-loop/execution-order.js
node 03-event-loop/microtask-vs-macrotask.js

# Streams
node 04-streams/file-streaming.js
node 04-streams/csv-processing.js

# File System
node 05-file-system/file-operations.js

# HTTP Server
node 06-http-server/rest-api.js

# Express (requires npm install)
npm install express
node 07-express/rest-api.js

# Middleware (requires dependencies)
npm install express jsonwebtoken bcrypt
node 08-middleware/auth-middleware.js

# Async Patterns
node 09-async-patterns/async-comparison.js

# Clustering
node 13-clustering/cluster-demo.js

# Worker Threads
node 14-worker-threads/worker-demo.js

# Error Handling
npm install express
node 18-error-handling/error-patterns.js

# WebSockets (requires dependencies)
npm install express socket.io
node 21-websockets/chat-room.js
```

## 📚 Example Categories

### Core Concepts
- **Process Info**: Environment variables, memory usage, CPU
- **Global Objects**: Timers, Buffer, Console methods
- **Module Systems**: CommonJS vs ES Modules patterns

### Async & Event Loop
- **Execution Order**: Predict output order (common interview question!)
- **Microtask vs Macrotask**: Understanding queue priorities
- **Async Comparison**: Callbacks vs Promises vs Async/Await

### I/O & Streams
- **File Streaming**: Process large files efficiently
- **CSV Processing**: Real-world data transformation
- **File Operations**: All fs operations with promises

### Web Development
- **HTTP Server**: RESTful API without frameworks
- **Express API**: Production-ready REST API
- **Auth Middleware**: JWT authentication, role-based access
- **WebSocket Chat**: Real-time bidirectional communication

### Performance & Scaling
- **Clustering**: Multi-core utilization
- **Worker Threads**: CPU-intensive tasks
- **Error Handling**: Production-ready error patterns

## 🎯 Interview Tips

### What Companies Look For

1. **Understanding Core Concepts**
   - Event loop execution order
   - Async patterns and promise handling
   - Stream vs loading full files

2. **Production Code Quality**
   - Proper error handling
   - Input validation
   - Security best practices
   - Clean, readable code

3. **Performance Awareness**
   - When to use clustering
   - When to use worker threads
   - Memory management
   - Async optimization

4. **Real-World Scenarios**
   - Building REST APIs
   - Authentication & authorization
   - WebSocket communication
   - File processing

### Common Interview Questions

**Q: Predict the output order**
```javascript
console.log('1');
setTimeout(() => console.log('2'), 0);
Promise.resolve().then(() => console.log('3'));
console.log('4');
// Answer: 1, 4, 3, 2
```
See: `03-event-loop/execution-order.js`

**Q: How do you process a large file?**
- ❌ Bad: `fs.readFileSync()` - loads entire file into memory
- ✅ Good: Streams - process in chunks

See: `04-streams/file-streaming.js`

**Q: How do you scale Node.js?**
- Clustering for web servers (multiple processes)
- Worker threads for CPU tasks (same process)

See: `13-clustering/cluster-demo.js` and `14-worker-threads/worker-demo.js`

**Q: How do you handle authentication?**
- JWT tokens (stateless)
- Refresh tokens for security
- Role-based authorization middleware

See: `08-middleware/auth-middleware.js`

## 🧪 Testing Examples

### Load Testing
```bash
# Install Apache Bench
brew install apache-bench  # macOS
apt-get install apache2-utils  # Ubuntu

# Test clustering performance
node 13-clustering/cluster-demo.js
ab -n 1000 -c 10 http://localhost:3000/fast

# Test API endpoints
ab -n 100 -c 10 http://localhost:3000/api/users
```

### Manual Testing
```bash
# Test REST API
curl http://localhost:3000/api/users
curl -X POST http://localhost:3000/api/users \
  -H "Content-Type: application/json" \
  -d '{"name":"Alice","email":"alice@example.com"}'

# Test authentication
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}'
```

## 📖 Learning Path

### Week 1-2: Fundamentals
1. Process & global objects
2. Module systems
3. Event loop execution
4. Async patterns

### Week 3-4: I/O & Streams
1. File operations
2. Stream processing
3. CSV/data transformation
4. HTTP basics

### Week 5-6: Web Development
1. Express REST API
2. Middleware patterns
3. Authentication
4. Error handling

### Week 7-8: Advanced
1. WebSockets
2. Clustering
3. Worker threads
4. Performance optimization

## 💡 Best Practices Demonstrated

1. **Always use async/await** over callbacks
2. **Use streams** for large files
3. **Implement proper error handling**
4. **Validate all inputs**
5. **Use clustering** for production
6. **Implement graceful shutdown**
7. **Log errors** with context
8. **Use environment variables**
9. **Follow REST conventions**
10. **Write testable code**

## 🔗 Related Resources

- [Main Guide](../README.md)
- [Event Loop Documentation](../03-event-loop.md)
- [Streams Guide](../04-streams.md)
- [Express Guide](../07-express.md)

## 📝 Contributing

Found an issue or have a suggestion? Feel free to open an issue or submit a pull request!

## 📄 License

MIT License - see [LICENSE](../LICENSE) file
