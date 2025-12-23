# 24. Deployment

## 📚 Overview

Deployment is the process of making your Node.js application available to users. This includes building, packaging, hosting, and maintaining your application in production environments. Proper deployment ensures reliability, scalability, and security.

## 🎯 Key Concepts

### Deployment Pipeline

```
Code → Build → Test → Package → Deploy → Monitor
     ↓
   Version Control (Git)
     ↓
   CI/CD (GitHub Actions, Jenkins)
     ↓
   Hosting (AWS, Heroku, DigitalOcean)
     ↓
   Monitoring (PM2, New Relic)
```

### Environment Types

```
Development: Local machine, frequent changes
Staging: Production-like, testing before release
Production: Live environment, stable, monitored
```

## 💻 Examples

### Environment Configuration

```javascript
// config/config.js
module.exports = {
  development: {
    port: 3000,
    database: 'mongodb://localhost/myapp-dev',
    logLevel: 'debug',
    corsOrigin: '*'
  },
  
  staging: {
    port: process.env.PORT || 3000,
    database: process.env.DATABASE_URL,
    logLevel: 'info',
    corsOrigin: process.env.FRONTEND_URL
  },
  
  production: {
    port: process.env.PORT || 3000,
    database: process.env.DATABASE_URL,
    logLevel: 'error',
    corsOrigin: process.env.FRONTEND_URL,
    redis: process.env.REDIS_URL
  }
};

// app.js
const env = process.env.NODE_ENV || 'development';
const config = require('./config/config')[env];

// .env file
NODE_ENV=production
PORT=3000
DATABASE_URL=mongodb://user:pass@host:27017/dbname
JWT_SECRET=your-secret-key
REDIS_URL=redis://host:6379
```

### PM2 (Process Manager)

```javascript
// ecosystem.config.js
module.exports = {
  apps: [
    {
      name: 'my-app',
      script: './server.js',
      instances: 'max', // Use all CPU cores
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'development'
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 3000
      },
      error_file: './logs/err.log',
      out_file: './logs/out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss',
      merge_logs: true,
      max_memory_restart: '1G',
      watch: false,
      ignore_watch: ['node_modules', 'logs'],
      max_restarts: 10,
      min_uptime: '10s'
    }
  ]
};

// Commands
// pm2 start ecosystem.config.js
// pm2 start ecosystem.config.js --env production
// pm2 reload my-app
// pm2 restart my-app
// pm2 stop my-app
// pm2 delete my-app
// pm2 logs
// pm2 monit
// pm2 list
// pm2 startup
// pm2 save
```

### Docker

```dockerfile
# Dockerfile
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy application files
COPY . .

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# Change ownership
RUN chown -R nodejs:nodejs /app

# Switch to non-root user
USER nodejs

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s \
  CMD node healthcheck.js

# Start application
CMD ["node", "server.js"]

# Multi-stage build (optimized)
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:18-alpine
WORKDIR /app
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY package*.json ./
EXPOSE 3000
CMD ["node", "dist/server.js"]
```

```yaml
# docker-compose.yml
version: '3.8'

services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - DATABASE_URL=mongodb://mongo:27017/myapp
      - REDIS_URL=redis://redis:6379
    depends_on:
      - mongo
      - redis
    restart: unless-stopped
    volumes:
      - ./logs:/app/logs
  
  mongo:
    image: mongo:latest
    ports:
      - "27017:27017"
    volumes:
      - mongo-data:/data/db
    restart: unless-stopped
  
  redis:
    image: redis:alpine
    ports:
      - "6379:6379"
    volumes:
      - redis-data:/data
    restart: unless-stopped
  
  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
      - ./ssl:/etc/nginx/ssl
    depends_on:
      - app
    restart: unless-stopped

volumes:
  mongo-data:
  redis-data:

# Commands
# docker-compose up -d
# docker-compose down
# docker-compose logs -f
# docker-compose ps
```

### NGINX Reverse Proxy

```nginx
# nginx.conf
events {
    worker_connections 1024;
}

http {
    upstream app {
        server app:3000;
    }
    
    # Rate limiting
    limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;
    
    server {
        listen 80;
        server_name example.com;
        
        # Redirect to HTTPS
        return 301 https://$server_name$request_uri;
    }
    
    server {
        listen 443 ssl http2;
        server_name example.com;
        
        # SSL certificates
        ssl_certificate /etc/nginx/ssl/cert.pem;
        ssl_certificate_key /etc/nginx/ssl/key.pem;
        
        # SSL configuration
        ssl_protocols TLSv1.2 TLSv1.3;
        ssl_ciphers HIGH:!aNULL:!MD5;
        ssl_prefer_server_ciphers on;
        
        # Security headers
        add_header X-Frame-Options "SAMEORIGIN" always;
        add_header X-Content-Type-Options "nosniff" always;
        add_header X-XSS-Protection "1; mode=block" always;
        
        # Gzip compression
        gzip on;
        gzip_types text/plain text/css application/json application/javascript;
        
        # Logging
        access_log /var/log/nginx/access.log;
        error_log /var/log/nginx/error.log;
        
        # API routes
        location /api {
            limit_req zone=api burst=20 nodelay;
            
            proxy_pass http://app;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection 'upgrade';
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
            proxy_cache_bypass $http_upgrade;
        }
        
        # Static files
        location / {
            root /var/www/html;
            try_files $uri $uri/ /index.html;
        }
    }
}
```

### CI/CD with GitHub Actions

```yaml
# .github/workflows/deploy.yml
name: Deploy

on:
  push:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run tests
        run: npm test
      
      - name: Run linter
        run: npm run lint
  
  build:
    needs: test
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Build Docker image
        run: |
          docker build -t myapp:latest .
          docker tag myapp:latest myregistry.com/myapp:${{ github.sha }}
      
      - name: Push to registry
        run: |
          echo ${{ secrets.DOCKER_PASSWORD }} | docker login -u ${{ secrets.DOCKER_USERNAME }} --password-stdin
          docker push myregistry.com/myapp:${{ github.sha }}
  
  deploy:
    needs: build
    runs-on: ubuntu-latest
    
    steps:
      - name: Deploy to production
        uses: appleboy/ssh-action@master
        with:
          host: ${{ secrets.HOST }}
          username: ${{ secrets.USERNAME }}
          key: ${{ secrets.SSH_KEY }}
          script: |
            cd /app
            docker pull myregistry.com/myapp:${{ github.sha }}
            docker-compose down
            docker-compose up -d
```

### Heroku Deployment

```javascript
// package.json
{
  "name": "my-app",
  "version": "1.0.0",
  "engines": {
    "node": "18.x"
  },
  "scripts": {
    "start": "node server.js",
    "heroku-postbuild": "npm run build"
  }
}

// Procfile
web: node server.js

// app.json (for Heroku Button)
{
  "name": "My App",
  "description": "Node.js application",
  "repository": "https://github.com/user/repo",
  "keywords": ["node", "express"],
  "env": {
    "NODE_ENV": {
      "value": "production"
    },
    "JWT_SECRET": {
      "generator": "secret"
    }
  },
  "addons": [
    "heroku-postgresql",
    "heroku-redis"
  ]
}

// Commands
// heroku login
// heroku create my-app
// git push heroku main
// heroku config:set KEY=value
// heroku logs --tail
// heroku ps:scale web=2
// heroku run npm run migrate
```

### AWS EC2 Deployment

```bash
# Setup script for Ubuntu
#!/bin/bash

# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Install PM2
sudo npm install -g pm2

# Install NGINX
sudo apt install -y nginx

# Clone repository
git clone https://github.com/user/repo.git /home/ubuntu/app
cd /home/ubuntu/app

# Install dependencies
npm ci --only=production

# Setup environment
cat > .env << EOF
NODE_ENV=production
PORT=3000
DATABASE_URL=$DATABASE_URL
EOF

# Start with PM2
pm2 start ecosystem.config.js --env production
pm2 startup
pm2 save

# Configure NGINX
sudo tee /etc/nginx/sites-available/myapp << EOF
server {
    listen 80;
    server_name example.com;
    
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_cache_bypass \$http_upgrade;
    }
}
EOF

sudo ln -s /etc/nginx/sites-available/myapp /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx

# Setup SSL with Let's Encrypt
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d example.com
```

### Health Checks

```javascript
// healthcheck.js
const http = require('http');

const options = {
  host: 'localhost',
  port: process.env.PORT || 3000,
  path: '/health',
  timeout: 2000
};

const request = http.request(options, (res) => {
  console.log(`STATUS: ${res.statusCode}`);
  if (res.statusCode === 200) {
    process.exit(0);
  } else {
    process.exit(1);
  }
});

request.on('error', (err) => {
  console.error('ERROR:', err);
  process.exit(1);
});

request.end();

// server.js - health endpoint
app.get('/health', async (req, res) => {
  // Check database
  const dbHealthy = await checkDatabase();
  
  // Check Redis
  const redisHealthy = await checkRedis();
  
  const healthy = dbHealthy && redisHealthy;
  
  res.status(healthy ? 200 : 503).json({
    status: healthy ? 'healthy' : 'unhealthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    database: dbHealthy ? 'connected' : 'disconnected',
    redis: redisHealthy ? 'connected' : 'disconnected'
  });
});

async function checkDatabase() {
  try {
    await mongoose.connection.db.admin().ping();
    return true;
  } catch (error) {
    return false;
  }
}

async function checkRedis() {
  try {
    await redis.ping();
    return true;
  } catch (error) {
    return false;
  }
}
```

### Monitoring

```javascript
// APM with New Relic
require('newrelic');
const express = require('express');

// Custom metrics
const newrelic = require('newrelic');

app.post('/orders', async (req, res) => {
  const startTime = Date.now();
  
  try {
    const order = await createOrder(req.body);
    
    // Record metric
    newrelic.recordMetric('Custom/OrderCreation', Date.now() - startTime);
    
    res.json(order);
  } catch (error) {
    newrelic.noticeError(error);
    res.status(500).json({ error: 'Failed to create order' });
  }
});

// Prometheus metrics
const promClient = require('prom-client');
const register = new promClient.Registry();

promClient.collectDefaultMetrics({ register });

const httpRequestDuration = new promClient.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code'],
  registers: [register]
});

app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = (Date.now() - start) / 1000;
    httpRequestDuration
      .labels(req.method, req.route?.path || req.path, res.statusCode)
      .observe(duration);
  });
  next();
});

app.get('/metrics', async (req, res) => {
  res.set('Content-Type', register.contentType);
  res.end(await register.metrics());
});
```

### Graceful Shutdown

```javascript
const express = require('express');
const mongoose = require('mongoose');

const app = express();

const server = app.listen(3000, () => {
  console.log('Server running on port 3000');
});

// Graceful shutdown
process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);

async function gracefulShutdown(signal) {
  console.log(`${signal} received, closing server gracefully`);
  
  // Stop accepting new connections
  server.close(async () => {
    console.log('HTTP server closed');
    
    try {
      // Close database connections
      await mongoose.connection.close();
      console.log('Database connection closed');
      
      // Close Redis
      await redis.quit();
      console.log('Redis connection closed');
      
      console.log('Graceful shutdown complete');
      process.exit(0);
    } catch (error) {
      console.error('Error during shutdown:', error);
      process.exit(1);
    }
  });
  
  // Force shutdown after timeout
  setTimeout(() => {
    console.error('Forcing shutdown');
    process.exit(1);
  }, 10000);
}
```

### Blue-Green Deployment

```bash
#!/bin/bash

# Blue-Green deployment script

BLUE_PORT=3000
GREEN_PORT=3001
NGINX_UPSTREAM="localhost:$BLUE_PORT"

# Build new version
git pull origin main
npm ci
npm run build

# Start green (new version)
PORT=$GREEN_PORT pm2 start ecosystem.config.js --name app-green

# Wait for health check
sleep 5
HEALTH=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:$GREEN_PORT/health)

if [ "$HEALTH" = "200" ]; then
  echo "Green deployment healthy, switching traffic"
  
  # Update NGINX to point to green
  sudo sed -i "s/$BLUE_PORT/$GREEN_PORT/g" /etc/nginx/sites-available/myapp
  sudo nginx -t && sudo systemctl reload nginx
  
  # Stop blue (old version)
  pm2 delete app-blue
  
  # Rename green to blue
  pm2 restart app-green --name app-blue
  
  echo "Deployment complete"
else
  echo "Green deployment unhealthy, rolling back"
  pm2 delete app-green
  exit 1
fi
```

## 🎤 Interview Questions

### Q1: What is the difference between development and production environments?
**Answer:** Development has debug tools, hot reload, verbose logging. Production is optimized, secure, monitored, with minimal logging.

### Q2: What is PM2?
**Answer:** Process manager for Node.js. Manages processes, clustering, auto-restart, monitoring, logging, zero-downtime deployment.

### Q3: Why use Docker for deployment?
**Answer:** Consistency across environments, isolation, easy scaling, version control, reproducible builds, portability.

### Q4: What is CI/CD?
**Answer:** Continuous Integration/Deployment. Automated testing, building, and deployment pipeline triggered by code changes.

### Q5: What is a reverse proxy?
**Answer:** Server (like NGINX) that sits between clients and app servers. Handles SSL, load balancing, caching, security.

### Q6: How to handle zero-downtime deployment?
**Answer:** Blue-green deployment, rolling updates, health checks, graceful shutdown, load balancer traffic switching.

### Q7: What is graceful shutdown?
**Answer:** Properly closing connections before exit. Stop accepting requests, finish ongoing requests, close database connections, then exit.

### Q8: How to secure Node.js in production?
**Answer:** Use HTTPS, helmet middleware, rate limiting, input validation, environment variables for secrets, regular updates.

### Q9: What is health check?
**Answer:** Endpoint checking if application and dependencies (DB, Redis) are working. Used by load balancers and orchestrators.

### Q10: How to monitor Node.js application?
**Answer:** APM tools (New Relic, Datadog), PM2 monitoring, logging (Winston), metrics (Prometheus), error tracking (Sentry).

## 🎯 Best Practices

1. **Use environment variables**
   ```javascript
   const port = process.env.PORT || 3000;
   ```

2. **Enable production mode**
   ```javascript
   NODE_ENV=production node server.js
   ```

3. **Use process manager (PM2)**
   ```bash
   pm2 start app.js -i max
   ```

4. **Implement health checks**
   ```javascript
   app.get('/health', healthCheckHandler);
   ```

5. **Graceful shutdown**
   ```javascript
   process.on('SIGTERM', gracefulShutdown);
   ```

## 📚 Additional Resources

- [PM2 Documentation](https://pm2.keymetrics.io/docs/)
- [Docker Documentation](https://docs.docker.com/)
- [AWS Deployment Guide](https://aws.amazon.com/getting-started/hands-on/deploy-nodejs-web-app/)
- [Heroku Node.js](https://devcenter.heroku.com/articles/deploying-nodejs)

---

[← Previous: Microservices](./23-microservices.md) | [Home →](./README.md)
