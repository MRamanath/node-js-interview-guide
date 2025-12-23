# 08. Middleware

## 📚 Overview

Middleware functions are the building blocks of Express applications. They have access to the request and response objects and can execute code, modify these objects, end the request-response cycle, or call the next middleware.

## 🎯 Key Concepts

### Middleware Flow

```
Request → Middleware 1 → Middleware 2 → Route Handler → Response
            ↓              ↓                  ↓
         next()        next()            res.send()
```

## 💻 Examples

### Basic Middleware Pattern

```javascript
const express = require('express');
const app = express();

// Middleware function signature
function myMiddleware(req, res, next) {
  // 1. Execute code
  console.log('Middleware executed');
  
  // 2. Modify request/response
  req.customProperty = 'value';
  res.setHeader('X-Custom-Header', 'value');
  
  // 3. Either:
  next();              // Pass to next middleware
  // OR
  res.send('Done');    // End request-response cycle
}

app.use(myMiddleware);
```

### Application-Level Middleware

```javascript
// Applied to all routes
app.use((req, res, next) => {
  console.log('Time:', Date.now());
  next();
});

// Applied to specific path
app.use('/api', (req, res, next) => {
  console.log('API request');
  next();
});

// Multiple middleware functions
app.use(
  (req, res, next) => {
    console.log('First');
    next();
  },
  (req, res, next) => {
    console.log('Second');
    next();
  }
);
```

### Router-Level Middleware

```javascript
const router = express.Router();

// Middleware for all routes in this router
router.use((req, res, next) => {
  console.log('Router middleware');
  next();
});

// Middleware for specific route
router.use('/user/:id', (req, res, next) => {
  console.log('User ID:', req.params.id);
  next();
});

router.get('/user/:id', (req, res) => {
  res.send('User info');
});

app.use('/api', router);
```

### Route-Specific Middleware

```javascript
// Single middleware
app.get('/protected', authenticate, (req, res) => {
  res.json({ message: 'Protected data' });
});

// Multiple middleware (executed in order)
app.post('/admin',
  authenticate,
  checkAdmin,
  validateInput,
  (req, res) => {
    res.json({ message: 'Admin action completed' });
  }
);

// Array of middleware
const middleware = [authenticate, checkAdmin, validateInput];
app.post('/admin', middleware, (req, res) => {
  res.json({ success: true });
});
```

### Built-in Middleware

```javascript
// Parse JSON request bodies
app.use(express.json());

// Parse URL-encoded bodies (form submissions)
app.use(express.urlencoded({ extended: true }));

// Serve static files
app.use(express.static('public'));

// With options
app.use(express.json({
  limit: '10mb',  // Max request size
  strict: true    // Only accept arrays and objects
}));

app.use(express.urlencoded({
  extended: true,  // Use qs library (vs querystring)
  limit: '10mb'
}));

app.use(express.static('public', {
  maxAge: '1d',     // Cache duration
  index: 'index.html',
  etag: true
}));
```

### Logging Middleware

```javascript
// Simple logger
function logger(req, res, next) {
  console.log(`${req.method} ${req.path} - ${new Date().toISOString()}`);
  next();
}

// Detailed logger
function detailedLogger(req, res, next) {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(
      `[${new Date().toISOString()}] ` +
      `${req.method} ${req.originalUrl} ` +
      `${res.statusCode} ${duration}ms`
    );
  });
  
  next();
}

app.use(detailedLogger);

// Using morgan (popular logging library)
const morgan = require('morgan');
app.use(morgan('combined')); // Apache combined format
app.use(morgan('dev'));      // Development format
app.use(morgan('tiny'));     // Minimal format

// Custom morgan format
app.use(morgan(':method :url :status :res[content-length] - :response-time ms'));
```

### Authentication Middleware

```javascript
// JWT authentication
const jwt = require('jsonwebtoken');

function authenticate(req, res, next) {
  // Get token from header
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN
  
  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }
  
  try {
    const user = jwt.verify(token, process.env.JWT_SECRET);
    req.user = user; // Attach user to request
    next();
  } catch (err) {
    res.status(403).json({ error: 'Invalid token' });
  }
}

// Usage
app.get('/profile', authenticate, (req, res) => {
  res.json({ user: req.user });
});

// Optional authentication
function optionalAuth(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1];
  
  if (token) {
    try {
      req.user = jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
      // Invalid token - just continue without user
    }
  }
  
  next();
}
```

### Authorization Middleware

```javascript
// Check user role
function authorize(...roles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }
    
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Not authorized' });
    }
    
    next();
  };
}

// Usage
app.delete('/users/:id',
  authenticate,
  authorize('admin', 'moderator'),
  (req, res) => {
    // Delete user
  }
);

// Check resource ownership
function checkOwnership(req, res, next) {
  const resourceUserId = req.params.userId;
  
  if (req.user.id !== resourceUserId && req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Not authorized' });
  }
  
  next();
}

app.put('/users/:userId/profile',
  authenticate,
  checkOwnership,
  (req, res) => {
    // Update profile
  }
);
```

### Validation Middleware

```javascript
// Manual validation
function validateUser(req, res, next) {
  const { name, email, age } = req.body;
  
  if (!name || typeof name !== 'string' || name.trim().length === 0) {
    return res.status(400).json({ error: 'Invalid name' });
  }
  
  if (!email || !email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
    return res.status(400).json({ error: 'Invalid email' });
  }
  
  if (age !== undefined && (!Number.isInteger(age) || age < 0 || age > 150)) {
    return res.status(400).json({ error: 'Invalid age' });
  }
  
  next();
}

app.post('/users', validateUser, (req, res) => {
  // Create user
});

// Using Joi
const Joi = require('joi');

function validate(schema) {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.body);
    
    if (error) {
      return res.status(400).json({
        error: 'Validation failed',
        details: error.details.map(d => d.message)
      });
    }
    
    req.body = value; // Use sanitized values
    next();
  };
}

const userSchema = Joi.object({
  name: Joi.string().min(2).max(50).required(),
  email: Joi.string().email().required(),
  age: Joi.number().integer().min(0).max(150),
  role: Joi.string().valid('user', 'admin').default('user')
});

app.post('/users', validate(userSchema), (req, res) => {
  // Create user with validated data
});
```

### Rate Limiting Middleware

```javascript
const rateLimit = require('express-rate-limit');

// General rate limiter
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Max 100 requests per windowMs
  message: 'Too many requests, please try again later',
  standardHeaders: true,
  legacyHeaders: false
});

app.use(limiter);

// API-specific rate limiter
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 1000
});

app.use('/api', apiLimiter);

// Login rate limiter (stricter)
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  skipSuccessfulRequests: true // Don't count successful logins
});

app.post('/login', loginLimiter, (req, res) => {
  // Handle login
});

// Custom rate limiter
const requestCounts = new Map();

function customRateLimiter(max, windowMs) {
  return (req, res, next) => {
    const ip = req.ip;
    const now = Date.now();
    
    if (!requestCounts.has(ip)) {
      requestCounts.set(ip, { count: 1, resetTime: now + windowMs });
      return next();
    }
    
    const record = requestCounts.get(ip);
    
    if (now > record.resetTime) {
      record.count = 1;
      record.resetTime = now + windowMs;
      return next();
    }
    
    if (record.count >= max) {
      return res.status(429).json({ error: 'Too many requests' });
    }
    
    record.count++;
    next();
  };
}
```

### CORS Middleware

```javascript
// Manual CORS
function cors(req, res, next) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Max-Age', '86400'); // 24 hours
  
  // Handle preflight
  if (req.method === 'OPTIONS') {
    return res.sendStatus(204);
  }
  
  next();
}

app.use(cors);

// Using cors package
const cors = require('cors');

app.use(cors()); // Enable all CORS

// Configured CORS
app.use(cors({
  origin: ['https://example.com', 'https://app.example.com'],
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
  maxAge: 86400
}));

// Dynamic origin
app.use(cors({
  origin: function(origin, callback) {
    const allowedOrigins = process.env.ALLOWED_ORIGINS.split(',');
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  }
}));
```

### Security Middleware

```javascript
const helmet = require('helmet');

// Use all helmet middleware
app.use(helmet());

// Individual helmet middleware
app.use(helmet.contentSecurityPolicy({
  directives: {
    defaultSrc: ["'self'"],
    styleSrc: ["'self'", "'unsafe-inline'"],
    scriptSrc: ["'self'"],
    imgSrc: ["'self'", 'data:', 'https:']
  }
}));

app.use(helmet.hsts({
  maxAge: 31536000, // 1 year
  includeSubDomains: true,
  preload: true
}));

// XSS protection
app.use(helmet.xssFilter());

// Prevent clickjacking
app.use(helmet.frameguard({ action: 'deny' }));

// Hide X-Powered-By header
app.use(helmet.hidePoweredBy());

// Custom security headers
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  next();
});
```

### Error Handling Middleware

```javascript
// Error handler (must have 4 parameters!)
app.use((err, req, res, next) => {
  console.error(err.stack);
  
  // Mongoose validation error
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      error: 'Validation failed',
      details: Object.values(err.errors).map(e => e.message)
    });
  }
  
  // JWT error
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({ error: 'Invalid token' });
  }
  
  // Default error
  res.status(err.statusCode || 500).json({
    error: process.env.NODE_ENV === 'production'
      ? 'Internal server error'
      : err.message
  });
});

// 404 handler (put last!)
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Async error wrapper
function asyncHandler(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

app.get('/users', asyncHandler(async (req, res) => {
  const users = await User.find();
  res.json(users);
}));
```

### Request ID Middleware

```javascript
const { v4: uuidv4 } = require('uuid');

function requestId(req, res, next) {
  req.id = uuidv4();
  res.setHeader('X-Request-ID', req.id);
  next();
}

app.use(requestId);

// Use in logs
app.use((req, res, next) => {
  console.log(`[${req.id}] ${req.method} ${req.path}`);
  next();
});
```

## 🎤 Interview Questions

### Q1: What is middleware in Express?
**Answer:** Functions with access to req, res, and next. They execute in order, can modify request/response, end the cycle, or call next middleware.

### Q2: What are the types of middleware?
**Answer:**
- Application-level: `app.use()`
- Router-level: `router.use()`
- Error-handling: 4 parameters
- Built-in: `express.json()`, `express.static()`
- Third-party: `morgan`, `helmet`, `cors`

### Q3: What is next() in middleware?
**Answer:** Function that passes control to next middleware. Must call it or end response. `next(err)` passes to error handler.

### Q4: Difference between app.use() and app.get()?
**Answer:**
- `app.use()`: Middleware, all methods, path prefix matching
- `app.get()`: Route handler, GET only, exact path matching

### Q5: How to create error-handling middleware?
**Answer:** Must have 4 parameters (err, req, res, next):
```javascript
app.use((err, req, res, next) => {
  res.status(500).json({ error: err.message });
});
```

### Q6: What is express.json() middleware?
**Answer:** Built-in middleware that parses incoming JSON request bodies. Must use before accessing req.body.

### Q7: How to skip middleware?
**Answer:**
```javascript
function conditionalMiddleware(req, res, next) {
  if (condition) {
    return next(); // Skip this middleware logic
  }
  // Execute middleware logic
  next();
}
```

### Q8: Order of middleware execution?
**Answer:** Executes in order defined. First registered, first executed. Error handlers go last.

### Q9: Can middleware modify request/response?
**Answer:** Yes! Common pattern:
```javascript
function authenticate(req, res, next) {
  req.user = getUserFromToken();
  next();
}
```

### Q10: How to handle async errors in middleware?
**Answer:**
```javascript
function asyncHandler(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

app.get('/route', asyncHandler(async (req, res) => {
  await doAsyncWork();
}));
```

## 🎯 Best Practices

1. **Always call next() or end response**
   ```javascript
   app.use((req, res, next) => {
     // Do work
     next(); // Don't forget!
   });
   ```

2. **Use async error handlers**
   ```javascript
   const asyncHandler = fn => (req, res, next) =>
     Promise.resolve(fn(req, res, next)).catch(next);
   ```

3. **Order matters**
   ```javascript
   app.use(express.json());    // Parse body first
   app.use(authenticate);       // Then authenticate
   app.use('/api', routes);     // Then routes
   app.use(errorHandler);       // Error handler last
   ```

4. **Use helmet for security**
   ```javascript
   const helmet = require('helmet');
   app.use(helmet());
   ```

5. **Implement rate limiting**
   ```javascript
   const rateLimit = require('express-rate-limit');
   app.use(rateLimit({ windowMs: 15 * 60 * 1000, max: 100 }));
   ```

## 📚 Additional Resources

- [Express Middleware Guide](https://expressjs.com/en/guide/using-middleware.html)
- [Writing Middleware](https://expressjs.com/en/guide/writing-middleware.html)

---

[← Previous: Express.js](./07-express.md) | [Next: Async Patterns →](./09-async-patterns.md)
