/**
 * Error Handling Patterns - Critical Interview Topic!
 * "How do you handle errors in production?"
 */

const express = require('express');
const app = express();

app.use(express.json());

// ========================================
// 1. CUSTOM ERROR CLASSES
// ========================================

class AppError extends Error {
  constructor(message, statusCode = 500, isOperational = true) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.timestamp = new Date().toISOString();
    Error.captureStackTrace(this, this.constructor);
  }
}

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
  constructor(message = 'Unauthorized access') {
    super(message, 401);
  }
}

class ForbiddenError extends AppError {
  constructor(message = 'Forbidden') {
    super(message, 403);
  }
}

class ConflictError extends AppError {
  constructor(message = 'Resource conflict') {
    super(message, 409);
  }
}

// ========================================
// 2. ASYNC ERROR WRAPPER
// ========================================

function asyncHandler(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

// ========================================
// 3. VALIDATION HELPER
// ========================================

function validate(schema) {
  return (req, res, next) => {
    const { error } = schema.validate(req.body);
    if (error) {
      throw new ValidationError(
        'Validation failed',
        error.details.map(d => ({
          field: d.path[0],
          message: d.message
        }))
      );
    }
    next();
  };
}

// ========================================
// 4. DATABASE SIMULATOR
// ========================================

const users = [
  { id: 1, name: 'Alice', email: 'alice@example.com' },
  { id: 2, name: 'Bob', email: 'bob@example.com' }
];

// ========================================
// 5. ROUTES WITH ERROR EXAMPLES
// ========================================

// Example 1: Try-catch in async route
app.get('/users/:id', asyncHandler(async (req, res) => {
  const { id } = req.params;
  
  // Validate
  if (isNaN(id)) {
    throw new ValidationError('Invalid user ID');
  }
  
  // Find user
  const user = users.find(u => u.id === parseInt(id));
  
  if (!user) {
    throw new NotFoundError('User');
  }
  
  res.json({ success: true, data: user });
}));

// Example 2: Multiple error types
app.post('/users', asyncHandler(async (req, res) => {
  const { name, email } = req.body;
  
  // Validation
  if (!name || !email) {
    throw new ValidationError('Missing required fields', [
      { field: 'name', message: 'Name is required' },
      { field: 'email', message: 'Email is required' }
    ]);
  }
  
  // Check duplicate
  if (users.find(u => u.email === email)) {
    throw new ConflictError('Email already exists');
  }
  
  // Simulate database error
  if (name === 'error') {
    throw new Error('Database connection failed');
  }
  
  const newUser = {
    id: users.length + 1,
    name,
    email
  };
  
  users.push(newUser);
  res.status(201).json({ success: true, data: newUser });
}));

// Example 3: Authorization error
app.delete('/users/:id', asyncHandler(async (req, res) => {
  const userRole = req.headers['x-user-role'];
  
  if (!userRole) {
    throw new UnauthorizedError('Authentication required');
  }
  
  if (userRole !== 'admin') {
    throw new ForbiddenError('Admin access required');
  }
  
  const { id } = req.params;
  const index = users.findIndex(u => u.id === parseInt(id));
  
  if (index === -1) {
    throw new NotFoundError('User');
  }
  
  const deleted = users.splice(index, 1)[0];
  res.json({ success: true, data: deleted });
}));

// Example 4: Unhandled error (will be caught by global handler)
app.get('/error', (req, res) => {
  // This will trigger error handler
  throw new Error('Intentional error for testing');
});

// Example 5: Async error without try-catch
app.get('/async-error', asyncHandler(async (req, res) => {
  // Simulated async operation that fails
  await new Promise((resolve, reject) => {
    setTimeout(() => reject(new Error('Async operation failed')), 100);
  });
  
  res.json({ success: true });
}));

// Example 6: Nested errors
app.get('/nested-error', asyncHandler(async (req, res) => {
  try {
    await someOperation();
  } catch (err) {
    // Re-throw with context
    throw new AppError(
      `Failed to process request: ${err.message}`,
      500
    );
  }
}));

async function someOperation() {
  throw new Error('Operation failed');
}

// ========================================
// 6. 404 HANDLER (must be after all routes)
// ========================================

app.use((req, res, next) => {
  throw new NotFoundError('Route');
});

// ========================================
// 7. GLOBAL ERROR HANDLER
// ========================================

app.use((err, req, res, next) => {
  console.error('Error occurred:');
  console.error('Message:', err.message);
  console.error('Stack:', err.stack);
  
  // Default to 500 if not specified
  const statusCode = err.statusCode || 500;
  
  // Operational errors (safe to send to client)
  if (err.isOperational) {
    return res.status(statusCode).json({
      success: false,
      error: {
        message: err.message,
        statusCode,
        timestamp: err.timestamp || new Date().toISOString(),
        ...(err.errors && { errors: err.errors })
      }
    });
  }
  
  // Programming errors (don't leak details)
  console.error('CRITICAL ERROR:', err);
  
  // In production, log to error tracking service
  // logToErrorTracker(err, req);
  
  res.status(500).json({
    success: false,
    error: {
      message: 'Internal server error',
      statusCode: 500,
      timestamp: new Date().toISOString()
    }
  });
});

// ========================================
// 8. PROCESS-LEVEL ERROR HANDLING
// ========================================

// Uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error('UNCAUGHT EXCEPTION! Shutting down...');
  console.error(err.name, err.message);
  console.error(err.stack);
  
  // Exit process (should be restarted by PM2/Docker)
  process.exit(1);
});

// Unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('UNHANDLED REJECTION! Shutting down...');
  console.error('Reason:', reason);
  
  // Exit process
  process.exit(1);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received. Closing server gracefully...');
  
  server.close(() => {
    console.log('Server closed. Process terminating...');
    process.exit(0);
  });
  
  // Force close after 10 seconds
  setTimeout(() => {
    console.error('Forced shutdown after timeout');
    process.exit(1);
  }, 10000);
});

// ========================================
// START SERVER
// ========================================

const PORT = 3000;
const server = app.listen(PORT, () => {
  console.log(`Error handling demo running on http://localhost:${PORT}`);
  console.log('\nTest these endpoints:');
  console.log('✓ GET  /users/1           - Success');
  console.log('✗ GET  /users/999         - 404 Not Found');
  console.log('✗ GET  /users/invalid     - 400 Validation Error');
  console.log('✗ POST /users             - 400 Missing Fields');
  console.log('✗ POST /users {email:"alice@example.com"} - 409 Conflict');
  console.log('✗ DELETE /users/1         - 401 Unauthorized');
  console.log('✗ DELETE /users/1 (header: x-user-role:user) - 403 Forbidden');
  console.log('✓ DELETE /users/1 (header: x-user-role:admin) - Success');
  console.log('✗ GET  /error             - 500 Internal Error');
  console.log('✗ GET  /async-error       - 500 Async Error');
  console.log('✗ GET  /invalid-route     - 404 Route Not Found');
});

module.exports = { app, AppError, asyncHandler };

/* INTERVIEW KEY POINTS:

1. CUSTOM ERROR CLASSES
   - Extend Error class
   - Add statusCode, isOperational
   - Use for different error types

2. ERROR PROPAGATION
   - Throw errors in async functions
   - Use asyncHandler wrapper
   - Errors automatically caught by Express

3. GLOBAL ERROR HANDLER
   - 4 parameters: (err, req, res, next)
   - Must be last middleware
   - Check if operational vs programming error

4. OPERATIONAL ERRORS (expected, safe to show)
   - Validation errors
   - Not found errors
   - Authentication errors
   - Send detailed message to client

5. PROGRAMMING ERRORS (bugs, don't show details)
   - Undefined variables
   - Type errors
   - Database connection failures
   - Send generic message, log details

6. ASYNC ERROR HANDLING
   - Wrap async routes with asyncHandler
   - Catches rejected promises
   - Passes to error handler

7. PROCESS-LEVEL ERRORS
   - uncaughtException - synchronous errors
   - unhandledRejection - async errors
   - SIGTERM - graceful shutdown

8. PRODUCTION BEST PRACTICES
   - Use error tracking (Sentry, Rollbar)
   - Log errors with context
   - Restart process on critical errors
   - Use PM2 for automatic restarts
   - Don't leak sensitive info
   - Validate all inputs
   - Use circuit breakers for external services
*/
