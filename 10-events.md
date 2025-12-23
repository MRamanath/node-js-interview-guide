# 10. Events

## 📚 Overview

The EventEmitter class is the foundation of event-driven architecture in Node.js. Many core Node.js modules extend EventEmitter to emit and handle custom events.

## 🎯 Key Concepts

### Event-Driven Architecture

```
Event Emitter → Emit Event → Event Listeners Execute
     ↓              ↓                ↓
  Object         'data'         callback1, callback2
```

## 💻 Examples

### Basic EventEmitter

```javascript
const EventEmitter = require('events');
const emitter = new EventEmitter();

// Register listener
emitter.on('event', () => {
  console.log('Event occurred!');
});

// Emit event
emitter.emit('event'); // "Event occurred!"

// With arguments
emitter.on('data', (value) => {
  console.log('Received:', value);
});

emitter.emit('data', 'Hello World'); // "Received: Hello World"

// Multiple arguments
emitter.on('user', (name, age) => {
  console.log(`User: ${name}, Age: ${age}`);
});

emitter.emit('user', 'Alice', 30); // "User: Alice, Age: 30"
```

### Multiple Listeners

```javascript
const emitter = new EventEmitter();

// Multiple listeners for same event
emitter.on('data', (data) => {
  console.log('Listener 1:', data);
});

emitter.on('data', (data) => {
  console.log('Listener 2:', data);
});

emitter.on('data', (data) => {
  console.log('Listener 3:', data);
});

emitter.emit('data', 'test');
// Output:
// Listener 1: test
// Listener 2: test
// Listener 3: test

// Listeners execute in order they were registered
```

### once() - Single Execution

```javascript
const emitter = new EventEmitter();

// Regular listener (fires every time)
emitter.on('event', () => {
  console.log('Regular listener');
});

// One-time listener (fires only once)
emitter.once('event', () => {
  console.log('One-time listener');
});

emitter.emit('event');
// Regular listener
// One-time listener

emitter.emit('event');
// Regular listener
// (one-time listener doesn't fire again)
```

### Removing Listeners

```javascript
const emitter = new EventEmitter();

function listener() {
  console.log('Event fired');
}

// Add listener
emitter.on('event', listener);

// Remove specific listener
emitter.off('event', listener);
// OR
emitter.removeListener('event', listener);

// Remove all listeners for an event
emitter.removeAllListeners('event');

// Remove all listeners for all events
emitter.removeAllListeners();

// Get listener count
console.log(emitter.listenerCount('event')); // 0
```

### Extending EventEmitter

```javascript
const EventEmitter = require('events');

class MyEmitter extends EventEmitter {
  constructor() {
    super();
    this.data = [];
  }
  
  addData(value) {
    this.data.push(value);
    this.emit('dataAdded', value);
    
    if (this.data.length >= 10) {
      this.emit('dataFull', this.data);
    }
  }
  
  clearData() {
    this.data = [];
    this.emit('dataCleared');
  }
}

const myEmitter = new MyEmitter();

myEmitter.on('dataAdded', (value) => {
  console.log('Data added:', value);
});

myEmitter.on('dataFull', (data) => {
  console.log('Data is full:', data.length);
});

myEmitter.on('dataCleared', () => {
  console.log('Data cleared');
});

myEmitter.addData(1);  // "Data added: 1"
myEmitter.addData(2);  // "Data added: 2"
```

### Real-World Example: Custom Logger

```javascript
class Logger extends EventEmitter {
  log(message, level = 'info') {
    const timestamp = new Date().toISOString();
    const logEntry = { timestamp, level, message };
    
    this.emit('log', logEntry);
    
    if (level === 'error') {
      this.emit('error', logEntry);
    }
  }
  
  info(message) {
    this.log(message, 'info');
  }
  
  warn(message) {
    this.log(message, 'warn');
  }
  
  error(message) {
    this.log(message, 'error');
  }
}

const logger = new Logger();

// File logger
logger.on('log', (entry) => {
  fs.appendFileSync('app.log', JSON.stringify(entry) + '\n');
});

// Console logger
logger.on('log', (entry) => {
  console.log(`[${entry.level.toUpperCase()}] ${entry.message}`);
});

// Alert on errors
logger.on('error', (entry) => {
  sendAlert(entry.message);
});

logger.info('Application started');
logger.error('Database connection failed');
```

### Error Events

```javascript
const emitter = new EventEmitter();

// Error events are special - if no listener, they crash the app
emitter.on('error', (err) => {
  console.error('Error occurred:', err.message);
});

emitter.emit('error', new Error('Something went wrong'));

// Without error listener, this would crash:
// emitter.emit('error', new Error('Boom!')); // Throws!

// Best practice: Always add error listener
class SafeEmitter extends EventEmitter {
  constructor() {
    super();
    this.on('error', (err) => {
      console.error('Unhandled error:', err);
    });
  }
}
```

### Event Names and Best Practices

```javascript
const emitter = new EventEmitter();

// Use descriptive names
emitter.on('user:created', handleUserCreated);
emitter.on('user:updated', handleUserUpdated);
emitter.on('user:deleted', handleUserDeleted);

// Use Symbol for private events
const INTERNAL_EVENT = Symbol('internal');

emitter.on(INTERNAL_EVENT, () => {
  console.log('Internal event');
});

emitter.emit(INTERNAL_EVENT);

// Constants for event names (prevent typos)
const Events = {
  DATA_RECEIVED: 'data:received',
  DATA_PROCESSED: 'data:processed',
  ERROR: 'error'
};

emitter.on(Events.DATA_RECEIVED, handleData);
emitter.emit(Events.DATA_RECEIVED, data);
```

### Listener Management

```javascript
const emitter = new EventEmitter();

// Get all event names
console.log(emitter.eventNames()); // []

// Add listeners
emitter.on('event1', () => {});
emitter.on('event2', () => {});

console.log(emitter.eventNames()); // ['event1', 'event2']

// Get listeners for event
const listeners = emitter.listeners('event1');
console.log(listeners.length); // 1

// Get listener count
console.log(emitter.listenerCount('event1')); // 1

// Check if has listeners
console.log(emitter.listenerCount('event1') > 0); // true

// Raw listeners (includes once wrappers)
const rawListeners = emitter.rawListeners('event1');
```

### prependListener

```javascript
const emitter = new EventEmitter();

emitter.on('event', () => console.log('Second'));
emitter.on('event', () => console.log('Third'));

// Add to beginning
emitter.prependListener('event', () => console.log('First'));

emitter.emit('event');
// Output:
// First
// Second
// Third

// prependOnceListener for one-time listeners
emitter.prependOnceListener('event', () => console.log('Once First'));
```

### Memory Leak Warning

```javascript
const emitter = new EventEmitter();

// Default max listeners: 10
// Adding more triggers warning
for (let i = 0; i < 12; i++) {
  emitter.on('event', () => {});
}
// Warning: Possible EventEmitter memory leak detected

// Increase limit
emitter.setMaxListeners(20);

// Unlimited
emitter.setMaxListeners(0);

// Set default for all emitters
EventEmitter.defaultMaxListeners = 20;

// Check current max
console.log(emitter.getMaxListeners()); // 20
```

### Async Event Handlers

```javascript
const emitter = new EventEmitter();

// Async listeners
emitter.on('data', async (data) => {
  await processData(data);
  console.log('Processing complete');
});

// emit() doesn't wait for async listeners!
emitter.emit('data', 'test');
console.log('Event emitted'); // This runs first!

// If you need to wait, use promises
class AsyncEmitter extends EventEmitter {
  async emitAsync(event, ...args) {
    const listeners = this.listeners(event);
    await Promise.all(listeners.map(listener => listener(...args)));
  }
}

const asyncEmitter = new AsyncEmitter();

asyncEmitter.on('data', async (data) => {
  await processData(data);
});

await asyncEmitter.emitAsync('data', 'test');
console.log('All listeners completed');
```

### Real-World: HTTP Server Events

```javascript
const http = require('http');

const server = http.createServer();

// Server is an EventEmitter
server.on('request', (req, res) => {
  console.log('Request received');
  res.end('Hello');
});

server.on('connection', (socket) => {
  console.log('New connection');
});

server.on('error', (err) => {
  console.error('Server error:', err);
});

server.on('close', () => {
  console.log('Server closed');
});

server.listen(3000);

// Request is also an EventEmitter
server.on('request', (req, res) => {
  req.on('data', (chunk) => {
    console.log('Data chunk:', chunk);
  });
  
  req.on('end', () => {
    console.log('Request complete');
    res.end('OK');
  });
  
  req.on('error', (err) => {
    console.error('Request error:', err);
  });
});
```

### Custom Event-Driven Module

```javascript
// user-manager.js
const EventEmitter = require('events');

class UserManager extends EventEmitter {
  constructor() {
    super();
    this.users = new Map();
  }
  
  async createUser(userData) {
    this.emit('user:creating', userData);
    
    try {
      // Validate
      this.emit('user:validating', userData);
      await this.validate(userData);
      
      // Save
      const user = { id: Date.now(), ...userData };
      this.users.set(user.id, user);
      
      this.emit('user:created', user);
      return user;
    } catch (err) {
      this.emit('error', err);
      throw err;
    }
  }
  
  async updateUser(id, updates) {
    const user = this.users.get(id);
    
    if (!user) {
      const err = new Error('User not found');
      this.emit('error', err);
      throw err;
    }
    
    this.emit('user:updating', { id, updates });
    
    const updated = { ...user, ...updates };
    this.users.set(id, updated);
    
    this.emit('user:updated', updated);
    return updated;
  }
  
  deleteUser(id) {
    const user = this.users.get(id);
    
    if (user) {
      this.users.delete(id);
      this.emit('user:deleted', user);
    }
  }
  
  validate(userData) {
    // Validation logic
    if (!userData.email) {
      throw new Error('Email required');
    }
  }
}

// Usage
const userManager = new UserManager();

// Logging
userManager.on('user:created', (user) => {
  console.log('User created:', user.id);
});

// Send email
userManager.on('user:created', async (user) => {
  await sendWelcomeEmail(user.email);
});

// Analytics
userManager.on('user:created', (user) => {
  analytics.track('User Created', { userId: user.id });
});

// Error handling
userManager.on('error', (err) => {
  logger.error(err);
});

const user = await userManager.createUser({
  email: 'user@example.com',
  name: 'John Doe'
});
```

## 🎤 Interview Questions

### Q1: What is EventEmitter?
**Answer:** Core class for implementing event-driven architecture. Allows objects to emit events and register listeners.

### Q2: Difference between on() and once()?
**Answer:**
- `on()`: Listener fires every time event is emitted
- `once()`: Listener fires only once, then removed automatically

### Q3: How to remove event listeners?
**Answer:**
```javascript
emitter.off('event', listener);           // Remove specific
emitter.removeListener('event', listener); // Same as off
emitter.removeAllListeners('event');      // Remove all for event
emitter.removeAllListeners();             // Remove all
```

### Q4: What happens if you emit an error event without a listener?
**Answer:** Node.js throws the error and crashes the process. Always add error listener.

### Q5: What is the maximum number of listeners?
**Answer:** Default is 10. Exceeding triggers memory leak warning. Change with `setMaxListeners()`.

### Q6: How to extend EventEmitter?
**Answer:**
```javascript
class MyClass extends EventEmitter {
  constructor() {
    super();
  }
}
```

### Q7: Are event listeners synchronous or asynchronous?
**Answer:** Listeners execute synchronously in order registered. `emit()` doesn't wait for async listeners.

### Q8: Difference between emit() and emitAsync()?
**Answer:** `emit()` is built-in, synchronous. `emitAsync()` is custom pattern to wait for async listeners.

### Q9: Can you pass data with events?
**Answer:** Yes, as arguments:
```javascript
emitter.emit('data', value1, value2);
emitter.on('data', (val1, val2) => {});
```

### Q10: What core Node.js modules use EventEmitter?
**Answer:** 
- http.Server
- net.Server
- fs.ReadStream
- process
- child_process
- Many others

## 🎯 Best Practices

1. **Always handle error events**
   ```javascript
   emitter.on('error', (err) => {
     console.error('Error:', err);
   });
   ```

2. **Use constants for event names**
   ```javascript
   const Events = {
     USER_CREATED: 'user:created',
     USER_DELETED: 'user:deleted'
   };
   ```

3. **Clean up listeners**
   ```javascript
   // Remove when done
   emitter.removeListener('event', handler);
   ```

4. **Use once() for one-time events**
   ```javascript
   emitter.once('ready', () => {
     console.log('Ready!');
   });
   ```

5. **Document events in classes**
   ```javascript
   /**
    * @fires UserManager#user:created
    * @fires UserManager#error
    */
   class UserManager extends EventEmitter {}
   ```

## 📚 Additional Resources

- [Node.js Events API](https://nodejs.org/api/events.html)
- [EventEmitter Guide](https://nodejs.org/en/guides/event-loop-timers-and-nexttick/)

---

[← Previous: Async Patterns](./09-async-patterns.md) | [Next: Buffers →](./11-buffers.md)
