# 19. Testing

## 📚 Overview

Testing ensures code quality, catches bugs early, and enables confident refactoring. This guide covers unit tests, integration tests, E2E tests, and testing tools.

## 🎯 Key Concepts

### Test Types

```
Unit Tests: Individual functions/modules
Integration Tests: Multiple components together
E2E Tests: Full application flow
```

## 💻 Examples

### Jest - Unit Testing

```javascript
// math.js
function add(a, b) {
  return a + b;
}

function divide(a, b) {
  if (b === 0) throw new Error('Division by zero');
  return a / b;
}

module.exports = { add, divide };

// math.test.js
const { add, divide } = require('./math');

describe('Math functions', () => {
  describe('add', () => {
    test('adds two positive numbers', () => {
      expect(add(2, 3)).toBe(5);
    });
    
    test('adds negative numbers', () => {
      expect(add(-1, -1)).toBe(-2);
    });
    
    test('handles zero', () => {
      expect(add(0, 5)).toBe(5);
    });
  });
  
  describe('divide', () => {
    test('divides two numbers', () => {
      expect(divide(10, 2)).toBe(5);
    });
    
    test('throws error on division by zero', () => {
      expect(() => divide(10, 0)).toThrow('Division by zero');
    });
  });
});
```

### Testing Express Routes

```javascript
// app.js
const express = require('express');
const app = express();
app.use(express.json());

app.get('/users/:id', async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) return res.status(404).json({ error: 'User not found' });
  res.json(user);
});

app.post('/users', async (req, res) => {
  const user = await User.create(req.body);
  res.status(201).json(user);
});

module.exports = app;

// app.test.js
const request = require('supertest');
const app = require('./app');

describe('User API', () => {
  describe('GET /users/:id', () => {
    test('returns user when found', async () => {
      const response = await request(app)
        .get('/users/123')
        .expect(200);
      
      expect(response.body).toHaveProperty('id');
      expect(response.body).toHaveProperty('email');
    });
    
    test('returns 404 when user not found', async () => {
      const response = await request(app)
        .get('/users/999')
        .expect(404);
      
      expect(response.body).toHaveProperty('error');
    });
  });
  
  describe('POST /users', () => {
    test('creates new user', async () => {
      const userData = {
        name: 'John Doe',
        email: 'john@example.com'
      };
      
      const response = await request(app)
        .post('/users')
        .send(userData)
        .expect(201);
      
      expect(response.body).toMatchObject(userData);
      expect(response.body).toHaveProperty('id');
    });
  });
});
```

### Mocking

```javascript
// userService.js
const User = require('./models/User');
const emailService = require('./emailService');

async function createUser(userData) {
  const user = await User.create(userData);
  await emailService.sendWelcomeEmail(user.email);
  return user;
}

module.exports = { createUser };

// userService.test.js
const { createUser } = require('./userService');
const User = require('./models/User');
const emailService = require('./emailService');

jest.mock('./models/User');
jest.mock('./emailService');

describe('createUser', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });
  
  test('creates user and sends email', async () => {
    const userData = { name: 'John', email: 'john@example.com' };
    const mockUser = { id: 1, ...userData };
    
    User.create.mockResolvedValue(mockUser);
    emailService.sendWelcomeEmail.mockResolvedValue(true);
    
    const result = await createUser(userData);
    
    expect(User.create).toHaveBeenCalledWith(userData);
    expect(emailService.sendWelcomeEmail).toHaveBeenCalledWith(userData.email);
    expect(result).toEqual(mockUser);
  });
  
  test('handles email sending failure', async () => {
    User.create.mockResolvedValue({ id: 1 });
    emailService.sendWelcomeEmail.mockRejectedValue(new Error('Email failed'));
    
    await expect(createUser({})).rejects.toThrow('Email failed');
  });
});
```

### Testing Async Code

```javascript
// Async/await
test('fetches user data', async () => {
  const data = await fetchUser(123);
  expect(data).toHaveProperty('name');
});

// Promises
test('fetches user data', () => {
  return fetchUser(123).then(data => {
    expect(data).toHaveProperty('name');
  });
});

// Expect assertion count
test('callback test', done => {
  expect.assertions(1);
  
  fetchUser(123, (err, data) => {
    expect(data).toHaveProperty('name');
    done();
  });
});
```

### Setup and Teardown

```javascript
describe('Database tests', () => {
  beforeAll(async () => {
    // Run once before all tests
    await mongoose.connect(process.env.TEST_DB_URL);
  });
  
  afterAll(async () => {
    // Run once after all tests
    await mongoose.connection.close();
  });
  
  beforeEach(async () => {
    // Run before each test
    await User.deleteMany({});
  });
  
  afterEach(() => {
    // Run after each test
    jest.clearAllMocks();
  });
  
  test('creates user', async () => {
    const user = await User.create({ name: 'John' });
    expect(user).toBeDefined();
  });
});
```

### Integration Testing

```javascript
// integration.test.js
const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../app');
const User = require('../models/User');

describe('User Integration Tests', () => {
  beforeAll(async () => {
    await mongoose.connect(process.env.TEST_DB_URL);
  });
  
  afterAll(async () => {
    await mongoose.connection.close();
  });
  
  beforeEach(async () => {
    await User.deleteMany({});
  });
  
  describe('User CRUD operations', () => {
    test('complete user lifecycle', async () => {
      // Create
      const createResponse = await request(app)
        .post('/api/users')
        .send({ name: 'John', email: 'john@example.com' })
        .expect(201);
      
      const userId = createResponse.body.id;
      
      // Read
      const getResponse = await request(app)
        .get(`/api/users/${userId}`)
        .expect(200);
      
      expect(getResponse.body.name).toBe('John');
      
      // Update
      await request(app)
        .put(`/api/users/${userId}`)
        .send({ name: 'John Updated' })
        .expect(200);
      
      // Verify update
      const updatedUser = await User.findById(userId);
      expect(updatedUser.name).toBe('John Updated');
      
      // Delete
      await request(app)
        .delete(`/api/users/${userId}`)
        .expect(204);
      
      // Verify deletion
      const deletedUser = await User.findById(userId);
      expect(deletedUser).toBeNull();
    });
  });
});
```

### Mocha + Chai

```javascript
const chai = require('chai');
const expect = chai.expect;
const { add, divide } = require('./math');

describe('Math functions', () => {
  describe('add()', () => {
    it('should add two numbers', () => {
      expect(add(2, 3)).to.equal(5);
    });
    
    it('should handle negative numbers', () => {
      expect(add(-1, -1)).to.equal(-2);
    });
  });
  
  describe('divide()', () => {
    it('should divide two numbers', () => {
      expect(divide(10, 2)).to.equal(5);
    });
    
    it('should throw on division by zero', () => {
      expect(() => divide(10, 0)).to.throw('Division by zero');
    });
  });
});
```

### Test Coverage

```javascript
// package.json
{
  "scripts": {
    "test": "jest",
    "test:coverage": "jest --coverage",
    "test:watch": "jest --watch"
  },
  "jest": {
    "coverageThreshold": {
      "global": {
        "branches": 80,
        "functions": 80,
        "lines": 80,
        "statements": 80
      }
    },
    "collectCoverageFrom": [
      "src/**/*.js",
      "!src/**/*.test.js",
      "!src/config/**"
    ]
  }
}
```

### E2E Testing with Cypress

```javascript
// cypress/integration/users.spec.js
describe('User Management', () => {
  beforeEach(() => {
    cy.visit('/');
    cy.login('admin@example.com', 'password');
  });
  
  it('creates a new user', () => {
    cy.get('[data-testid="create-user-btn"]').click();
    cy.get('[data-testid="name-input"]').type('John Doe');
    cy.get('[data-testid="email-input"]').type('john@example.com');
    cy.get('[data-testid="submit-btn"]').click();
    
    cy.contains('User created successfully').should('be.visible');
    cy.contains('John Doe').should('be.visible');
  });
  
  it('edits a user', () => {
    cy.get('[data-testid="user-1"]').click();
    cy.get('[data-testid="edit-btn"]').click();
    cy.get('[data-testid="name-input"]').clear().type('Jane Doe');
    cy.get('[data-testid="save-btn"]').click();
    
    cy.contains('Jane Doe').should('be.visible');
  });
});
```

### Test Fixtures

```javascript
// fixtures/users.js
module.exports = {
  validUser: {
    name: 'John Doe',
    email: 'john@example.com',
    age: 30
  },
  
  invalidUser: {
    name: '',
    email: 'invalid-email'
  },
  
  adminUser: {
    name: 'Admin',
    email: 'admin@example.com',
    role: 'admin'
  }
};

// test.js
const fixtures = require('./fixtures/users');

test('creates valid user', async () => {
  const user = await User.create(fixtures.validUser);
  expect(user).toMatchObject(fixtures.validUser);
});
```

### Snapshot Testing

```javascript
test('renders user component', () => {
  const user = { name: 'John', email: 'john@example.com' };
  const tree = renderer.create(<UserComponent user={user} />).toJSON();
  expect(tree).toMatchSnapshot();
});

// Updates snapshot: jest -u
```

## 🎤 Interview Questions

### Q1: What are the types of testing?
**Answer:**
- **Unit**: Individual functions/modules
- **Integration**: Multiple components together
- **E2E**: Complete user flows
- **Performance**: Load, stress testing

### Q2: What is mocking?
**Answer:** Replacing real dependencies with fake implementations for testing. Isolates code being tested.

### Q3: What is test coverage?
**Answer:** Percentage of code executed by tests. Metrics: lines, branches, functions, statements. Aim for 80%+.

### Q4: Jest vs Mocha?
**Answer:**
- **Jest**: All-in-one, built-in mocking, snapshots, zero config
- **Mocha**: Flexible, modular, need to add chai/sinon

### Q5: What is TDD?
**Answer:** Test-Driven Development. Write test first, then code to pass test. Red → Green → Refactor cycle.

### Q6: What are test fixtures?
**Answer:** Predefined test data. Ensures consistent test environment.

### Q7: beforeEach vs beforeAll?
**Answer:**
- `beforeEach`: Runs before each test
- `beforeAll`: Runs once before all tests

### Q8: How to test async code?
**Answer:**
```javascript
test('async test', async () => {
  const data = await fetchData();
  expect(data).toBeDefined();
});
```

### Q9: What is supertest?
**Answer:** Library for testing HTTP servers. Makes requests to Express app without starting server.

### Q10: How to test private functions?
**Answer:** Don't test them directly. Test through public API. If needed, refactor to separate testable module.

## 🎯 Best Practices

1. **Follow AAA pattern**
   ```javascript
   // Arrange
   const user = { name: 'John' };
   // Act
   const result = createUser(user);
   // Assert
   expect(result).toBeDefined();
   ```

2. **Test behavior, not implementation**
   ```javascript
   // Good: Test what it does
   expect(getTotal()).toBe(100);
   // Bad: Test how it does it
   expect(addValues).toHaveBeenCalled();
   ```

3. **Use descriptive test names**
   ```javascript
   test('returns 404 when user not found', ...)
   ```

4. **Keep tests independent**
   ```javascript
   beforeEach(() => {
     // Reset state
   });
   ```

5. **Mock external dependencies**
   ```javascript
   jest.mock('./emailService');
   ```

## 📚 Additional Resources

- [Jest Documentation](https://jestjs.io/)
- [Mocha](https://mochajs.org/)
- [Supertest](https://github.com/visionmedia/supertest)
- [Cypress](https://www.cypress.io/)

---

[← Previous: Error Handling](./18-error-handling.md) | [Next: Performance →](./20-performance.md)
