# 06. HTTP Server

## 📚 Overview

The HTTP module allows Node.js to transfer data over the Hypertext Transfer Protocol. You can create web servers that handle HTTP requests and responses.

## 🎯 Key Concepts

### HTTP Server Architecture

```
Client (Browser)          Node.js Server
     |                         |
     |------ HTTP Request ----->|
     |      GET /users          | createServer((req, res) => {
     |      Headers              |   // Handle request
     |                          |   res.end(data)
     |<----- HTTP Response -----|  })
     |      200 OK              |
     |      Body: JSON          |
```

## 💻 Examples

### Basic HTTP Server

```javascript
const http = require('http');

const server = http.createServer((req, res) => {
  // Set response headers
  res.writeHead(200, {
    'Content-Type': 'text/plain',
    'X-Powered-By': 'Node.js'
  });
  
  // Send response body
  res.end('Hello, World!');
});

server.listen(3000, () => {
  console.log('Server running at http://localhost:3000/');
});

// Test: curl http://localhost:3000
```

### JSON API Server

```javascript
const http = require('http');

const server = http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'application/json' });
  
  const response = {
    message: 'Hello, World!',
    timestamp: new Date(),
    method: req.method,
    url: req.url
  };
  
  res.end(JSON.stringify(response));
});

server.listen(3000);
```

### Simple Routing

```javascript
const http = require('http');
const url = require('url');

const server = http.createServer((req, res) => {
  const parsedUrl = url.parse(req.url, true);
  const pathname = parsedUrl.pathname;
  const query = parsedUrl.query;
  
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Content-Type', 'application/json');
  
  // Route handling
  if (pathname === '/' && req.method === 'GET') {
    res.writeHead(200);
    res.end(JSON.stringify({ message: 'Welcome to the API' }));
  }
  else if (pathname === '/users' && req.method === 'GET') {
    res.writeHead(200);
    res.end(JSON.stringify({
      users: [
        { id: 1, name: 'Alice' },
        { id: 2, name: 'Bob' }
      ]
    }));
  }
  else if (pathname === '/user' && req.method === 'GET') {
    const userId = query.id;
    res.writeHead(200);
    res.end(JSON.stringify({
      user: { id: userId, name: 'John Doe' }
    }));
  }
  else if (pathname === '/users' && req.method === 'POST') {
    let body = '';
    
    req.on('data', chunk => {
      body += chunk.toString();
    });
    
    req.on('end', () => {
      const user = JSON.parse(body);
      res.writeHead(201);
      res.end(JSON.stringify({
        message: 'User created',
        user
      }));
    });
  }
  else {
    res.writeHead(404);
    res.end(JSON.stringify({ error: 'Not Found' }));
  }
});

server.listen(3000, () => {
  console.log('Server running on port 3000');
});
```

### Handling POST Data

```javascript
function handlePostData(req, callback) {
  let body = '';
  
  req.on('data', chunk => {
    body += chunk.toString();
    
    // Prevent memory attacks - limit size to 1MB
    if (body.length > 1e6) {
      req.socket.destroy();
    }
  });
  
  req.on('end', () => {
    try {
      const data = JSON.parse(body);
      callback(null, data);
    } catch (err) {
      callback(new Error('Invalid JSON'));
    }
  });
  
  req.on('error', (err) => {
    callback(err);
  });
}

// Usage
if (req.method === 'POST') {
  handlePostData(req, (err, data) => {
    if (err) {
      res.writeHead(400);
      res.end(JSON.stringify({ error: err.message }));
    } else {
      res.writeHead(200);
      res.end(JSON.stringify({ received: data }));
    }
  });
}
```

### Serving Static Files

```javascript
const http = require('http');
const fs = require('fs');
const path = require('path');

const mimeTypes = {
  '.html': 'text/html',
  '.css': 'text/css',
  '.js': 'text/javascript',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon'
};

const server = http.createServer((req, res) => {
  const filePath = path.join(__dirname, 'public', req.url === '/' ? 'index.html' : req.url);
  const ext = path.extname(filePath);
  const contentType = mimeTypes[ext] || 'text/plain';
  
  fs.readFile(filePath, (err, content) => {
    if (err) {
      if (err.code === 'ENOENT') {
        res.writeHead(404);
        res.end('404 - File Not Found');
      } else {
        res.writeHead(500);
        res.end('500 - Server Error');
      }
    } else {
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(content);
    }
  });
});

server.listen(3000);
```

### File Upload Handler

```javascript
const http = require('http');
const fs = require('fs');

const server = http.createServer((req, res) => {
  if (req.url === '/upload' && req.method === 'POST') {
    const writeStream = fs.createWriteStream('uploaded-file.dat');
    
    req.pipe(writeStream);
    
    writeStream.on('finish', () => {
      res.writeHead(200);
      res.end('Upload complete!');
    });
    
    writeStream.on('error', (err) => {
      res.writeHead(500);
      res.end('Upload failed: ' + err.message);
    });
  } else {
    res.writeHead(404);
    res.end('Not Found');
  }
});

server.listen(3000);

// Test upload:
// curl -X POST -F "file=@myfile.txt" http://localhost:3000/upload
```

### Making HTTP Requests

```javascript
const http = require('http');

// GET request
function httpGet(url) {
  return new Promise((resolve, reject) => {
    http.get(url, (res) => {
      let data = '';
      
      res.on('data', chunk => {
        data += chunk;
      });
      
      res.on('end', () => {
        resolve(data);
      });
    }).on('error', reject);
  });
}

// Usage
const data = await httpGet('http://api.example.com/data');

// POST request
function httpPost(hostname, path, data) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname,
      path,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(data)
      }
    };
    
    const req = http.request(options, (res) => {
      let responseData = '';
      
      res.on('data', chunk => {
        responseData += chunk;
      });
      
      res.on('end', () => {
        resolve(responseData);
      });
    });
    
    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

// Usage
const result = await httpPost('api.example.com', '/users', JSON.stringify({ name: 'John' }));
```

### Server with Error Handling

```javascript
const http = require('http');

const server = http.createServer((req, res) => {
  try {
    // Request error handling
    req.on('error', (err) => {
      console.error('Request error:', err);
      res.writeHead(400);
      res.end('Bad Request');
    });
    
    // Response error handling
    res.on('error', (err) => {
      console.error('Response error:', err);
    });
    
    // Set timeout
    req.setTimeout(30000, () => {
      res.writeHead(408);
      res.end('Request Timeout');
    });
    
    // Your route logic here
    res.writeHead(200);
    res.end('OK');
    
  } catch (err) {
    console.error('Server error:', err);
    res.writeHead(500);
    res.end('Internal Server Error');
  }
});

// Server error handling
server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error('Port is already in use');
  } else {
    console.error('Server error:', err);
  }
});

server.listen(3000);
```

### Graceful Shutdown

```javascript
const http = require('http');

const server = http.createServer((req, res) => {
  res.end('Hello');
});

server.listen(3000);

// Graceful shutdown
function gracefulShutdown(signal) {
  console.log(`\n${signal} received, shutting down gracefully...`);
  
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
  
  // Force close after 10 seconds
  setTimeout(() => {
    console.error('Forced shutdown');
    process.exit(1);
  }, 10000);
}

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));
```

## 🎤 Interview Questions

### Q1: What is the http module in Node.js?
**Answer:** Built-in module for creating HTTP servers and making HTTP requests. No external dependencies needed. Foundation for frameworks like Express.

### Q2: Difference between http and https modules?
**Answer:**
- `http` - Unencrypted communication (port 80)
- `https` - Encrypted with TLS/SSL (port 443)
- Same API, different protocol
- https requires certificate and key

### Q3: What are request and response objects?
**Answer:**
- `req` (IncomingMessage) - Readable stream containing request data
- `res` (ServerResponse) - Writable stream for sending response
- Both implement EventEmitter

### Q4: How to handle POST data?
**Answer:**
```javascript
let body = '';
req.on('data', chunk => body += chunk.toString());
req.on('end', () => {
  const data = JSON.parse(body);
  // Process data
});
```
Always set size limits and handle parsing errors.

### Q5: What is res.writeHead() used for?
**Answer:** Sets status code and headers before sending response body.
```javascript
res.writeHead(200, {
  'Content-Type': 'application/json',
  'X-Custom-Header': 'value'
});
```
Must be called before `res.write()` or `res.end()`.

### Q6: Difference between res.write() and res.end()?
**Answer:**
- `res.write()` - Sends chunk of data, response remains open
- `res.end()` - Sends final data (optional) and closes response
- Must call `end()` or client waits forever

### Q7: How to implement routing without Express?
**Answer:**
```javascript
const url = require('url');

const parsedUrl = url.parse(req.url, true);
const pathname = parsedUrl.pathname;
const method = req.method;

if (pathname === '/users' && method === 'GET') {
  // Handle GET /users
} else if (pathname === '/users' && method === 'POST') {
  // Handle POST /users
}
```

### Q8: What are common HTTP status codes?
**Answer:**
- **2xx Success**: 200 OK, 201 Created, 204 No Content
- **3xx Redirect**: 301 Moved Permanently, 302 Found, 304 Not Modified
- **4xx Client Error**: 400 Bad Request, 401 Unauthorized, 403 Forbidden, 404 Not Found
- **5xx Server Error**: 500 Internal Server Error, 502 Bad Gateway, 503 Service Unavailable

### Q9: How to serve static files?
**Answer:**
```javascript
const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'public', req.url);
fs.createReadStream(filePath).pipe(res);
```
Better: Use `express.static()` middleware.

### Q10: How to handle graceful shutdown?
**Answer:**
```javascript
process.on('SIGTERM', () => {
  server.close(() => {
    // Close DB connections
    // Clean up resources
    process.exit(0);
  });
});
```

## 🎯 Best Practices

1. **Always set timeouts**
   ```javascript
   server.setTimeout(30000); // 30 seconds
   ```

2. **Limit request body size**
   ```javascript
   if (body.length > 1e6) req.socket.destroy();
   ```

3. **Use Express for production**
   ```javascript
   const express = require('express');
   const app = express();
   ```

4. **Set security headers**
   ```javascript
   res.setHeader('X-Content-Type-Options', 'nosniff');
   res.setHeader('X-Frame-Options', 'DENY');
   ```

5. **Handle errors properly**
   ```javascript
   server.on('error', handleError);
   req.on('error', handleError);
   res.on('error', handleError);
   ```

## 📚 Additional Resources

- [Node.js HTTP API](https://nodejs.org/api/http.html)
- [HTTP Status Codes](https://httpstatuses.com/)

---

[← Previous: File System](./05-file-system.md) | [Next: Express.js →](./07-express.md)
