/**
 * Authentication Middleware - Critical Interview Topic!
 * "Implement JWT authentication from scratch"
 */

const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');

const app = express();
app.use(express.json());

// Configuration
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const JWT_EXPIRES_IN = '1h';
const REFRESH_TOKEN_EXPIRES_IN = '7d';

// In-memory databases (use real DB in production)
const users = [
  {
    id: 1,
    username: 'admin',
    // Password: 'admin123' (pre-hashed)
    password: '$2b$10$rKvvZ1QEQhGGGlGGGlGGGOFv7D9Z9Z9Z9Z9Z9Z9Z9Z9Z9Z9Z9Z9ZZ',
    email: 'admin@example.com',
    role: 'admin'
  }
];
const refreshTokens = new Set();

// 1. Authentication Middleware
function authenticate(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN
  
  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }
  
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    req.user = payload; // Attach user to request
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expired' });
    }
    return res.status(403).json({ error: 'Invalid token' });
  }
}

// 2. Role-based Authorization Middleware
function authorize(...roles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }
    
    if (roles.length && !roles.includes(req.user.role)) {
      return res.status(403).json({ 
        error: 'Insufficient permissions',
        required: roles,
        current: req.user.role
      });
    }
    
    next();
  };
}

// 3. Rate Limiting Middleware
const rateLimitMap = new Map();

function rateLimit(maxRequests = 5, windowMs = 60000) {
  return (req, res, next) => {
    const identifier = req.ip || req.connection.remoteAddress;
    const now = Date.now();
    
    if (!rateLimitMap.has(identifier)) {
      rateLimitMap.set(identifier, []);
    }
    
    const requests = rateLimitMap.get(identifier);
    const recentRequests = requests.filter(time => now - time < windowMs);
    
    if (recentRequests.length >= maxRequests) {
      return res.status(429).json({ 
        error: 'Too many requests',
        retryAfter: Math.ceil((recentRequests[0] + windowMs - now) / 1000)
      });
    }
    
    recentRequests.push(now);
    rateLimitMap.set(identifier, recentRequests);
    next();
  };
}

// 4. Request Logging Middleware
function logger(req, res, next) {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(
      `${new Date().toISOString()} | ` +
      `${req.method} ${req.originalUrl} | ` +
      `Status: ${res.statusCode} | ` +
      `${duration}ms | ` +
      `User: ${req.user?.username || 'anonymous'}`
    );
  });
  
  next();
}

// 5. Error Handler Middleware
function errorHandler(err, req, res, next) {
  console.error('Error:', err);
  
  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    return res.status(403).json({ error: 'Invalid token' });
  }
  
  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({ error: 'Token expired' });
  }
  
  // Validation errors
  if (err.name === 'ValidationError') {
    return res.status(400).json({ error: err.message });
  }
  
  // Default error
  res.status(err.statusCode || 500).json({
    error: err.message || 'Internal server error'
  });
}

// 6. Async Handler Wrapper
function asyncHandler(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

// Apply global middleware
app.use(logger);

// Routes

// Register
app.post('/auth/register', asyncHandler(async (req, res) => {
  const { username, password, email } = req.body;
  
  // Validation
  if (!username || !password || !email) {
    return res.status(400).json({ error: 'All fields required' });
  }
  
  // Check if user exists
  if (users.find(u => u.username === username)) {
    return res.status(409).json({ error: 'Username already exists' });
  }
  
  // Hash password
  const hashedPassword = await bcrypt.hash(password, 10);
  
  const newUser = {
    id: users.length + 1,
    username,
    password: hashedPassword,
    email,
    role: 'user'
  };
  
  users.push(newUser);
  
  res.status(201).json({
    success: true,
    message: 'User registered successfully'
  });
}));

// Login
app.post('/auth/login', rateLimit(5, 60000), asyncHandler(async (req, res) => {
  const { username, password } = req.body;
  
  const user = users.find(u => u.username === username);
  if (!user) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }
  
  const validPassword = await bcrypt.compare(password, user.password);
  if (!validPassword) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }
  
  // Generate tokens
  const accessToken = jwt.sign(
    { id: user.id, username: user.username, role: user.role },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );
  
  const refreshToken = jwt.sign(
    { id: user.id },
    JWT_SECRET,
    { expiresIn: REFRESH_TOKEN_EXPIRES_IN }
  );
  
  refreshTokens.add(refreshToken);
  
  res.json({
    success: true,
    accessToken,
    refreshToken,
    user: {
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role
    }
  });
}));

// Refresh token
app.post('/auth/refresh', asyncHandler(async (req, res) => {
  const { refreshToken } = req.body;
  
  if (!refreshToken) {
    return res.status(401).json({ error: 'Refresh token required' });
  }
  
  if (!refreshTokens.has(refreshToken)) {
    return res.status(403).json({ error: 'Invalid refresh token' });
  }
  
  const payload = jwt.verify(refreshToken, JWT_SECRET);
  const user = users.find(u => u.id === payload.id);
  
  if (!user) {
    return res.status(403).json({ error: 'User not found' });
  }
  
  const newAccessToken = jwt.sign(
    { id: user.id, username: user.username, role: user.role },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );
  
  res.json({ success: true, accessToken: newAccessToken });
}));

// Logout
app.post('/auth/logout', authenticate, (req, res) => {
  const { refreshToken } = req.body;
  if (refreshToken) {
    refreshTokens.delete(refreshToken);
  }
  res.json({ success: true, message: 'Logged out successfully' });
});

// Protected route (any authenticated user)
app.get('/protected', authenticate, (req, res) => {
  res.json({
    success: true,
    message: 'This is protected data',
    user: req.user
  });
});

// Admin-only route
app.get('/admin', authenticate, authorize('admin'), (req, res) => {
  res.json({
    success: true,
    message: 'Admin area',
    users: users.map(u => ({ id: u.id, username: u.username, email: u.email, role: u.role }))
  });
});

// Multiple roles
app.get('/moderator', authenticate, authorize('admin', 'moderator'), (req, res) => {
  res.json({
    success: true,
    message: 'Moderator area'
  });
});

// Error handler
app.use(errorHandler);

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Auth server running on http://localhost:${PORT}`);
  console.log('\nTest credentials:');
  console.log('Username: admin');
  console.log('Password: admin123');
  console.log('\nEndpoints:');
  console.log('POST /auth/register - Register new user');
  console.log('POST /auth/login    - Login');
  console.log('POST /auth/refresh  - Refresh token');
  console.log('POST /auth/logout   - Logout');
  console.log('GET  /protected     - Protected route');
  console.log('GET  /admin         - Admin only');
});

/* INTERVIEW CONCEPTS:
1. JWT authentication (stateless)
2. Refresh tokens for security
3. Role-based authorization
4. Rate limiting
5. Password hashing with bcrypt
6. Middleware patterns
7. Error handling
8. Async/await with try/catch
*/
