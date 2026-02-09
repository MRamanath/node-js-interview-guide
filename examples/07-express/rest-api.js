/**
 * Express REST API - Interview Standard
 * "Build a production-ready REST API"
 */

const express = require('express');
const app = express();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});

// In-memory database
let users = [
  { id: 1, name: 'Alice', email: 'alice@example.com', age: 30 },
  { id: 2, name: 'Bob', email: 'bob@example.com', age: 25 }
];
let nextId = 3;

// Validation middleware
function validateUser(req, res, next) {
  const { name, email } = req.body;
  
  if (!name || name.trim().length < 2) {
    return res.status(400).json({ error: 'Name must be at least 2 characters' });
  }
  
  if (!email || !email.match(/^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/)) {
    return res.status(400).json({ error: 'Valid email is required' });
  }
  
  next();
}

// Routes

// GET /api/users - List all users
app.get('/api/users', (req, res) => {
  const { name, minAge, page = 1, limit = 10 } = req.query;
  
  let filtered = users;
  
  // Filter by name
  if (name) {
    filtered = filtered.filter(u => 
      u.name.toLowerCase().includes(name.toLowerCase())
    );
  }
  
  // Filter by age
  if (minAge) {
    filtered = filtered.filter(u => u.age >= parseInt(minAge));
  }
  
  // Pagination
  const start = (page - 1) * limit;
  const end = start + parseInt(limit);
  const paginated = filtered.slice(start, end);
  
  res.json({
    success: true,
    page: parseInt(page),
    limit: parseInt(limit),
    total: filtered.length,
    data: paginated
  });
});

// GET /api/users/:id - Get user by ID
app.get('/api/users/:id', (req, res) => {
  const user = users.find(u => u.id === parseInt(req.params.id));
  
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }
  
  res.json({ success: true, data: user });
});

// POST /api/users - Create user
app.post('/api/users', validateUser, (req, res) => {
  const { name, email, age } = req.body;
  
  // Check duplicate email
  if (users.find(u => u.email === email)) {
    return res.status(409).json({ error: 'Email already exists' });
  }
  
  const newUser = {
    id: nextId++,
    name,
    email,
    age: age || 0,
    createdAt: new Date().toISOString()
  };
  
  users.push(newUser);
  res.status(201).json({ success: true, data: newUser });
});

// PUT /api/users/:id - Update user
app.put('/api/users/:id', validateUser, (req, res) => {
  const id = parseInt(req.params.id);
  const userIndex = users.findIndex(u => u.id === id);
  
  if (userIndex === -1) {
    return res.status(404).json({ error: 'User not found' });
  }
  
  const { name, email, age } = req.body;
  
  // Check duplicate email (excluding current user)
  if (users.find(u => u.email === email && u.id !== id)) {
    return res.status(409).json({ error: 'Email already exists' });
  }
  
  const updatedUser = {
    ...users[userIndex],
    name,
    email,
    age,
    updatedAt: new Date().toISOString()
  };
  
  users[userIndex] = updatedUser;
  res.json({ success: true, data: updatedUser });
});

// PATCH /api/users/:id - Partial update
app.patch('/api/users/:id', (req, res) => {
  const id = parseInt(req.params.id);
  const userIndex = users.findIndex(u => u.id === id);
  
  if (userIndex === -1) {
    return res.status(404).json({ error: 'User not found' });
  }
  
  const updates = req.body;
  const updatedUser = {
    ...users[userIndex],
    ...updates,
    id, // Prevent ID change
    updatedAt: new Date().toISOString()
  };
  
  users[userIndex] = updatedUser;
  res.json({ success: true, data: updatedUser });
});

// DELETE /api/users/:id - Delete user
app.delete('/api/users/:id', (req, res) => {
  const id = parseInt(req.params.id);
  const userIndex = users.findIndex(u => u.id === id);
  
  if (userIndex === -1) {
    return res.status(404).json({ error: 'User not found' });
  }
  
  const deleted = users.splice(userIndex, 1)[0];
  res.json({ success: true, data: deleted });
});

// GET /api/stats - Statistics
app.get('/api/stats', (req, res) => {
  const avgAge = users.reduce((sum, u) => sum + u.age, 0) / users.length;
  
  res.json({
    success: true,
    data: {
      totalUsers: users.length,
      averageAge: avgAge.toFixed(2),
      domains: [...new Set(users.map(u => u.email.split('@')[1]))]
    }
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log('\nEndpoints:');
  console.log('GET    /api/users           - List users (query: name, minAge, page, limit)');
  console.log('GET    /api/users/:id       - Get user');
  console.log('POST   /api/users           - Create user');
  console.log('PUT    /api/users/:id       - Update user');
  console.log('PATCH  /api/users/:id       - Partial update');
  console.log('DELETE /api/users/:id       - Delete user');
  console.log('GET    /api/stats           - Statistics');
});

module.exports = app; // For testing

/* INTERVIEW POINTS:
1. RESTful naming conventions
2. Proper HTTP methods (GET, POST, PUT, PATCH, DELETE)
3. Status codes (200, 201, 400, 404, 409, 500)
4. Validation middleware
5. Error handling
6. Query parameters for filtering/pagination
7. Consistent response format
*/
