# 21. WebSockets

## 📚 Overview

WebSockets provide full-duplex communication channels over a single TCP connection, enabling real-time, bidirectional communication between clients and servers. Perfect for chat apps, live updates, gaming, and collaborative tools.

## 🎯 Key Concepts

### WebSocket vs HTTP

```
HTTP:
- Request/response
- Unidirectional
- New connection each request
- Overhead (headers)

WebSocket:
- Persistent connection
- Bidirectional
- Real-time
- Low overhead
- Upgrade from HTTP
```

## 💻 Examples

### Basic WebSocket Server (ws library)

```javascript
const WebSocket = require('ws');

const wss = new WebSocket.Server({ port: 8080 });

wss.on('connection', (ws) => {
  console.log('Client connected');
  
  // Send message to client
  ws.send('Welcome to the WebSocket server!');
  
  // Receive message from client
  ws.on('message', (message) => {
    console.log('Received:', message);
    
    // Echo back
    ws.send(`Server received: ${message}`);
  });
  
  // Handle disconnection
  ws.on('close', () => {
    console.log('Client disconnected');
  });
  
  // Handle errors
  ws.on('error', (error) => {
    console.error('WebSocket error:', error);
  });
});

console.log('WebSocket server running on ws://localhost:8080');
```

### WebSocket Client

```javascript
const WebSocket = require('ws');

const ws = new WebSocket('ws://localhost:8080');

ws.on('open', () => {
  console.log('Connected to server');
  ws.send('Hello Server!');
});

ws.on('message', (data) => {
  console.log('Received:', data.toString());
});

ws.on('close', () => {
  console.log('Disconnected from server');
});

ws.on('error', (error) => {
  console.error('Error:', error);
});
```

### Socket.IO Server

```javascript
const express = require('express');
const http = require('http');
const socketIO = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = socketIO(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

// Serve static files
app.use(express.static('public'));

// Connection handling
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);
  
  // Listen for custom events
  socket.on('chat message', (msg) => {
    console.log('Message:', msg);
    
    // Broadcast to all clients
    io.emit('chat message', msg);
  });
  
  // Join room
  socket.on('join room', (room) => {
    socket.join(room);
    socket.emit('joined', room);
    socket.to(room).emit('user joined', socket.id);
  });
  
  // Leave room
  socket.on('leave room', (room) => {
    socket.leave(room);
    socket.to(room).emit('user left', socket.id);
  });
  
  // Private message
  socket.on('private message', ({ to, message }) => {
    socket.to(to).emit('private message', {
      from: socket.id,
      message
    });
  });
  
  // Disconnect
  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

server.listen(3000, () => {
  console.log('Server running on http://localhost:3000');
});
```

### Socket.IO Client (Browser)

```html
<!DOCTYPE html>
<html>
<head>
  <title>Socket.IO Chat</title>
</head>
<body>
  <ul id="messages"></ul>
  <form id="form">
    <input id="input" autocomplete="off" />
    <button>Send</button>
  </form>

  <script src="/socket.io/socket.io.js"></script>
  <script>
    const socket = io();
    
    const form = document.getElementById('form');
    const input = document.getElementById('input');
    const messages = document.getElementById('messages');
    
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      if (input.value) {
        socket.emit('chat message', input.value);
        input.value = '';
      }
    });
    
    socket.on('chat message', (msg) => {
      const item = document.createElement('li');
      item.textContent = msg;
      messages.appendChild(item);
      window.scrollTo(0, document.body.scrollHeight);
    });
    
    socket.on('connect', () => {
      console.log('Connected:', socket.id);
    });
    
    socket.on('disconnect', () => {
      console.log('Disconnected');
    });
  </script>
</body>
</html>
```

### Chat Application

```javascript
const express = require('express');
const http = require('http');
const socketIO = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = socketIO(server);

// Store users
const users = new Map();

io.on('connection', (socket) => {
  // User joins
  socket.on('join', (username) => {
    users.set(socket.id, username);
    
    // Notify everyone
    io.emit('user joined', {
      id: socket.id,
      username,
      userCount: users.size
    });
    
    // Send existing users
    socket.emit('users', Array.from(users.entries()).map(([id, name]) => ({
      id,
      username: name
    })));
  });
  
  // New message
  socket.on('message', (text) => {
    const username = users.get(socket.id);
    
    io.emit('message', {
      id: Date.now(),
      username,
      text,
      timestamp: new Date()
    });
  });
  
  // Typing indicator
  socket.on('typing', () => {
    const username = users.get(socket.id);
    socket.broadcast.emit('typing', { username });
  });
  
  socket.on('stop typing', () => {
    const username = users.get(socket.id);
    socket.broadcast.emit('stop typing', { username });
  });
  
  // Disconnect
  socket.on('disconnect', () => {
    const username = users.get(socket.id);
    users.delete(socket.id);
    
    io.emit('user left', {
      username,
      userCount: users.size
    });
  });
});

server.listen(3000);
```

### Rooms and Namespaces

```javascript
// Namespaces
const chat = io.of('/chat');
const admin = io.of('/admin');

chat.on('connection', (socket) => {
  console.log('Chat connection');
  
  socket.on('message', (msg) => {
    chat.emit('message', msg);
  });
});

admin.on('connection', (socket) => {
  console.log('Admin connection');
  
  socket.on('broadcast', (msg) => {
    // Broadcast to all namespaces
    io.emit('announcement', msg);
  });
});

// Rooms
io.on('connection', (socket) => {
  // Join room
  socket.on('join', (room) => {
    socket.join(room);
    
    // Message to room
    io.to(room).emit('user joined', socket.id);
  });
  
  // Room message
  socket.on('room message', ({ room, message }) => {
    io.to(room).emit('message', {
      room,
      from: socket.id,
      message
    });
  });
  
  // Leave room
  socket.on('leave', (room) => {
    socket.leave(room);
    io.to(room).emit('user left', socket.id);
  });
  
  // Get rooms
  console.log(socket.rooms); // Set of rooms socket is in
});
```

### Broadcasting

```javascript
io.on('connection', (socket) => {
  // Send to all clients
  io.emit('event', data);
  
  // Send to all except sender
  socket.broadcast.emit('event', data);
  
  // Send to specific room
  io.to('room1').emit('event', data);
  
  // Send to multiple rooms
  io.to('room1').to('room2').emit('event', data);
  
  // Send to all in room except sender
  socket.to('room1').emit('event', data);
  
  // Send to specific socket
  io.to(socketId).emit('event', data);
  
  // Volatile (ok if not received)
  socket.volatile.emit('event', data);
  
  // With acknowledgment
  socket.emit('event', data, (response) => {
    console.log('Client acknowledged:', response);
  });
});
```

### Authentication

```javascript
const jwt = require('jsonwebtoken');

// Middleware
io.use((socket, next) => {
  const token = socket.handshake.auth.token;
  
  if (!token) {
    return next(new Error('Authentication error'));
  }
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    socket.userId = decoded.userId;
    next();
  } catch (error) {
    next(new Error('Invalid token'));
  }
});

io.on('connection', (socket) => {
  console.log('Authenticated user:', socket.userId);
  
  // Access userId in events
  socket.on('message', (msg) => {
    const userId = socket.userId;
    // Process message
  });
});

// Client side
const socket = io({
  auth: {
    token: 'your-jwt-token'
  }
});

// Handle auth errors
socket.on('connect_error', (error) => {
  console.error('Connection error:', error.message);
});
```

### Real-time Notifications

```javascript
const notificationService = {
  async sendNotification(userId, notification) {
    // Save to database
    await Notification.create({
      userId,
      ...notification
    });
    
    // Send via WebSocket
    const userSocket = await this.getUserSocket(userId);
    if (userSocket) {
      userSocket.emit('notification', notification);
    }
  },
  
  getUserSocket(userId) {
    // Find socket by userId
    const sockets = io.sockets.sockets;
    for (const [id, socket] of sockets) {
      if (socket.userId === userId) {
        return socket;
      }
    }
    return null;
  }
};

// Usage
app.post('/posts', async (req, res) => {
  const post = await Post.create(req.body);
  
  // Notify followers
  const followers = await User.find({ following: req.userId });
  
  for (const follower of followers) {
    await notificationService.sendNotification(follower._id, {
      type: 'new_post',
      message: 'New post from someone you follow',
      postId: post._id
    });
  }
  
  res.json(post);
});
```

### Live Updates

```javascript
// Server
const liveUpdateService = {
  async updateDocument(docId, changes) {
    // Save to database
    await Document.findByIdAndUpdate(docId, changes);
    
    // Broadcast to room
    io.to(`doc:${docId}`).emit('document updated', {
      docId,
      changes
    });
  }
};

io.on('connection', (socket) => {
  // Subscribe to document
  socket.on('subscribe document', (docId) => {
    socket.join(`doc:${docId}`);
    
    // Send current state
    Document.findById(docId).then(doc => {
      socket.emit('document state', doc);
    });
  });
  
  // Update document
  socket.on('update document', async ({ docId, changes }) => {
    await liveUpdateService.updateDocument(docId, changes);
  });
  
  // Unsubscribe
  socket.on('unsubscribe document', (docId) => {
    socket.leave(`doc:${docId}`);
  });
});
```

### Heartbeat/Ping-Pong

```javascript
// Server
io.on('connection', (socket) => {
  socket.isAlive = true;
  
  socket.on('pong', () => {
    socket.isAlive = true;
  });
});

// Check every 30 seconds
setInterval(() => {
  io.sockets.sockets.forEach((socket) => {
    if (!socket.isAlive) {
      return socket.disconnect();
    }
    
    socket.isAlive = false;
    socket.emit('ping');
  });
}, 30000);

// Client
socket.on('ping', () => {
  socket.emit('pong');
});
```

### Error Handling

```javascript
io.on('connection', (socket) => {
  socket.on('error', (error) => {
    console.error('Socket error:', error);
  });
  
  socket.on('disconnect', (reason) => {
    console.log('Disconnected:', reason);
    
    if (reason === 'io server disconnect') {
      // Server disconnected, try to reconnect
      socket.connect();
    }
  });
});

// Client reconnection
const socket = io({
  reconnection: true,
  reconnectionDelay: 1000,
  reconnectionDelayMax: 5000,
  reconnectionAttempts: 5
});

socket.on('reconnect', (attemptNumber) => {
  console.log('Reconnected after', attemptNumber, 'attempts');
});

socket.on('reconnect_failed', () => {
  console.error('Failed to reconnect');
});
```

## 🎤 Interview Questions

### Q1: What is the difference between WebSocket and HTTP?
**Answer:** WebSocket is persistent, bidirectional, real-time. HTTP is request/response, unidirectional, with higher overhead.

### Q2: What is Socket.IO?
**Answer:** Library built on WebSocket providing fallbacks (polling), rooms, namespaces, reconnection, and easier API.

### Q3: How do WebSocket rooms work?
**Answer:** Logical groups for broadcasting. Sockets can join/leave rooms. Messages sent to room reach all members.

### Q4: What are namespaces?
**Answer:** Separate communication channels on same connection. Each namespace has its own events and rooms.

### Q5: How to implement authentication?
**Answer:** Middleware checking JWT token in handshake. Store userId in socket for authorization.

### Q6: What is broadcasting?
**Answer:** Sending message to multiple clients. Can broadcast to all, room, or all except sender.

### Q7: How to handle disconnections?
**Answer:** Listen to 'disconnect' event. Clean up resources, notify other users, handle reconnection.

### Q8: What is the difference between emit and broadcast?
**Answer:**
- **emit**: Send to specific socket(s)
- **broadcast**: Send to all except sender

### Q9: How to scale WebSocket servers?
**Answer:** Use Redis adapter for Socket.IO to share state across multiple servers. Load balancer with sticky sessions.

### Q10: What is volatile emit?
**Answer:** Message that's ok to lose if client not ready. Used for real-time data where latest value matters most.

## 🎯 Best Practices

1. **Use rooms for organization**
   ```javascript
   socket.join('room1');
   io.to('room1').emit('event', data);
   ```

2. **Implement authentication**
   ```javascript
   io.use(authMiddleware);
   ```

3. **Handle disconnections gracefully**
   ```javascript
   socket.on('disconnect', cleanup);
   ```

4. **Use namespaces for separation**
   ```javascript
   const chat = io.of('/chat');
   ```

5. **Implement reconnection logic**
   ```javascript
   const socket = io({ reconnection: true });
   ```

## 📚 Additional Resources

- [Socket.IO Documentation](https://socket.io/docs/)
- [ws Library](https://github.com/websockets/ws)
- [WebSocket MDN](https://developer.mozilla.org/en-US/docs/Web/API/WebSocket)

---

[← Previous: Performance](./20-performance.md) | [Next: GraphQL →](./22-graphql.md)
