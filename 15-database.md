# 15. Database Integration

## 📚 Overview

Node.js supports various databases through drivers and ORMs. This guide covers MongoDB, PostgreSQL, MySQL, and Redis - the most popular databases in the Node.js ecosystem.

## 🎯 Key Concepts

### Database Types

```
SQL: PostgreSQL, MySQL - Structured, relations, ACID
NoSQL: MongoDB - Flexible schema, document-based
In-Memory: Redis - Fast caching, pub/sub
```

## 💻 Examples

### MongoDB with Mongoose

```javascript
const mongoose = require('mongoose');

// Connection
mongoose.connect('mongodb://localhost:27017/myapp', {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

const db = mongoose.connection;
db.on('error', console.error);
db.once('open', () => console.log('Connected to MongoDB'));

// Schema
const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  age: { type: Number, min: 0, max: 150 },
  role: { type: String, enum: ['user', 'admin'], default: 'user' },
  createdAt: { type: Date, default: Date.now },
  posts: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Post' }]
});

// Indexes
userSchema.index({ email: 1 });

// Methods
userSchema.methods.getFullInfo = function() {
  return `${this.name} (${this.email})`;
};

// Statics
userSchema.statics.findByEmail = function(email) {
  return this.findOne({ email });
};

// Middleware
userSchema.pre('save', function(next) {
  console.log('Saving user:', this.name);
  next();
});

const User = mongoose.model('User', userSchema);

// CRUD Operations
async function userOperations() {
  // Create
  const user = new User({
    name: 'John Doe',
    email: 'john@example.com',
    age: 30
  });
  await user.save();
  
  // OR
  const user2 = await User.create({
    name: 'Jane Doe',
    email: 'jane@example.com'
  });
  
  // Read
  const allUsers = await User.find();
  const oneUser = await User.findById(userId);
  const filtered = await User.find({ age: { $gte: 18 } });
  
  // Update
  await User.updateOne({ _id: userId }, { age: 31 });
  await User.findByIdAndUpdate(userId, { age: 31 }, { new: true });
  
  // Delete
  await User.deleteOne({ _id: userId });
  await User.findByIdAndDelete(userId);
  
  // Population (join)
  const userWithPosts = await User.findById(userId).populate('posts');
}
```

### PostgreSQL with pg

```javascript
const { Pool, Client } = require('pg');

// Connection pool (recommended)
const pool = new Pool({
  host: 'localhost',
  port: 5432,
  database: 'myapp',
  user: 'postgres',
  password: 'password',
  max: 20,                // Max clients
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000
});

// Query with pool
async function queryWithPool() {
  try {
    const result = await pool.query('SELECT * FROM users WHERE id = $1', [1]);
    console.log(result.rows);
  } catch (err) {
    console.error('Query error:', err);
  }
}

// Transaction
async function transaction() {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    await client.query('UPDATE accounts SET balance = balance - $1 WHERE id = $2', [100, 1]);
    await client.query('UPDATE accounts SET balance = balance + $1 WHERE id = $2', [100, 2]);
    
    await client.query('COMMIT');
    console.log('Transaction committed');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Transaction rolled back:', err);
  } finally {
    client.release();
  }
}

// Parameterized queries (prevents SQL injection)
async function safeQueries() {
  // GOOD
  const result = await pool.query(
    'SELECT * FROM users WHERE email = $1 AND role = $2',
    ['user@example.com', 'admin']
  );
  
  // BAD - SQL injection risk!
  // const email = "'; DROP TABLE users; --";
  // await pool.query(`SELECT * FROM users WHERE email = '${email}'`);
}

// Prepared statements
async function preparedStatements() {
  const client = await pool.connect();
  
  try {
    await client.query('PREPARE get_user AS SELECT * FROM users WHERE id = $1');
    const result = await client.query('EXECUTE get_user(1)');
    console.log(result.rows);
  } finally {
    client.release();
  }
}

// Graceful shutdown
process.on('SIGINT', async () => {
  await pool.end();
  process.exit(0);
});
```

### PostgreSQL with Sequelize ORM

```javascript
const { Sequelize, DataTypes } = require('sequelize');

const sequelize = new Sequelize('myapp', 'postgres', 'password', {
  host: 'localhost',
  dialect: 'postgres',
  logging: false,
  pool: {
    max: 5,
    min: 0,
    acquire: 30000,
    idle: 10000
  }
});

// Define model
const User = sequelize.define('User', {
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    validate: {
      isEmail: true
    }
  },
  age: {
    type: DataTypes.INTEGER,
    validate: {
      min: 0,
      max: 150
    }
  },
  role: {
    type: DataTypes.ENUM('user', 'admin'),
    defaultValue: 'user'
  }
});

// Associations
const Post = sequelize.define('Post', {
  title: DataTypes.STRING,
  content: DataTypes.TEXT
});

User.hasMany(Post);
Post.belongsTo(User);

// Sync models (creates tables)
await sequelize.sync({ alter: true });

// CRUD Operations
async function sequelizeOperations() {
  // Create
  const user = await User.create({
    name: 'John Doe',
    email: 'john@example.com',
    age: 30
  });
  
  // Read
  const users = await User.findAll();
  const oneUser = await User.findByPk(1);
  const filtered = await User.findAll({
    where: {
      age: { [Sequelize.Op.gte]: 18 }
    },
    order: [['name', 'ASC']],
    limit: 10
  });
  
  // Update
  await user.update({ age: 31 });
  await User.update({ role: 'admin' }, {
    where: { email: 'john@example.com' }
  });
  
  // Delete
  await user.destroy();
  await User.destroy({
    where: { age: { [Sequelize.Op.lt]: 18 } }
  });
  
  // With associations
  const userWithPosts = await User.findByPk(1, {
    include: Post
  });
}
```

### MySQL with mysql2

```javascript
const mysql = require('mysql2/promise');

// Create connection pool
const pool = mysql.createPool({
  host: 'localhost',
  user: 'root',
  password: 'password',
  database: 'myapp',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Query
async function queryDatabase() {
  try {
    const [rows, fields] = await pool.query('SELECT * FROM users WHERE id = ?', [1]);
    console.log(rows);
  } catch (err) {
    console.error(err);
  }
}

// Execute (for INSERT, UPDATE, DELETE)
async function executeQuery() {
  const [result] = await pool.execute(
    'INSERT INTO users (name, email) VALUES (?, ?)',
    ['John Doe', 'john@example.com']
  );
  
  console.log('Inserted ID:', result.insertId);
  console.log('Affected rows:', result.affectedRows);
}

// Transaction
async function mysqlTransaction() {
  const connection = await pool.getConnection();
  
  try {
    await connection.beginTransaction();
    
    await connection.execute('UPDATE accounts SET balance = balance - ? WHERE id = ?', [100, 1]);
    await connection.execute('UPDATE accounts SET balance = balance + ? WHERE id = ?', [100, 2]);
    
    await connection.commit();
  } catch (err) {
    await connection.rollback();
    throw err;
  } finally {
    connection.release();
  }
}

// Prepared statements
async function preparedStatement() {
  const [rows] = await pool.execute(
    'SELECT * FROM users WHERE email = ? AND role = ?',
    ['user@example.com', 'admin']
  );
  return rows;
}
```

### Redis

```javascript
const Redis = require('ioredis');

// Basic connection
const redis = new Redis({
  host: 'localhost',
  port: 6379,
  password: 'password',
  db: 0,
  retryStrategy: (times) => {
    return Math.min(times * 50, 2000);
  }
});

redis.on('connect', () => console.log('Redis connected'));
redis.on('error', (err) => console.error('Redis error:', err));

// String operations
await redis.set('key', 'value');
await redis.set('key', 'value', 'EX', 3600); // Expire in 1 hour
const value = await redis.get('key');

await redis.setex('session:123', 3600, JSON.stringify({ user: 'john' }));
await redis.del('key');

// Increment/Decrement
await redis.incr('counter');
await redis.incrby('counter', 5);
await redis.decr('counter');

// Hash operations
await redis.hset('user:1', 'name', 'John', 'email', 'john@example.com');
await redis.hget('user:1', 'name');
await redis.hgetall('user:1'); // Get all fields

// List operations
await redis.lpush('tasks', 'task1');
await redis.rpush('tasks', 'task2');
await redis.lpop('tasks');
await redis.lrange('tasks', 0, -1); // Get all

// Set operations
await redis.sadd('tags', 'nodejs', 'redis', 'database');
await redis.smembers('tags');
await redis.sismember('tags', 'nodejs');

// Sorted set operations
await redis.zadd('leaderboard', 100, 'player1', 200, 'player2');
await redis.zrange('leaderboard', 0, -1, 'WITHSCORES');
await redis.zrank('leaderboard', 'player1');

// Pub/Sub
const publisher = new Redis();
const subscriber = new Redis();

subscriber.subscribe('news', (err, count) => {
  console.log(`Subscribed to ${count} channels`);
});

subscriber.on('message', (channel, message) => {
  console.log(`Received from ${channel}:`, message);
});

publisher.publish('news', 'Hello World!');

// Pipeline (batch commands)
const pipeline = redis.pipeline();
pipeline.set('key1', 'value1');
pipeline.set('key2', 'value2');
pipeline.get('key1');
const results = await pipeline.exec();

// Transaction
await redis.multi()
  .set('key1', 'value1')
  .set('key2', 'value2')
  .exec();
```

### Connection Pool Best Practices

```javascript
// PostgreSQL pool configuration
const pgPool = new Pool({
  max: 20,                      // Maximum pool size
  min: 5,                       // Minimum pool size
  idleTimeoutMillis: 30000,     // Close idle connections after 30s
  connectionTimeoutMillis: 2000 // Fail after 2s if no connection available
});

// Handle pool errors
pgPool.on('error', (err) => {
  console.error('Unexpected pool error:', err);
});

// Graceful shutdown
async function gracefulShutdown() {
  await pgPool.end();
  await redis.quit();
  await mongoose.connection.close();
  process.exit(0);
}

process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);
```

### Caching Pattern

```javascript
async function getCachedUser(userId) {
  const cacheKey = `user:${userId}`;
  
  // Try cache first
  const cached = await redis.get(cacheKey);
  if (cached) {
    return JSON.parse(cached);
  }
  
  // Cache miss - query database
  const user = await User.findById(userId);
  
  // Store in cache (1 hour)
  await redis.setex(cacheKey, 3600, JSON.stringify(user));
  
  return user;
}

// Invalidate cache on update
async function updateUser(userId, data) {
  const user = await User.findByIdAndUpdate(userId, data, { new: true });
  
  // Invalidate cache
  await redis.del(`user:${userId}`);
  
  return user;
}
```

## 🎤 Interview Questions

### Q1: SQL vs NoSQL databases?
**Answer:**
- **SQL**: Structured, ACID, relations, schemas (PostgreSQL, MySQL)
- **NoSQL**: Flexible schema, horizontal scaling, document-based (MongoDB)

### Q2: What is connection pooling?
**Answer:** Reusing database connections instead of creating new ones. Improves performance, reduces overhead.

### Q3: How to prevent SQL injection?
**Answer:** Use parameterized queries/prepared statements:
```javascript
pool.query('SELECT * FROM users WHERE id = $1', [userId]);
```

### Q4: What is an ORM?
**Answer:** Object-Relational Mapping. Maps database tables to objects. Examples: Sequelize, TypeORM, Mongoose.

### Q5: What is a database transaction?
**Answer:** Group of operations that succeed or fail together (ACID). Use for operations that must be atomic.

### Q6: MongoDB vs PostgreSQL use cases?
**Answer:**
- **MongoDB**: Flexible schema, rapid prototyping, hierarchical data
- **PostgreSQL**: Complex queries, strong consistency, relational data

### Q7: What is Redis used for?
**Answer:** 
- Caching
- Session storage
- Pub/Sub messaging
- Rate limiting
- Leaderboards

### Q8: How to handle database errors?
**Answer:**
```javascript
try {
  await db.query();
} catch (err) {
  if (err.code === '23505') { // Unique violation
    // Handle duplicate
  }
  throw err;
}
```

### Q9: What is database indexing?
**Answer:** Data structure that improves query speed. Trade-off: faster reads, slower writes. Index frequently queried fields.

### Q10: How to handle database migrations?
**Answer:** Use migration tools:
- Sequelize: `sequelize-cli`
- TypeORM: built-in migrations
- Raw SQL: tools like `node-pg-migrate`

## 🎯 Best Practices

1. **Use connection pooling**
   ```javascript
   const pool = new Pool({ max: 20 });
   ```

2. **Always use parameterized queries**
   ```javascript
   pool.query('SELECT * FROM users WHERE id = $1', [id]);
   ```

3. **Implement graceful shutdown**
   ```javascript
   process.on('SIGTERM', async () => {
     await pool.end();
   });
   ```

4. **Use transactions for related operations**
   ```javascript
   await client.query('BEGIN');
   // operations
   await client.query('COMMIT');
   ```

5. **Add indexes for performance**
   ```javascript
   userSchema.index({ email: 1 });
   ```

## 📚 Additional Resources

- [Mongoose Documentation](https://mongoosejs.com/)
- [node-postgres](https://node-postgres.com/)
- [Sequelize](https://sequelize.org/)
- [ioredis](https://github.com/luin/ioredis)

---

[← Previous: Worker Threads](./14-worker-threads.md) | [Next: Authentication →](./16-authentication.md)
