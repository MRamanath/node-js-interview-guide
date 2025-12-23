# 01. Node.js Fundamentals

## 📚 Overview

Node.js is a JavaScript runtime built on Chrome's V8 JavaScript engine that allows you to run JavaScript on the server-side. It uses an event-driven, non-blocking I/O model that makes it lightweight and efficient.

## 🎯 Key Concepts

### 1. What is Node.js?

Node.js is NOT:
- ❌ A programming language
- ❌ A framework
- ❌ A library

Node.js IS:
- ✅ A JavaScript runtime environment
- ✅ Built on Chrome's V8 engine
- ✅ Uses event-driven, non-blocking I/O
- ✅ Single-threaded with event loop
- ✅ Cross-platform (Windows, Linux, macOS)

### 2. Architecture

```
┌─────────────────────────────────┐
│     JavaScript Code             │
├─────────────────────────────────┤
│     Node.js Core (C++)          │
├─────────────────────────────────┤
│     V8 Engine                   │
│     (JavaScript → Machine Code) │
├─────────────────────────────────┤
│     libuv                       │
│     (Event Loop, Thread Pool)   │
└─────────────────────────────────┘
```

## 💻 Core Examples

### Global Objects

```javascript
// __dirname - Current directory path
console.log(__dirname);
// Output: /Users/yourname/project

// __filename - Current file path
console.log(__filename);
// Output: /Users/yourname/project/app.js

// process - Information about current Node.js process
console.log(process.version);        // v20.10.0
console.log(process.platform);       // darwin, win32, linux
console.log(process.arch);           // x64, arm64
console.log(process.cwd());          // Current working directory
console.log(process.pid);            // Process ID
console.log(process.uptime());       // Process uptime in seconds
console.log(process.memoryUsage());  // Memory usage details
```

### Process Environment

```javascript
// Environment variables
console.log(process.env.NODE_ENV);    // development, production
console.log(process.env.PORT);        // 3000
console.log(process.env.HOME);        // /Users/yourname

// Set environment variable
process.env.API_KEY = 'secret-key';

// Command line arguments
// Run: node app.js arg1 arg2
console.log(process.argv);
// Output: ['/path/to/node', '/path/to/app.js', 'arg1', 'arg2']

// Get only custom arguments
const args = process.argv.slice(2);
console.log(args); // ['arg1', 'arg2']
```

### Process Events

```javascript
// Exit event
process.on('exit', (code) => {
  console.log(`Process exiting with code: ${code}`);
});

// Uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
  process.exit(1);
});

// Unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise);
  console.error('Reason:', reason);
  process.exit(1);
});

// SIGTERM signal (graceful shutdown)
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});
```

### Timers

```javascript
// setTimeout - Execute after delay
setTimeout(() => {
  console.log('Executed after 2 seconds');
}, 2000);

// setInterval - Execute repeatedly
const intervalId = setInterval(() => {
  console.log('Executed every 1 second');
}, 1000);

// Clear interval
setTimeout(() => {
  clearInterval(intervalId);
}, 5000);

// setImmediate - Execute in check phase
setImmediate(() => {
  console.log('Executed in check phase');
});

// process.nextTick - Execute before I/O
process.nextTick(() => {
  console.log('Executed before I/O');
});
```

### Execution Order Example

```javascript
console.log('1. Synchronous');

setTimeout(() => {
  console.log('5. setTimeout');
}, 0);

setImmediate(() => {
  console.log('6. setImmediate');
});

process.nextTick(() => {
  console.log('3. process.nextTick');
});

Promise.resolve().then(() => {
  console.log('4. Promise');
});

console.log('2. Synchronous');

// Output order:
// 1. Synchronous
// 2. Synchronous
// 3. process.nextTick
// 4. Promise
// 5. setTimeout
// 6. setImmediate
```

## 🎤 Interview Questions

### Q1: What is Node.js and how is it different from JavaScript?
**Answer:** Node.js is a runtime environment that allows JavaScript to run on the server-side, outside the browser. JavaScript is the programming language, while Node.js provides the environment with additional APIs for file system, networking, etc.

### Q2: Is Node.js single-threaded or multi-threaded?
**Answer:** Node.js runs JavaScript in a single thread, but uses libuv (written in C++) for multi-threaded I/O operations. The event loop is single-threaded, but blocking operations are handled by a thread pool.

### Q3: What is the V8 engine?
**Answer:** V8 is Google's open-source JavaScript engine written in C++. It compiles JavaScript directly to native machine code before executing it, making it very fast.

### Q4: What are global objects in Node.js?
**Answer:** Global objects available without importing:
- `__dirname` - Current directory path
- `__filename` - Current file path
- `process` - Process information
- `Buffer` - Binary data handling
- `console` - Console output
- `setTimeout`, `setInterval`, `setImmediate`
- `global` - Global namespace

### Q5: What is process.nextTick() and when to use it?
**Answer:** `process.nextTick()` schedules a callback to execute immediately after the current operation completes, before any I/O events. It has higher priority than `setImmediate()` and `setTimeout()`. Use it for:
- Ensuring async execution
- Handling events after current operation
- **Warning:** Recursive `nextTick()` can block I/O

### Q6: Difference between setImmediate() and setTimeout()?
**Answer:**
- `setTimeout(fn, 0)` - Executes in timers phase of event loop
- `setImmediate(fn)` - Executes in check phase of event loop
- In I/O callbacks, `setImmediate()` always executes first
- Outside I/O, order is non-deterministic

### Q7: What is process.env used for?
**Answer:** `process.env` is an object containing environment variables. Used for:
- Configuration (NODE_ENV, PORT, DATABASE_URL)
- API keys and secrets
- Feature flags
- Environment-specific settings

```javascript
// .env file
NODE_ENV=production
PORT=3000
DATABASE_URL=mongodb://localhost:27017/mydb

// Access in code
if (process.env.NODE_ENV === 'production') {
  // Production logic
}
```

### Q8: How to handle uncaught exceptions?
**Answer:**
```javascript
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
  // Log the error
  // Clean up resources
  // Exit gracefully
  process.exit(1);
});

// Better: Use try-catch and async error handling
```

### Q9: What is the difference between process.exit() and return?
**Answer:**
- `process.exit(code)` - Terminates the entire Node.js process immediately
- `return` - Only exits the current function
- `process.exit(0)` - Success
- `process.exit(1)` - Failure

### Q10: How to read command line arguments?
**Answer:**
```javascript
// node app.js --port 3000 --env production
const args = process.argv.slice(2);

// Better: Parse arguments
const port = args.find(arg => arg.startsWith('--port'))?.split('=')[1];
const env = args.find(arg => arg.startsWith('--env'))?.split('=')[1];

// Best: Use libraries like yargs or commander
```

## 🎯 Best Practices

1. **Always handle errors**
   ```javascript
   process.on('uncaughtException', errorHandler);
   process.on('unhandledRejection', errorHandler);
   ```

2. **Use environment variables for configuration**
   ```javascript
   const PORT = process.env.PORT || 3000;
   const NODE_ENV = process.env.NODE_ENV || 'development';
   ```

3. **Graceful shutdown**
   ```javascript
   process.on('SIGTERM', gracefulShutdown);
   process.on('SIGINT', gracefulShutdown);
   ```

4. **Monitor process health**
   ```javascript
   console.log('Memory:', process.memoryUsage());
   console.log('Uptime:', process.uptime());
   ```

## 📚 Additional Resources

- [Node.js Official Docs](https://nodejs.org/docs/)
- [Process API](https://nodejs.org/api/process.html)
- [Global Objects](https://nodejs.org/api/globals.html)

---

[← Back to Main](../README.md) | [Next: Modules →](./02-modules.md)
