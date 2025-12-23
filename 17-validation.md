# 17. Validation

## 📚 Overview

Input validation is critical for security and data integrity. This guide covers validation libraries (Joi, express-validator), custom validators, and sanitization techniques.

## 🎯 Key Concepts

### Why Validation?

```
User Input → Validate → Sanitize → Process
   ↓            ↓          ↓          ↓
Untrusted    Check type  Clean data  Safe to use
```

## 💻 Examples

### Joi Validation

```javascript
const Joi = require('joi');

// Define schema
const userSchema = Joi.object({
  name: Joi.string().min(2).max(50).required(),
  email: Joi.string().email().required(),
  age: Joi.number().integer().min(0).max(150),
  password: Joi.string().min(8).pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/),
  role: Joi.string().valid('user', 'admin').default('user'),
  address: Joi.object({
    street: Joi.string(),
    city: Joi.string(),
    zip: Joi.string().pattern(/^\d{5}$/)
  }),
  tags: Joi.array().items(Joi.string()).min(1).max(5),
  website: Joi.string().uri()
});

// Validate
function validateUser(data) {
  const { error, value } = userSchema.validate(data, {
    abortEarly: false, // Return all errors
    stripUnknown: true // Remove unknown fields
  });
  
  if (error) {
    const errors = error.details.map(d => ({
      field: d.path.join('.'),
      message: d.message
    }));
    throw { status: 400, errors };
  }
  
  return value;
}

// Usage
try {
  const validated = validateUser({
    name: 'John Doe',
    email: 'john@example.com',
    age: 30,
    password: 'Password123'
  });
  console.log('Valid:', validated);
} catch (err) {
  console.error('Validation errors:', err.errors);
}

// Async validation
const asyncSchema = Joi.object({
  username: Joi.string()
    .min(3)
    .max(30)
    .external(async (value) => {
      const exists = await User.findOne({ username: value });
      if (exists) {
        throw new Error('Username already taken');
      }
    })
});

await asyncSchema.validateAsync({ username: 'john' });
```

### Express-Validator

```javascript
const { body, validationResult } = require('express-validator');

// Validation middleware
const validateUser = [
  body('name')
    .trim()
    .notEmpty().withMessage('Name is required')
    .isLength({ min: 2, max: 50 }).withMessage('Name must be 2-50 characters'),
  
  body('email')
    .trim()
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Invalid email format')
    .normalizeEmail(),
  
  body('age')
    .optional()
    .isInt({ min: 0, max: 150 }).withMessage('Age must be 0-150'),
  
  body('password')
    .isLength({ min: 8 }).withMessage('Password must be at least 8 characters')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must contain uppercase, lowercase, and number'),
  
  body('website')
    .optional()
    .isURL().withMessage('Invalid URL')
];

// Route with validation
app.post('/users', validateUser, (req, res) => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  
  // Process valid data
  res.json({ message: 'User created', data: req.body });
});

// Custom validator
body('username').custom(async (value) => {
  const user = await User.findOne({ username: value });
  if (user) {
    throw new Error('Username already exists');
  }
  return true;
});

// Conditional validation
body('companyName').if(body('isCompany').equals('true')).notEmpty(),

// Array validation
body('tags').isArray({ min: 1, max: 5 }),
body('tags.*').isString().trim().notEmpty(),

// Nested object validation
body('address.street').notEmpty(),
body('address.city').notEmpty(),
body('address.zip').matches(/^\d{5}$/),
```

### Custom Validation Middleware

```javascript
function validate(schema) {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true
    });
    
    if (error) {
      const errors = error.details.map(d => ({
        field: d.path.join('.'),
        message: d.message.replace(/['"]/g, '')
      }));
      
      return res.status(400).json({
        error: 'Validation failed',
        details: errors
      });
    }
    
    req.body = value; // Use sanitized values
    next();
  };
}

// Usage
app.post('/users', validate(userSchema), createUser);
```

### Sanitization

```javascript
const validator = require('validator');

function sanitizeUser(data) {
  return {
    name: validator.escape(validator.trim(data.name)),
    email: validator.normalizeEmail(data.email),
    age: parseInt(data.age) || 0,
    bio: validator.stripLow(data.bio), // Remove control characters
    website: validator.trim(data.website)
  };
}

// XSS prevention
const xss = require('xss');

function sanitizeHTML(html) {
  return xss(html, {
    whiteList: {
      p: [],
      br: [],
      strong: [],
      em: []
    }
  });
}
```

### Query Parameter Validation

```javascript
const { query } = require('express-validator');

const validateListQuery = [
  query('page')
    .optional()
    .isInt({ min: 1 }).withMessage('Page must be positive integer')
    .toInt(),
  
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 }).withMessage('Limit must be 1-100')
    .toInt(),
  
  query('sort')
    .optional()
    .isIn(['name', 'createdAt', 'updatedAt'])
    .withMessage('Invalid sort field'),
  
  query('order')
    .optional()
    .isIn(['asc', 'desc'])
    .withMessage('Order must be asc or desc')
];

app.get('/users', validateListQuery, (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  
  const { page = 1, limit = 10, sort = 'createdAt', order = 'desc' } = req.query;
  // Use validated params
});
```

### File Upload Validation

```javascript
const multer = require('multer');
const path = require('path');

// File filter
const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|gif/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);
  
  if (extname && mimetype) {
    cb(null, true);
  } else {
    cb(new Error('Only images allowed (jpeg, jpg, png, gif)'));
  }
};

const upload = multer({
  storage: multer.diskStorage({
    destination: 'uploads/',
    filename: (req, file, cb) => {
      cb(null, `${Date.now()}-${file.originalname}`);
    }
  }),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
    files: 1
  },
  fileFilter
});

app.post('/upload', upload.single('image'), (req, res, next) => {
  // Validate after upload
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }
  
  res.json({ file: req.file });
}, (err, req, res, next) => {
  // Multer error handler
  if (err instanceof multer.MulterError) {
    return res.status(400).json({ error: err.message });
  }
  res.status(400).json({ error: err.message });
});
```

### Complex Validation

```javascript
const userUpdateSchema = Joi.object({
  name: Joi.string().min(2).max(50),
  email: Joi.string().email(),
  password: Joi.string().min(8),
  confirmPassword: Joi.string()
    .valid(Joi.ref('password'))
    .when('password', {
      is: Joi.exist(),
      then: Joi.required(),
      otherwise: Joi.forbidden()
    })
    .messages({
      'any.only': 'Passwords must match'
    }),
  age: Joi.number().integer().min(18).max(150),
  phone: Joi.string().pattern(/^\+?[1-9]\d{1,14}$/),
  
  // At least one field must be present
  }).or('name', 'email', 'password', 'age', 'phone');

// Date validation
const dateSchema = Joi.object({
  startDate: Joi.date().iso().required(),
  endDate: Joi.date().iso().greater(Joi.ref('startDate')).required()
});

// Conditional validation
const productSchema = Joi.object({
  type: Joi.string().valid('physical', 'digital').required(),
  weight: Joi.when('type', {
    is: 'physical',
    then: Joi.number().required(),
    otherwise: Joi.forbidden()
  }),
  downloadUrl: Joi.when('type', {
    is: 'digital',
    then: Joi.string().uri().required(),
    otherwise: Joi.forbidden()
  })
});
```

### Error Handling

```javascript
// Centralized validation error handler
function validationErrorHandler(err, req, res, next) {
  if (err.isJoi) {
    return res.status(400).json({
      error: 'Validation failed',
      details: err.details.map(d => ({
        field: d.path.join('.'),
        message: d.message
      }))
    });
  }
  
  next(err);
}

app.use(validationErrorHandler);

// Custom error class
class ValidationError extends Error {
  constructor(errors) {
    super('Validation failed');
    this.name = 'ValidationError';
    this.statusCode = 400;
    this.errors = errors;
  }
}

// Usage
if (!isValid) {
  throw new ValidationError([
    { field: 'email', message: 'Invalid email' }
  ]);
}
```

## 🎤 Interview Questions

### Q1: Why is input validation important?
**Answer:** Prevents SQL injection, XSS, data corruption. Ensures data integrity. First line of defense against attacks.

### Q2: Client-side vs server-side validation?
**Answer:**
- **Client**: UX, immediate feedback, can be bypassed
- **Server**: Security, mandatory, trusted
- Use both!

### Q3: What is sanitization?
**Answer:** Cleaning/transforming input to safe format. Removes malicious content, normalizes data.

### Q4: Joi vs express-validator?
**Answer:**
- **Joi**: Schema-based, reusable, framework-agnostic
- **express-validator**: Express middleware, integrated, easier for simple cases

### Q5: How to validate nested objects?
**Answer:**
```javascript
// Joi
Joi.object({
  address: Joi.object({
    street: Joi.string()
  })
});

// express-validator
body('address.street').notEmpty()
```

### Q6: What is whitelist validation?
**Answer:** Only allowing explicitly defined fields. Prevents mass assignment vulnerabilities.
```javascript
{ stripUnknown: true } // Joi
```

### Q7: How to validate arrays?
**Answer:**
```javascript
Joi.array().items(Joi.string()).min(1).max(10)
body('tags').isArray()
body('tags.*').isString()
```

### Q8: What is the difference between escaping and sanitizing?
**Answer:**
- **Escape**: Convert special characters (`<` → `&lt;`)
- **Sanitize**: Remove/clean dangerous content

### Q9: How to prevent SQL injection?
**Answer:** Use parameterized queries, ORMs, input validation. Never concatenate user input into SQL.

### Q10: How to validate file uploads?
**Answer:** Check file type, size, extension, MIME type. Rename files. Store outside web root.

## 🎯 Best Practices

1. **Always validate on server**
   ```javascript
   // Never trust client validation
   ```

2. **Use schema validation**
   ```javascript
   const schema = Joi.object({ ... });
   ```

3. **Sanitize after validation**
   ```javascript
   const clean = validator.escape(value);
   ```

4. **Whitelist, don't blacklist**
   ```javascript
   { stripUnknown: true }
   ```

5. **Provide clear error messages**
   ```javascript
   .withMessage('Email must be valid')
   ```

## 📚 Additional Resources

- [Joi Documentation](https://joi.dev/)
- [express-validator](https://express-validator.github.io/)
- [OWASP Input Validation](https://cheatsheetseries.owasp.org/cheatsheets/Input_Validation_Cheat_Sheet.html)

---

[← Previous: Authentication](./16-authentication.md) | [Next: Error Handling →](./18-error-handling.md)
