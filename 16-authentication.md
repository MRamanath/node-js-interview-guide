# 16. Authentication

## 📚 Overview

Authentication verifies user identity. This guide covers JWT, sessions, OAuth, bcrypt password hashing, and authentication best practices in Node.js.

## 🎯 Key Concepts

### Authentication Strategies

```
Session-based: Server stores session, cookie references it
Token-based (JWT): Stateless, client stores token
OAuth: Third-party authentication (Google, GitHub)
```

## 💻 Examples

### Password Hashing with bcrypt

```javascript
const bcrypt = require('bcrypt');

// Hash password (async)
async function hashPassword(password) {
  const saltRounds = 10;
  const hash = await bcrypt.hash(password, saltRounds);
  return hash;
}

// Verify password
async function verifyPassword(password, hash) {
  const match = await bcrypt.compare(password, hash);
  return match; // true or false
}

// Usage
const password = 'MySecurePassword123!';
const hash = await hashPassword(password);
console.log('Hash:', hash); // $2b$10$...

const isValid = await verifyPassword(password, hash);
console.log('Valid:', isValid); // true

const isInvalid = await verifyPassword('wrongpassword', hash);
console.log('Invalid:', isInvalid); // false
```

### JWT Authentication

```javascript
const jwt = require('jsonwebtoken');

const SECRET_KEY = process.env.JWT_SECRET || 'your-secret-key';

// Generate token
function generateToken(user) {
  const payload = {
    id: user.id,
    email: user.email,
    role: user.role
  };
  
  const token = jwt.sign(payload, SECRET_KEY, {
    expiresIn: '24h',
    issuer: 'myapp',
    audience: 'myapp-users'
  });
  
  return token;
}

// Verify token
function verifyToken(token) {
  try {
    const decoded = jwt.verify(token, SECRET_KEY, {
      issuer: 'myapp',
      audience: 'myapp-users'
    });
    return decoded;
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      throw new Error('Token expired');
    }
    if (err.name === 'JsonWebTokenError') {
      throw new Error('Invalid token');
    }
    throw err;
  }
}

// Refresh token pattern
function generateRefreshToken(user) {
  return jwt.sign({ id: user.id }, SECRET_KEY, {
    expiresIn: '7d'
  });
}
```

### Complete Auth System

```javascript
const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('./models/User');

const app = express();
app.use(express.json());

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET;

// Register
app.post('/auth/register', async (req, res) => {
  try {
    const { email, password, name } = req.body;
    
    // Validate input
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password required' });
    }
    
    // Check if user exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({ error: 'User already exists' });
    }
    
    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Create user
    const user = await User.create({
      email,
      password: hashedPassword,
      name
    });
    
    // Generate tokens
    const accessToken = jwt.sign(
      { id: user._id, email: user.email },
      JWT_SECRET,
      { expiresIn: '15m' }
    );
    
    const refreshToken = jwt.sign(
      { id: user._id },
      JWT_REFRESH_SECRET,
      { expiresIn: '7d' }
    );
    
    // Store refresh token (in DB or Redis)
    user.refreshToken = refreshToken;
    await user.save();
    
    res.status(201).json({
      user: {
        id: user._id,
        email: user.email,
        name: user.name
      },
      accessToken,
      refreshToken
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Login
app.post('/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    // Verify password
    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    // Generate tokens
    const accessToken = jwt.sign(
      { id: user._id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: '15m' }
    );
    
    const refreshToken = jwt.sign(
      { id: user._id },
      JWT_REFRESH_SECRET,
      { expiresIn: '7d' }
    );
    
    // Update refresh token
    user.refreshToken = refreshToken;
    user.lastLogin = new Date();
    await user.save();
    
    res.json({
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        role: user.role
      },
      accessToken,
      refreshToken
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Refresh token
app.post('/auth/refresh', async (req, res) => {
  try {
    const { refreshToken } = req.body;
    
    if (!refreshToken) {
      return res.status(401).json({ error: 'Refresh token required' });
    }
    
    // Verify refresh token
    const decoded = jwt.verify(refreshToken, JWT_REFRESH_SECRET);
    
    // Find user
    const user = await User.findById(decoded.id);
    if (!user || user.refreshToken !== refreshToken) {
      return res.status(401).json({ error: 'Invalid refresh token' });
    }
    
    // Generate new access token
    const accessToken = jwt.sign(
      { id: user._id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: '15m' }
    );
    
    res.json({ accessToken });
  } catch (err) {
    res.status(401).json({ error: 'Invalid refresh token' });
  }
});

// Logout
app.post('/auth/logout', async (req, res) => {
  try {
    const { refreshToken } = req.body;
    
    // Remove refresh token from user
    await User.updateOne(
      { refreshToken },
      { $unset: { refreshToken: 1 } }
    );
    
    res.json({ message: 'Logged out successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
```

### Authentication Middleware

```javascript
const jwt = require('jsonwebtoken');

// Authenticate middleware
function authenticate(req, res, next) {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN
  
  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expired' });
    }
    return res.status(403).json({ error: 'Invalid token' });
  }
}

// Optional authentication
function optionalAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1];
  
  if (token) {
    try {
      req.user = jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
      // Invalid token, but continue without user
    }
  }
  
  next();
}

// Authorize by role
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
app.get('/profile', authenticate, (req, res) => {
  res.json({ user: req.user });
});

app.delete('/users/:id', 
  authenticate,
  authorize('admin'),
  (req, res) => {
    // Only admins can access
  }
);
```

### Session-Based Authentication

```javascript
const express = require('express');
const session = require('express-session');
const RedisStore = require('connect-redis').default;
const Redis = require('ioredis');

const app = express();
const redis = new Redis();

app.use(session({
  store: new RedisStore({ client: redis }),
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production', // HTTPS only in production
    httpOnly: true,
    maxAge: 1000 * 60 * 60 * 24 // 24 hours
  }
}));

// Login
app.post('/login', async (req, res) => {
  const { email, password } = req.body;
  
  const user = await User.findOne({ email });
  if (!user || !await bcrypt.compare(password, user.password)) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }
  
  // Store user in session
  req.session.userId = user._id;
  req.session.user = {
    id: user._id,
    email: user.email,
    role: user.role
  };
  
  res.json({ message: 'Logged in' });
});

// Session auth middleware
function requireAuth(req, res, next) {
  if (!req.session.userId) {
    return res.status(401).json({ error: 'Not authenticated' });
  }
  next();
}

// Protected route
app.get('/profile', requireAuth, (req, res) => {
  res.json({ user: req.session.user });
});

// Logout
app.post('/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({ error: 'Logout failed' });
    }
    res.clearCookie('connect.sid');
    res.json({ message: 'Logged out' });
  });
});
```

### OAuth 2.0 (Google)

```javascript
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;

passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: 'http://localhost:3000/auth/google/callback'
  },
  async (accessToken, refreshToken, profile, done) => {
    try {
      // Find or create user
      let user = await User.findOne({ googleId: profile.id });
      
      if (!user) {
        user = await User.create({
          googleId: profile.id,
          email: profile.emails[0].value,
          name: profile.displayName,
          avatar: profile.photos[0].value
        });
      }
      
      done(null, user);
    } catch (err) {
      done(err, null);
    }
  }
));

// Routes
app.get('/auth/google',
  passport.authenticate('google', { scope: ['profile', 'email'] })
);

app.get('/auth/google/callback',
  passport.authenticate('google', { failureRedirect: '/login' }),
  (req, res) => {
    // Generate JWT
    const token = generateToken(req.user);
    res.redirect(`/dashboard?token=${token}`);
  }
);
```

### Password Reset

```javascript
const crypto = require('crypto');

// Request password reset
app.post('/auth/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });
    
    if (!user) {
      // Don't reveal if email exists
      return res.json({ message: 'If email exists, reset link sent' });
    }
    
    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const hashedToken = crypto
      .createHash('sha256')
      .update(resetToken)
      .digest('hex');
    
    user.resetPasswordToken = hashedToken;
    user.resetPasswordExpires = Date.now() + 3600000; // 1 hour
    await user.save();
    
    // Send email with resetToken
    const resetUrl = `${req.protocol}://${req.get('host')}/reset-password/${resetToken}`;
    await sendEmail(user.email, 'Password Reset', resetUrl);
    
    res.json({ message: 'If email exists, reset link sent' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Reset password
app.post('/auth/reset-password/:token', async (req, res) => {
  try {
    const { password } = req.body;
    
    const hashedToken = crypto
      .createHash('sha256')
      .update(req.params.token)
      .digest('hex');
    
    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpires: { $gt: Date.now() }
    });
    
    if (!user) {
      return res.status(400).json({ error: 'Invalid or expired token' });
    }
    
    // Update password
    user.password = await bcrypt.hash(password, 10);
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();
    
    res.json({ message: 'Password reset successful' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
```

### Two-Factor Authentication (2FA)

```javascript
const speakeasy = require('speakeasy');
const QRCode = require('qrcode');

// Generate 2FA secret
app.post('/auth/2fa/setup', authenticate, async (req, res) => {
  const secret = speakeasy.generateSecret({
    name: `MyApp (${req.user.email})`
  });
  
  // Store secret (encrypted) in database
  await User.updateOne(
    { _id: req.user.id },
    { twoFactorSecret: secret.base32 }
  );
  
  // Generate QR code
  const qrCode = await QRCode.toDataURL(secret.otpauth_url);
  
  res.json({
    secret: secret.base32,
    qrCode
  });
});

// Verify 2FA token
app.post('/auth/2fa/verify', authenticate, async (req, res) => {
  const { token } = req.body;
  const user = await User.findById(req.user.id);
  
  const verified = speakeasy.totp.verify({
    secret: user.twoFactorSecret,
    encoding: 'base32',
    token,
    window: 2 // Allow 2 time steps
  });
  
  if (verified) {
    user.twoFactorEnabled = true;
    await user.save();
    res.json({ message: '2FA enabled' });
  } else {
    res.status(400).json({ error: 'Invalid token' });
  }
});

// Login with 2FA
app.post('/auth/login/2fa', async (req, res) => {
  const { email, password, token } = req.body;
  
  const user = await User.findOne({ email });
  if (!user || !await bcrypt.compare(password, user.password)) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }
  
  if (user.twoFactorEnabled) {
    const verified = speakeasy.totp.verify({
      secret: user.twoFactorSecret,
      encoding: 'base32',
      token,
      window: 2
    });
    
    if (!verified) {
      return res.status(401).json({ error: 'Invalid 2FA token' });
    }
  }
  
  const accessToken = generateToken(user);
  res.json({ accessToken });
});
```

## 🎤 Interview Questions

### Q1: What is authentication vs authorization?
**Answer:**
- **Authentication** verifies identity (who you are).
- **Authorization** verifies permissions (what you can do).

**Example:**
```javascript
// Authentication: verifies identity
app.get('/me', authenticate, (req, res) => {
  res.json({ user: req.user });
});

// Authorization: verifies permissions
app.delete('/users/:id', authenticate, authorize('admin'), (req, res) => {
  res.json({ message: 'Deleted' });
});
```

**Follow-up clarification (with example):**
How do you implement authorization in Express?
```javascript
function authorize(...roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Not authorized' });
    }
    next();
  };
}
```

### Q2: JWT vs session-based auth?
**Answer:**
- **JWT**: Stateless, token stored on client, scales well across services.
- **Session**: Stateful, server stores session, easier revocation.

**Example:**
```javascript
// JWT auth header
fetch('/api/profile', { headers: { Authorization: `Bearer ${token}` } });

// Session cookie (server uses express-session)
fetch('/api/profile', { credentials: 'include' });
```

**Follow-up clarification (with example):**
When would you choose sessions?
```text
If you need immediate server-side revocation or centralized session control
```

### Q3: How does bcrypt work and why not SHA-256?
**Answer:** bcrypt is a slow, adaptive hash with salt, resisting brute force. SHA-256 is fast and not suitable for passwords.

**Example:**
```javascript
const hash = await bcrypt.hash(password, 12);
const ok = await bcrypt.compare(password, hash);
```

**Follow-up clarification (with example):**
How do you pick the cost factor?
```text
Use the highest cost that keeps login under ~200ms (commonly 10–12).
```

### Q4: What is a refresh token and rotation?
**Answer:** A refresh token is long-lived and exchanges for short-lived access tokens. Rotation replaces the refresh token on each use to limit replay.

**Example:**
```javascript
// Refresh flow
app.post('/auth/refresh', async (req, res) => {
  const { refreshToken } = req.body;
  const payload = jwt.verify(refreshToken, JWT_REFRESH_SECRET);
  const accessToken = jwt.sign({ id: payload.id }, JWT_SECRET, { expiresIn: '15m' });
  res.json({ accessToken });
});
```

**Follow-up clarification (with example):**
How do you revoke refresh tokens?
```text
Store refresh tokens (or their hashes) in DB/Redis and delete on logout.
```

### Q5: How do you secure JWTs?
**Answer:**
- Short expiry, strong secret or RSA keys
- Validate `iss`, `aud`, `exp`
- Use HTTPS and secure storage

**Example:**
```javascript
const token = jwt.sign(payload, JWT_SECRET, {
  expiresIn: '15m',
  issuer: 'myapp',
  audience: 'myapp-users'
});
```

**Follow-up clarification (with example):**
Where should tokens be stored?
```text
Use httpOnly cookies for browser apps; avoid localStorage for sensitive apps.
```

### Q6: OAuth 2.0 vs OpenID Connect (OIDC)?
**Answer:** OAuth is for authorization (access). OIDC adds identity (`id_token`) for authentication.

**Example:**
```text
OAuth: access_token -> API access
OIDC: id_token + access_token -> login + API access
```

**Follow-up clarification (with example):**
When use Authorization Code + PKCE?
```text
Use it for SPAs and mobile apps to prevent code interception.
```

### Q7: How to implement logout with JWT?
**Answer:** Client removes token; server can blacklist or rotate refresh tokens.

**Example:**
```javascript
await redis.set(`bl:${jti}`, '1', 'EX', 15 * 60); // blacklist access token
```

**Follow-up clarification (with example):**
How do you log out everywhere?
```text
Use a tokenVersion in the user record and reject tokens with old version.
```

### Q8: How do you prevent brute-force logins?
**Answer:** Rate limit, IP throttling, account lockouts, and monitoring.

**Example:**
```javascript
const limiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 5 });
app.post('/login', limiter, loginHandler);
```

**Follow-up clarification (with example):**
How to avoid account enumeration?
```text
Return a generic error like "Invalid credentials" for all failures.
```

### Q9: What is CSRF and how do you prevent it?
**Answer:** CSRF tricks a logged-in user into performing actions. Use CSRF tokens and SameSite cookies.

**Example:**
```javascript
app.use(csurf());
app.get('/form', (req, res) => res.json({ csrfToken: req.csrfToken() }));
```

**Follow-up clarification (with example):**
Is SameSite=Lax enough?
```text
It helps for top-level navigation but use tokens for full protection.
```

### Q10: What is XSS and how do you prevent it?
**Answer:** XSS injects malicious scripts. Prevent with escaping, sanitization, and CSP.

**Example:**
```javascript
const safe = escapeHtml(userInput);
res.send(`<div>${safe}</div>`);
```

**Follow-up clarification (with example):**
Why use CSP if you already escape?
```text
CSP reduces impact if a bug slips through by blocking inline scripts.
```

## 🎯 Best Practices

1. **Use bcrypt for passwords**
   ```javascript
   const hash = await bcrypt.hash(password, 10);
   ```

2. **Short access token expiration**
   ```javascript
   jwt.sign(payload, secret, { expiresIn: '15m' });
   ```

3. **HTTPS only**
   ```javascript
   cookie: { secure: true, httpOnly: true }
   ```

4. **Rate limit auth endpoints**
   ```javascript
   const limiter = rateLimit({ max: 5, windowMs: 15 * 60 * 1000 });
   app.post('/login', limiter, loginHandler);
   ```

5. **Validate input**
   ```javascript
   const schema = Joi.object({
     email: Joi.string().email().required(),
     password: Joi.string().min(8).required()
   });
   ```

## 📚 Additional Resources

- [JWT.io](https://jwt.io/)
- [Passport.js](http://www.passportjs.org/)
- [OWASP Authentication Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html)

---

[← Previous: Database](./15-database.md) | [Next: Validation →](./17-validation.md)
