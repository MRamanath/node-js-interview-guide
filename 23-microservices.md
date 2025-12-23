# 23. Microservices

## 📚 Overview

Microservices architecture structures an application as a collection of loosely coupled, independently deployable services. Each service is responsible for a specific business capability and can be developed, deployed, and scaled independently.

## 🎯 Key Concepts

### Monolith vs Microservices

```
Monolith:
- Single codebase
- Deployed as one unit
- Tight coupling
- Scale entire app
- Simpler development

Microservices:
- Multiple services
- Independent deployment
- Loose coupling
- Scale individual services
- Complex orchestration
```

### Key Principles

```
1. Single Responsibility: One service, one purpose
2. Autonomous: Independent deployment
3. Decentralized: Own data, decisions
4. Resilient: Handle failures gracefully
5. Observable: Logging, monitoring, tracing
```

## 💻 Examples

### Basic Service Structure

```javascript
// user-service/server.js
const express = require('express');
const mongoose = require('mongoose');

const app = express();
app.use(express.json());

// User model
const User = mongoose.model('User', {
  name: String,
  email: String,
  age: Number
});

// Routes
app.get('/users', async (req, res) => {
  const users = await User.find();
  res.json(users);
});

app.get('/users/:id', async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) return res.status(404).json({ error: 'User not found' });
  res.json(user);
});

app.post('/users', async (req, res) => {
  const user = await User.create(req.body);
  res.status(201).json(user);
});

app.put('/users/:id', async (req, res) => {
  const user = await User.findByIdAndUpdate(req.params.id, req.body, { new: true });
  res.json(user);
});

app.delete('/users/:id', async (req, res) => {
  await User.findByIdAndDelete(req.params.id);
  res.status(204).send();
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'healthy', service: 'user-service' });
});

mongoose.connect(process.env.MONGODB_URI);
app.listen(3001, () => console.log('User service running on port 3001'));
```

### Service Communication (HTTP)

```javascript
// order-service/server.js
const express = require('express');
const axios = require('axios');

const app = express();
app.use(express.json());

const USER_SERVICE = process.env.USER_SERVICE_URL || 'http://localhost:3001';
const PRODUCT_SERVICE = process.env.PRODUCT_SERVICE_URL || 'http://localhost:3002';

app.post('/orders', async (req, res) => {
  try {
    const { userId, productId, quantity } = req.body;
    
    // Call user service
    const userResponse = await axios.get(`${USER_SERVICE}/users/${userId}`);
    const user = userResponse.data;
    
    // Call product service
    const productResponse = await axios.get(`${PRODUCT_SERVICE}/products/${productId}`);
    const product = productResponse.data;
    
    // Create order
    const order = await Order.create({
      userId,
      productId,
      quantity,
      totalPrice: product.price * quantity,
      user: user.name,
      product: product.name
    });
    
    res.status(201).json(order);
  } catch (error) {
    console.error('Order creation failed:', error.message);
    res.status(500).json({ error: 'Failed to create order' });
  }
});

app.listen(3003, () => console.log('Order service running on port 3003'));
```

### Message Queue Communication (RabbitMQ)

```javascript
// publisher.js
const amqp = require('amqplib');

class MessagePublisher {
  constructor() {
    this.connection = null;
    this.channel = null;
  }
  
  async connect() {
    this.connection = await amqp.connect(process.env.RABBITMQ_URL);
    this.channel = await this.connection.createChannel();
  }
  
  async publish(queue, message) {
    await this.channel.assertQueue(queue, { durable: true });
    this.channel.sendToQueue(queue, Buffer.from(JSON.stringify(message)), {
      persistent: true
    });
    console.log('Message sent:', message);
  }
  
  async close() {
    await this.channel.close();
    await this.connection.close();
  }
}

// Usage in service
app.post('/users', async (req, res) => {
  const user = await User.create(req.body);
  
  // Publish event
  await publisher.publish('user.created', {
    userId: user._id,
    email: user.email,
    timestamp: new Date()
  });
  
  res.status(201).json(user);
});

// subscriber.js
const amqp = require('amqplib');

class MessageSubscriber {
  constructor() {
    this.connection = null;
    this.channel = null;
  }
  
  async connect() {
    this.connection = await amqp.connect(process.env.RABBITMQ_URL);
    this.channel = await this.connection.createChannel();
  }
  
  async subscribe(queue, handler) {
    await this.channel.assertQueue(queue, { durable: true });
    this.channel.prefetch(1);
    
    this.channel.consume(queue, async (msg) => {
      if (msg) {
        try {
          const data = JSON.parse(msg.content.toString());
          await handler(data);
          this.channel.ack(msg);
        } catch (error) {
          console.error('Message handling failed:', error);
          this.channel.nack(msg, false, true); // Requeue
        }
      }
    });
  }
}

// Usage in email service
const subscriber = new MessageSubscriber();
await subscriber.connect();

subscriber.subscribe('user.created', async (data) => {
  console.log('New user created:', data);
  await sendWelcomeEmail(data.email);
});
```

### Event-Driven Architecture

```javascript
// event-bus.js
const EventEmitter = require('events');

class EventBus extends EventEmitter {
  publish(event, data) {
    console.log(`Publishing event: ${event}`);
    this.emit(event, data);
  }
  
  subscribe(event, handler) {
    console.log(`Subscribing to event: ${event}`);
    this.on(event, handler);
  }
}

module.exports = new EventBus();

// user-service.js
const eventBus = require('./event-bus');

app.post('/users', async (req, res) => {
  const user = await User.create(req.body);
  
  // Emit event
  eventBus.publish('user.created', {
    userId: user._id,
    email: user.email
  });
  
  res.status(201).json(user);
});

// email-service.js
const eventBus = require('./event-bus');

eventBus.subscribe('user.created', async (data) => {
  console.log('Sending welcome email to:', data.email);
  await sendEmail(data.email, 'Welcome!');
});

// notification-service.js
eventBus.subscribe('user.created', async (data) => {
  console.log('Creating notification for:', data.userId);
  await createNotification(data.userId, 'Welcome to our platform!');
});
```

### API Gateway

```javascript
// api-gateway/server.js
const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const jwt = require('jsonwebtoken');

const app = express();

// Authentication middleware
const authenticate = (req, res, next) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  
  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' });
  }
};

// Rate limiting
const rateLimit = require('express-rate-limit');
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100
});

app.use(limiter);

// Logging
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path}`);
  next();
});

// Route to services
app.use('/api/users', authenticate, createProxyMiddleware({
  target: 'http://localhost:3001',
  changeOrigin: true,
  pathRewrite: {
    '^/api/users': '/users'
  }
}));

app.use('/api/products', authenticate, createProxyMiddleware({
  target: 'http://localhost:3002',
  changeOrigin: true,
  pathRewrite: {
    '^/api/products': '/products'
  }
}));

app.use('/api/orders', authenticate, createProxyMiddleware({
  target: 'http://localhost:3003',
  changeOrigin: true,
  pathRewrite: {
    '^/api/orders': '/orders'
  }
}));

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'healthy', service: 'api-gateway' });
});

app.listen(3000, () => console.log('API Gateway running on port 3000'));
```

### Service Discovery (Consul)

```javascript
// service-registry.js
const Consul = require('consul');

class ServiceRegistry {
  constructor() {
    this.consul = new Consul({
      host: process.env.CONSUL_HOST || 'localhost',
      port: process.env.CONSUL_PORT || 8500
    });
  }
  
  // Register service
  async register(serviceName, port) {
    const serviceId = `${serviceName}-${port}`;
    
    await this.consul.agent.service.register({
      id: serviceId,
      name: serviceName,
      address: 'localhost',
      port: port,
      check: {
        http: `http://localhost:${port}/health`,
        interval: '10s',
        timeout: '5s'
      }
    });
    
    console.log(`Service ${serviceName} registered`);
    
    // Deregister on shutdown
    process.on('SIGINT', async () => {
      await this.consul.agent.service.deregister(serviceId);
      process.exit();
    });
  }
  
  // Discover service
  async discover(serviceName) {
    const services = await this.consul.health.service({
      service: serviceName,
      passing: true
    });
    
    if (services.length === 0) {
      throw new Error(`Service ${serviceName} not found`);
    }
    
    // Load balancing: pick random
    const service = services[Math.floor(Math.random() * services.length)];
    return `http://${service.Service.Address}:${service.Service.Port}`;
  }
}

// Usage
const registry = new ServiceRegistry();
await registry.register('user-service', 3001);

// In another service
const userServiceUrl = await registry.discover('user-service');
const response = await axios.get(`${userServiceUrl}/users`);
```

### Circuit Breaker

```javascript
const CircuitBreaker = require('opossum');

// Circuit breaker options
const options = {
  timeout: 3000, // If function takes longer, trigger failure
  errorThresholdPercentage: 50, // Open circuit if 50% fail
  resetTimeout: 30000 // Try again after 30s
};

// Wrap function with circuit breaker
const breaker = new CircuitBreaker(async (userId) => {
  const response = await axios.get(`${USER_SERVICE}/users/${userId}`);
  return response.data;
}, options);

// Fallback
breaker.fallback(() => ({
  id: 'unknown',
  name: 'Service Unavailable'
}));

// Events
breaker.on('open', () => console.log('Circuit opened'));
breaker.on('halfOpen', () => console.log('Circuit half-open'));
breaker.on('close', () => console.log('Circuit closed'));

// Usage
app.get('/users/:id', async (req, res) => {
  try {
    const user = await breaker.fire(req.params.id);
    res.json(user);
  } catch (error) {
    res.status(503).json({ error: 'Service unavailable' });
  }
});
```

### Distributed Tracing

```javascript
// Using Jaeger
const { initTracer } = require('jaeger-client');

const config = {
  serviceName: 'user-service',
  sampler: {
    type: 'const',
    param: 1
  },
  reporter: {
    logSpans: true,
    agentHost: 'localhost',
    agentPort: 6832
  }
};

const tracer = initTracer(config);

// Middleware
app.use((req, res, next) => {
  const span = tracer.startSpan(`${req.method} ${req.path}`);
  req.span = span;
  
  res.on('finish', () => {
    span.setTag('http.status_code', res.statusCode);
    span.finish();
  });
  
  next();
});

// In route
app.get('/users/:id', async (req, res) => {
  const span = req.span.startSpan('get-user');
  
  try {
    const user = await User.findById(req.params.id);
    span.setTag('user.id', user._id);
    res.json(user);
  } catch (error) {
    span.setTag('error', true);
    span.log({ event: 'error', message: error.message });
    throw error;
  } finally {
    span.finish();
  }
});
```

### Saga Pattern (Distributed Transactions)

```javascript
// Order Saga
class OrderSaga {
  async execute(orderData) {
    const { userId, productId, quantity } = orderData;
    
    try {
      // Step 1: Reserve inventory
      const reservation = await this.reserveInventory(productId, quantity);
      
      // Step 2: Process payment
      const payment = await this.processPayment(userId, reservation.amount);
      
      // Step 3: Create order
      const order = await this.createOrder({
        ...orderData,
        reservationId: reservation.id,
        paymentId: payment.id
      });
      
      return order;
    } catch (error) {
      // Compensating transactions
      await this.compensate(error);
      throw error;
    }
  }
  
  async compensate(error) {
    console.log('Rolling back transaction');
    
    if (error.step === 'payment') {
      await this.cancelReservation();
    } else if (error.step === 'order') {
      await this.refundPayment();
      await this.cancelReservation();
    }
  }
  
  async reserveInventory(productId, quantity) {
    const response = await axios.post(`${INVENTORY_SERVICE}/reserve`, {
      productId,
      quantity
    });
    return response.data;
  }
  
  async processPayment(userId, amount) {
    const response = await axios.post(`${PAYMENT_SERVICE}/charge`, {
      userId,
      amount
    });
    return response.data;
  }
  
  async createOrder(orderData) {
    const order = await Order.create(orderData);
    return order;
  }
}

// Usage
const saga = new OrderSaga();
const order = await saga.execute(orderData);
```

### Docker Compose Setup

```yaml
# docker-compose.yml
version: '3.8'

services:
  user-service:
    build: ./user-service
    ports:
      - "3001:3001"
    environment:
      - MONGODB_URI=mongodb://mongo:27017/users
    depends_on:
      - mongo
  
  product-service:
    build: ./product-service
    ports:
      - "3002:3002"
    environment:
      - MONGODB_URI=mongodb://mongo:27017/products
    depends_on:
      - mongo
  
  order-service:
    build: ./order-service
    ports:
      - "3003:3003"
    environment:
      - MONGODB_URI=mongodb://mongo:27017/orders
      - USER_SERVICE_URL=http://user-service:3001
      - PRODUCT_SERVICE_URL=http://product-service:3002
    depends_on:
      - mongo
      - user-service
      - product-service
  
  api-gateway:
    build: ./api-gateway
    ports:
      - "3000:3000"
    environment:
      - USER_SERVICE_URL=http://user-service:3001
      - PRODUCT_SERVICE_URL=http://product-service:3002
      - ORDER_SERVICE_URL=http://order-service:3003
    depends_on:
      - user-service
      - product-service
      - order-service
  
  mongo:
    image: mongo:latest
    ports:
      - "27017:27017"
    volumes:
      - mongo-data:/data/db
  
  rabbitmq:
    image: rabbitmq:management
    ports:
      - "5672:5672"
      - "15672:15672"

volumes:
  mongo-data:
```

## 🎤 Interview Questions

### Q1: What are microservices?
**Answer:** Architecture pattern where application is built as collection of small, independent services, each responsible for specific business capability.

### Q2: What are advantages of microservices?
**Answer:** Independent deployment, technology diversity, scalability, fault isolation, easier testing, team autonomy.

### Q3: What are disadvantages of microservices?
**Answer:** Complexity, distributed system challenges, network latency, data consistency, testing difficulty, operational overhead.

### Q4: How do microservices communicate?
**Answer:**
- **Synchronous**: HTTP/REST, gRPC
- **Asynchronous**: Message queues (RabbitMQ, Kafka), events

### Q5: What is an API Gateway?
**Answer:** Entry point for clients. Handles routing, authentication, rate limiting, load balancing, request/response transformation.

### Q6: What is service discovery?
**Answer:** Mechanism for services to find each other dynamically. Tools: Consul, Eureka, etcd.

### Q7: What is a circuit breaker?
**Answer:** Pattern preventing cascading failures. If service fails repeatedly, circuit opens, requests fail fast with fallback.

### Q8: How to handle distributed transactions?
**Answer:** Saga pattern: sequence of local transactions with compensating transactions for rollback. Eventual consistency.

### Q9: What is the difference between orchestration and choreography?
**Answer:**
- **Orchestration**: Central coordinator controls flow
- **Choreography**: Services react to events independently

### Q10: How to ensure data consistency?
**Answer:** Event sourcing, CQRS, saga pattern, eventual consistency, distributed transactions with 2PC (complex).

## 🎯 Best Practices

1. **One service, one responsibility**
   ```javascript
   // user-service handles only users
   ```

2. **Use API Gateway**
   ```javascript
   // Central entry point
   ```

3. **Implement circuit breakers**
   ```javascript
   const breaker = new CircuitBreaker(fn, options);
   ```

4. **Use message queues for async**
   ```javascript
   await publisher.publish('event', data);
   ```

5. **Monitor and trace**
   ```javascript
   // Distributed tracing, logging
   ```

## 📚 Additional Resources

- [Microservices.io](https://microservices.io/)
- [Martin Fowler - Microservices](https://martinfowler.com/articles/microservices.html)
- [Docker Documentation](https://docs.docker.com/)

---

[← Previous: GraphQL](./22-graphql.md) | [Next: Deployment →](./24-deployment.md)
