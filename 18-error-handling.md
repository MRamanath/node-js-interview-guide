# 18. Error Handling

## 📚 Overview

Proper error handling prevents crashes, provides meaningful feedback, and improves debugging. This guide covers error types, async error handling, custom errors, and production error strategies.

## 🎯 Key Concepts

### Error Handling Flow

```
Error Occurs → Try/Catch → Error Handler → Log → Response
     ↓            ↓            ↓             ↓         ↓
Operation     Catch error   Process     Record    Send to client
```

## 💻 Examples

### Basic Error Handling

```javascript
// Synchronous errors
try {
  const data = JSON.parse('invalid json');
} catch (err) {
  console.error('Parse error:', err.message);
}

// Async errors with promises
fetchData()
  .then(data => processData(data))
  .catch(err => {
    console.error('Error:', err);
  });

// Async/await
async function example() {
  try {
    const data = await fetchData();
    return processData(data);
  } catch (err) {
    console.error('Error:', err);
    throw err; // Re-throw if needed
  }
}
```

### Custom Error Classes

```javascript
// Base application error
class AppError extends Error {
  constructor(message, statusCode = 500) {
    super(message);
    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

// Specific error types
class ValidationError extends AppError {
  constructor(message, errors = []) {
    super(message, 400);
    this.errors = errors;
  }
}

class NotFoundError extends AppError {
  constructor(resource = 'Resource') {
    super(`${resource} not found`, 404);
  }
}

class UnauthorizedError extends AppError {
  constructor(message = 'Unauthorized') {
    super(message, 401);
  }
}

class ForbiddenError extends AppError {
  constructor(message = 'Forbidden') {
    super(message, 403);
  }
}

class ConflictError extends AppError {
  constructor(message = 'Resource already exists') {
    super(message, 409);
  }
}

// Usage
if (!user) {
  throw new NotFoundError('User');
}

if (existingUser) {
  throw new ConflictError('Email already registered');
}
```

### Express Error Handling

```javascript
const express = require('express');
const app = express();

// Route handler
app.get('/users/:id', async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    
    if (!user) {
      throw new NotFoundError('User');
    }
    
    res.json(user);
  } catch (err) {
    next(err); // Pass to error handler
  }
});

// Async error wrapper
function asyncHandler(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

// Usage
app.get('/users/:id', asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) throw new NotFoundError('User');
  res.json(user);
}));

// 404 handler (must be after all routes)
app.use((req, res, next) => {
  next(new NotFoundError('Route'));
});

// Error handling middleware (4 parameters!)
app.use((err, req, res, next) => {
  // Log error
  console.error('Error:', {
    message: err.message,
    stack: err.stack,
    url: req.originalUrl,
    method: req.method
  });
  
  // Determine status code
  const statusCode = err.statusCode || err.status || 500;
  
  // Development vs Production
  const response = {
    error: err.message,
    ...(process.env.NODE_ENV === 'development' && {
      stack: err.stack,
      details: err
    })
  };
  
  // Add validation errors if present
  if (err.errors) {
    response.errors = err.errors;
  }
  
  res.status(statusCode).json(response);
});
```

### Database Error Handling

```javascript
// MongoDB/Mongoose errors
app.use((err, req, res, next) => {
  // Duplicate key error
  if (err.code === 11000) {
    const field = Object.keys(err.keyPattern)[0];
    return res.status(409).json({
      error: `${field} already exists`
    });
  }
  
  // Validation error
  if (err.name === 'ValidationError') {
    const errors = Object.values(err.errors).map(e => ({
      field: e.path,
      message: e.message
    }));
    return res.status(400).json({
      error: 'Validation failed',
      errors
    });
  }
  
  // Cast error (invalid ObjectId)
  if (err.name === 'CastError') {
    return res.status(400).json({
      error: `Invalid ${err.path}`
    });
  }
  
  next(err);
});

// PostgreSQL errors
app.use((err, req, res, next) => {
  // Unique violation
  if (err.code === '23505') {
    return res.status(409).json({
      error: 'Resource already exists',
      detail: err.detail
    });
  }
  
  // Foreign key violation
  if (err.code === '23503') {
    return res.status(400).json({
      error: 'Referenced resource does not exist'
    });
  }
  
  // Not null violation
  if (err.code === '23502') {
    return res.status(400).json({
      error: `${err.column} is required`
    });
  }
  
  next(err);
});
```

### Unhandled Errors

```javascript
// Unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  
  // In production: log to error tracking service
  // Then gracefully shutdown
  process.exit(1);
});

// Uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
  
  // Log error
  logger.fatal(err);
  
  // Graceful shutdown
  process.exit(1);
});

// Graceful shutdown
process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);

async function gracefulShutdown() {
  console.log('Shutting down gracefully...');
  
  // Stop accepting new requests
  server.close(async () => {
    console.log('HTTP server closed');
    
    // Close database connections
    await mongoose.connection.close();
    await pool.end();
    await redis.quit();
    
    console.log('All connections closed');
    process.exit(0);
  });
  
  // Force close after 10 seconds
  setTimeout(() => {
    console.error('Forced shutdown');
    process.exit(1);
  }, 10000);
}
```

### Logging Errors

```javascript
const winston = require('winston');

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' })
  ]
});

if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.combine(
      winston.format.colorize(),
      winston.format.simple()
    )
  }));
}

// Use in error handler
app.use((err, req, res, next) => {
  logger.error('Error occurred', {
    message: err.message,
    stack: err.stack,
    url: req.originalUrl,
    method: req.method,
    ip: req.ip,
    userId: req.user?.id
  });
  
  res.status(err.statusCode || 500).json({
    error: err.message
  });
});
```

### Error Recovery

```javascript
// Retry pattern
async function retryOperation(operation, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await operation();
    } catch (err) {
      if (i === maxRetries - 1) throw err;
      
      const delay = Math.pow(2, i) * 1000; // Exponential backoff
      console.log(`Retry ${i + 1}/${maxRetries} after ${delay}ms`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
}

// Usage
const data = await retryOperation(() => fetchFromAPI());

// Circuit breaker pattern
class CircuitBreaker {
  constructor(request, options = {}) {
    this.request = request;
    this.state = 'CLOSED';
    this.failureCount = 0;
    this.successCount = 0;
    this.nextAttempt = Date.now();
    this.failureThreshold = options.failureThreshold || 5;
    this.timeout = options.timeout || 60000;
  }
  
  async execute() {
    if (this.state === 'OPEN') {
      if (Date.now() < this.nextAttempt) {
        throw new Error('Circuit breaker is OPEN');
      }
      this.state = 'HALF_OPEN';
    }
    
    try {
      const response = await this.request();
      this.onSuccess();
      return response;
    } catch (err) {
      this.onFailure();
      throw err;
    }
  }
  
  onSuccess() {
    this.failureCount = 0;
    if (this.state === 'HALF_OPEN') {
      this.state = 'CLOSED';
    }
  }
  
  onFailure() {
    this.failureCount++;
    if (this.failureCount >= this.failureThreshold) {
      this.state = 'OPEN';
      this.nextAttempt = Date.now() + this.timeout;
    }
  }
}

// Usage
const breaker = new CircuitBreaker(() => fetchFromAPI());
const data = await breaker.execute();
```

### API Error Responses

```javascript
// Standardized error response
function errorResponse(res, err) {
  const statusCode = err.statusCode || 500;
  
  const response = {
    status: 'error',
    message: err.message,
    ...(err.errors && { errors: err.errors }),
    ...(process.env.NODE_ENV === 'development' && {
      stack: err.stack
    })
  };
  
  res.status(statusCode).json(response);
}

// Success response helper
function successResponse(res, data, message = 'Success', statusCode = 200) {
  res.status(statusCode).json({
    status: 'success',
    message,
    data
  });
}

// Usage
try {
  const user = await createUser(req.body);
  successResponse(res, user, 'User created', 201);
} catch (err) {
  errorResponse(res, err);
}
```

## 🎤 Interview Questions

### Q1: Difference between operational and programmer errors?
**Answer:**
- **Operational**: Expected errors (network fail, invalid input) - handle gracefully
- **Programmer**: Bugs in code (undefined variable, logic error) - should crash and fix

### Q2: How to handle async errors in Express?
**Answer:** Use try-catch with async/await, or `.catch()` with promises. Pass to `next(err)`. Or use async wrapper.

### Q3: What is error-first callback pattern?
**Answer:** First parameter is error, second is result:
```javascript
callback(err, result)
if (err) { /* handle error */ }
```

### Q4: How does Express error handling work?
**Answer:** Error middleware has 4 parameters: `(err, req, res, next)`. Must be defined after all routes. Express catches sync errors automatically.

### Q5: What is Error.captureStackTrace()?
**Answer:** V8 method that populates error stack trace. Improves performance by only capturing when needed.

### Q6: How to handle unhandled promise rejections?
**Answer:**
```javascript
process.on('unhandledRejection', (reason) => {
  console.error(reason);
  process.exit(1);
});
```

### Q7: Difference between throw and next(err)?
**Answer:**
- `throw`: Sync errors, breaks execution
- `next(err)`: Async-friendly, passes to Express error handler

### Q8: How to prevent sensitive data in error messages?
**Answer:** Different responses for dev/prod. Log full error, send generic message to client.

### Q9: What is a circuit breaker?
**Answer:** Prevents repeated calls to failing service. Opens circuit after threshold, periodically tries again.

### Q10: How to gracefully shutdown on error?
**Answer:** Close server, drain connections, close DB, exit process. Set timeout for force shutdown.

## 🎯 Best Practices

1. **Use custom error classes**
   ```javascript
   class NotFoundError extends AppError {}
   throw new NotFoundError('User');
   ```

2. **Always use async error handler**
   ```javascript
   app.get('/route', asyncHandler(async (req, res) => {}));
   ```

3. **Log errors properly**
   ```javascript
   logger.error('Error:', { err, req, user });
   ```

4. **Handle unhandled rejections**
   ```javascript
   process.on('unhandledRejection', handler);
   ```

5. **Don't expose internal errors**
   ```javascript
   const message = process.env.NODE_ENV === 'production'
     ? 'Internal server error'
     : err.message;
   ```

## 📚 Additional Resources

- [Node.js Error Handling](https://nodejs.org/api/errors.html)
- [Express Error Handling](https://expressjs.com/en/guide/error-handling.html)
- [Error Handling Best Practices](https://goldbergyoni.com/checklist-best-practices-of-node-js-error-handling/)

---

[← Previous: Validation](./17-validation.md) | [Next: Testing →](./19-testing.md)
