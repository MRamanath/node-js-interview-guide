# 07. Express.js

## 📚 Overview

Express is a minimal and flexible Node.js web application framework that provides a robust set of features for web and mobile applications. It's the most popular Node.js framework.

## 🎯 Key Concepts

### Why Express?

```javascript
// Raw HTTP
http.createServer((req, res) => {
  if (req.url === '/users' && req.method === 'GET') {
    // Handle routing manually
  }
});

// Express - Much simpler!
app.get('/users', (req, res) => {
  res.json({ users: [] });
});
```

## 💻 Examples

### Basic Express Server

```javascript
const express = require('express');
const app = express();

// Middleware
app.use(express.json()); // Parse JSON bodies

// Routes
app.get('/', (req, res) => {
  res.send('Hello, World!');
});

app.get('/api/users', (req, res) => {
  res.json({ users: ['Alice', 'Bob'] });
});

app.listen(3000, () => {
  console.log('Server running on port 3000');
});
```

### Request Object

```javascript
app.get('/user/:id', (req, res) => {
  // Route parameters
  console.log(req.params.id); // from /user/123
  
  // Query parameters
  console.log(req.query.sort); // from /user/123?sort=asc
  
  // Headers
  console.log(req.headers['user-agent']);
  console.log(req.get('Content-Type'));
  
  // Body (requires express.json() middleware)
  console.log(req.body);
  
  // Cookies (requires cookie-parser middleware)
  console.log(req.cookies);
  
  // Other useful properties
  console.log(req.method);      // GET, POST, etc.
  console.log(req.originalUrl);  // /user/123?sort=asc
  console.log(req.path);        // /user/123
  console.log(req.protocol);    // http or https
  console.log(req.ip);          // Client IP
  console.log(req.hostname);    // example.com
});
```

### Response Methods

```javascript
app.get('/response-examples', (req, res) => {
  // Send text
  res.send('Hello');
  
  // Send JSON
  res.json({ message: 'Success' });
  
  // Send status code
  res.sendStatus(404); // 404 Not Found
  res.status(201).json({ created: true });
  
  // Send file
  res.sendFile('/path/to/file.pdf');
  
  // Download file
  res.download('/path/to/file.pdf');
  
  // Render template
  res.render('index', { title: 'Home' });
  
  // Redirect
  res.redirect('/new-url');
  res.redirect(301, '/permanently-moved');
  
  // Set headers
  res.set('Content-Type', 'text/html');
  res.set({
    'X-Custom-Header': 'value',
    'Cache-Control': 'no-cache'
  });
  
  // Set cookie
  res.cookie('token', 'abc123', {
    httpOnly: true,
    secure: true,
    maxAge: 3600000 // 1 hour
  });
});
```

### Routing

```javascript
// Basic routes
app.get('/users', (req, res) => {
  res.json({ users: [] });
});

app.post('/users', (req, res) => {
  const user = req.body;
  res.status(201).json(user);
});

app.put('/users/:id', (req, res) => {
  res.json({ updated: true });
});

app.delete('/users/:id', (req, res) => {
  res.json({ deleted: true });
});

// Route parameters
app.get('/users/:id', (req, res) => {
  const userId = req.params.id;
  res.json({ userId });
});

// Multiple parameters
app.get('/users/:userId/posts/:postId', (req, res) => {
  const { userId, postId } = req.params;
  res.json({ userId, postId });
});

// Optional parameters (using regex)
app.get('/users/:id(\\d+)?', (req, res) => {
  // Matches /users and /users/123
});

// Route patterns
app.get('/files/*', (req, res) => {
  // Matches /files/any/nested/path
});

app.get('/ab+cd', (req, res) => {
  // Matches /abcd, /abbcd, /abbbcd, etc.
});

app.get('/ab*cd', (req, res) => {
  // Matches /abcd, /abXcd, /abXYZcd, etc.
});

// Handle all HTTP methods
app.all('/secret', (req, res) => {
  console.log('Accessing secret section...');
});

// Route chaining
app.route('/book')
  .get((req, res) => res.send('Get books'))
  .post((req, res) => res.send('Add book'))
  .put((req, res) => res.send('Update book'));
```

### Express Router

```javascript
// routes/users.js
const express = require('express');
const router = express.Router();

router.get('/', (req, res) => {
  res.json({ users: [] });
});

router.get('/:id', (req, res) => {
  res.json({ user: { id: req.params.id } });
});

router.post('/', (req, res) => {
  res.status(201).json(req.body);
});

module.exports = router;

// app.js
const userRoutes = require('./routes/users');
app.use('/api/users', userRoutes);

// Routes will be:
// GET  /api/users
// GET  /api/users/:id
// POST /api/users
```

### Middleware

```javascript
// Application-level middleware
app.use((req, res, next) => {
  console.log('Time:', Date.now());
  next(); // MUST call next() to continue
});

// Middleware with path
app.use('/api', (req, res, next) => {
  console.log('API request');
  next();
});

// Multiple middleware functions
app.use(
  logger,
  authenticate,
  authorize,
  (req, res, next) => {
    next();
  }
);

// Router-level middleware
const router = express.Router();
router.use((req, res, next) => {
  console.log('Router middleware');
  next();
});

// Route-specific middleware
app.get('/protected', authenticate, (req, res) => {
  res.json({ message: 'Protected route' });
});

// Multiple middleware for a route
app.get('/admin',
  authenticate,
  checkAdmin,
  (req, res) => {
    res.json({ admin: true });
  }
);

// Error-handling middleware (4 parameters!)
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: err.message });
});
```

### Built-in Middleware

```javascript
// Parse JSON bodies
app.use(express.json());

// Parse URL-encoded bodies (form data)
app.use(express.urlencoded({ extended: true }));

// Serve static files
app.use(express.static('public'));
app.use('/static', express.static('public'));

// Multiple static directories
app.use(express.static('public'));
app.use(express.static('files'));
```

### Custom Middleware

```javascript
// Logger middleware
function logger(req, res, next) {
  console.log(`${req.method} ${req.path} - ${new Date().toISOString()}`);
  next();
}

app.use(logger);

// Authentication middleware
function authenticate(req, res, next) {
  const token = req.headers.authorization;
  
  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }
  
  try {
    const user = verifyToken(token);
    req.user = user; // Attach to request
    next();
  } catch (err) {
    res.status(401).json({ error: 'Invalid token' });
  }
}

// Request ID middleware
function requestId(req, res, next) {
  req.id = Math.random().toString(36).substr(2, 9);
  res.setHeader('X-Request-ID', req.id);
  next();
}

// Timing middleware
function timing(req, res, next) {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(`${req.method} ${req.path} - ${duration}ms`);
  });
  
  next();
}
```

### Error Handling

```javascript
// Async error handling
app.get('/users/:id', async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      throw new Error('User not found');
    }
    res.json(user);
  } catch (err) {
    next(err); // Pass to error handler
  }
});

// Async wrapper utility
function asyncHandler(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

app.get('/users/:id', asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  res.json(user);
}));

// Custom error class
class AppError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
  }
}

// Error handling middleware
app.use((err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';
  
  if (process.env.NODE_ENV === 'development') {
    res.status(err.statusCode).json({
      status: err.status,
      error: err,
      message: err.message,
      stack: err.stack
    });
  } else {
    // Production - don't leak error details
    res.status(err.statusCode).json({
      status: err.status,
      message: err.isOperational ? err.message : 'Something went wrong'
    });
  }
});

// 404 handler (put last!)
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});
```

### Request Validation

```javascript
// Manual validation
app.post('/users', (req, res) => {
  const { name, email, age } = req.body;
  
  if (!name || typeof name !== 'string') {
    return res.status(400).json({ error: 'Invalid name' });
  }
  
  if (!email || !email.includes('@')) {
    return res.status(400).json({ error: 'Invalid email' });
  }
  
  if (age && (typeof age !== 'number' || age < 0)) {
    return res.status(400).json({ error: 'Invalid age' });
  }
  
  res.json({ success: true });
});

// Using express-validator
const { body, validationResult } = require('express-validator');

app.post('/users',
  body('name').isString().trim().notEmpty(),
  body('email').isEmail().normalizeEmail(),
  body('age').optional().isInt({ min: 0, max: 150 }),
  (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    
    res.json({ success: true });
  }
);
```

### CORS Configuration

```javascript
const cors = require('cors');

// Enable all CORS requests
app.use(cors());

// Configure CORS
app.use(cors({
  origin: 'https://example.com',
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
  maxAge: 86400 // 24 hours
}));

// Dynamic origin
app.use(cors({
  origin: function(origin, callback) {
    const allowedOrigins = ['https://example.com', 'https://app.example.com'];
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  }
}));
```

## 🎤 Interview Questions

### Q1: What is Express.js?
**Answer:** Minimal and flexible Node.js web framework providing robust features for web/mobile apps. Built on top of http module. Most popular Node.js framework.

### Q2: What is middleware in Express?
**Answer:** Functions that have access to request, response, and next middleware function. Execute in order they're defined. Can:
- Execute code
- Modify req/res objects
- End request-response cycle
- Call next middleware

### Q3: What is the difference between app.use() and app.get()?
**Answer:**
- `app.use()` - Middleware, matches all HTTP methods
- `app.get()` - Route handler, only matches GET requests
- `app.use()` matches paths starting with pattern
- `app.get()` matches exact path

### Q4: What is next() in middleware?
**Answer:** Function that passes control to next middleware. Must call it or end response. Calling `next(err)` passes to error handler.

### Q5: How to handle errors in Express?
**Answer:**
```javascript
// Error middleware has 4 parameters
app.use((err, req, res, next) => {
  res.status(500).json({ error: err.message });
});

// Pass errors to it
app.get('/route', async (req, res, next) => {
  try {
    // code
  } catch (err) {
    next(err);
  }
});
```

### Q6: What is Express Router?
**Answer:** Mini-application for organizing routes. Create modular, mountable route handlers.
```javascript
const router = express.Router();
router.get('/users', handler);
app.use('/api', router); // Mounts at /api/users
```

### Q7: Difference between req.params and req.query?
**Answer:**
- `req.params` - Route parameters from URL path (`/user/:id`)
- `req.query` - Query string parameters (`/search?q=term`)
```javascript
// GET /user/123?sort=asc
req.params.id  // "123"
req.query.sort // "asc"
```

### Q8: How to serve static files in Express?
**Answer:**
```javascript
app.use(express.static('public'));
// Files in public/ served at root
// public/style.css → http://localhost/style.css

app.use('/static', express.static('public'));
// public/style.css → http://localhost/static/style.css
```

### Q9: What is express.json() middleware?
**Answer:** Built-in middleware that parses incoming JSON request bodies. Must use before accessing req.body.
```javascript
app.use(express.json());
app.post('/data', (req, res) => {
  console.log(req.body); // Parsed JSON object
});
```

### Q10: How to implement authentication in Express?
**Answer:**
```javascript
function authenticate(req, res, next) {
  const token = req.headers.authorization;
  if (!token) return res.status(401).json({ error: 'No token' });
  
  try {
    req.user = verifyToken(token);
    next();
  } catch {
    res.status(401).json({ error: 'Invalid token' });
  }
}

app.get('/protected', authenticate, (req, res) => {
  res.json({ user: req.user });
});
```

## 🎯 Best Practices

1. **Use routers for organization**
   ```javascript
   app.use('/api/users', userRouter);
   app.use('/api/posts', postRouter);
   ```

2. **Always handle async errors**
   ```javascript
   const asyncHandler = fn => (req, res, next) =>
     Promise.resolve(fn(req, res, next)).catch(next);
   ```

3. **Use helmet for security**
   ```javascript
   const helmet = require('helmet');
   app.use(helmet());
   ```

4. **Enable compression**
   ```javascript
   const compression = require('compression');
   app.use(compression());
   ```

5. **Set proper status codes**
   ```javascript
   res.status(201).json({ created: true }); // Created
   res.status(204).send(); // No content
   res.status(400).json({ error: 'Bad request' });
   ```

## 📚 Additional Resources

- [Express.js Official Docs](https://expressjs.com/)
- [Express Middleware List](https://expressjs.com/en/resources/middleware.html)

---

[← Previous: HTTP Server](./06-http-server.md) | [Next: Middleware →](./08-middleware.md)
