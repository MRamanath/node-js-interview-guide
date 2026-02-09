/**
 * Real-Time Chat with WebSockets - Interview Favorite!
 * "Build a chat room with Socket.IO"
 */

const express = require('express');
const http = require('http');
const socketIO = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = socketIO(server);

app.use(express.static(path.join(__dirname, 'public')));

// In-memory data
const users = new Map(); // socketId -> user info
const messages = []; // Message history
const MAX_MESSAGES = 100;

// Socket.IO connection
io.on('connection', (socket) => {
  console.log(`New connection: ${socket.id}`);
  
  // User joins
  socket.on('join', (username) => {
    users.set(socket.id, {
      id: socket.id,
      username,
      joinedAt: new Date()
    });
    
    // Send message history
    socket.emit('history', messages);
    
    // Notify others
    socket.broadcast.emit('user-joined', {
      username,
      userCount: users.size,
      timestamp: new Date()
    });
    
    // Send updated user list
    io.emit('users', Array.from(users.values()));
    
    console.log(`${username} joined (total: ${users.size})`);
  });
  
  // Receive message
  socket.on('message', (text) => {
    const user = users.get(socket.id);
    if (!user) return;
    
    const message = {
      id: Date.now(),
      username: user.username,
      text,
      timestamp: new Date()
    };
    
    messages.push(message);
    if (messages.length > MAX_MESSAGES) {
      messages.shift();
    }
    
    // Broadcast to all clients
    io.emit('message', message);
    console.log(`${user.username}: ${text}`);
  });
  
  // Typing indicator
  socket.on('typing', (isTyping) => {
    const user = users.get(socket.id);
    if (!user) return;
    
    socket.broadcast.emit('user-typing', {
      username: user.username,
      isTyping
    });
  });
  
  // Private message
  socket.on('private-message', ({ to, text }) => {
    const sender = users.get(socket.id);
    if (!sender) return;
    
    const recipient = Array.from(users.entries())
      .find(([id, user]) => user.username === to);
    
    if (!recipient) {
      socket.emit('error', 'User not found');
      return;
    }
    
    const message = {
      from: sender.username,
      text,
      timestamp: new Date()
    };
    
    // Send to recipient
    io.to(recipient[0]).emit('private-message', message);
    
    // Confirm to sender
    socket.emit('private-message-sent', {
      to,
      text,
      timestamp: new Date()
    });
  });
  
  // User disconnects
  socket.on('disconnect', () => {
    const user = users.get(socket.id);
    if (user) {
      users.delete(socket.id);
      
      // Notify others
      io.emit('user-left', {
        username: user.username,
        userCount: users.size,
        timestamp: new Date()
      });
      
      // Send updated user list
      io.emit('users', Array.from(users.values()));
      
      console.log(`${user.username} left (total: ${users.size})`);
    }
  });
});

// REST API endpoints
app.get('/api/stats', (req, res) => {
  res.json({
    onlineUsers: users.size,
    totalMessages: messages.length,
    users: Array.from(users.values()).map(u => ({
      username: u.username,
      joinedAt: u.joinedAt
    }))
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Chat server running on http://localhost:${PORT}`);
  console.log('Open multiple browser tabs to test');
});

/* CLIENT HTML (save as public/index.html):
<!DOCTYPE html>
<html>
<head>
  <title>Chat Room</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: Arial, sans-serif; }
    #app { display: flex; height: 100vh; }
    #sidebar { width: 250px; background: #2c3e50; color: white; padding: 20px; }
    #main { flex: 1; display: flex; flex-direction: column; }
    #messages { flex: 1; overflow-y: auto; padding: 20px; background: #ecf0f1; }
    .message { margin: 10px 0; padding: 10px; background: white; border-radius: 5px; }
    .message .username { font-weight: bold; color: #3498db; }
    .message .time { font-size: 12px; color: #7f8c8d; }
    .system-message { text-align: center; color: #7f8c8d; font-style: italic; }
    #input-area { padding: 20px; border-top: 1px solid #bdc3c7; }
    #input-area input { width: 100%; padding: 10px; border: 1px solid #bdc3c7; border-radius: 5px; }
    .user-list { list-style: none; }
    .user-list li { padding: 5px 0; }
    .typing { font-size: 12px; color: #95a5a6; font-style: italic; }
  </style>
</head>
<body>
  <div id="app">
    <div id="sidebar">
      <h2>Online Users (<span id="user-count">0</span>)</h2>
      <ul id="user-list" class="user-list"></ul>
    </div>
    <div id="main">
      <div id="messages"></div>
      <div id="typing"></div>
      <div id="input-area">
        <input type="text" id="message-input" placeholder="Type a message..." />
      </div>
    </div>
  </div>

  <script src="/socket.io/socket.io.js"></script>
  <script>
    const socket = io();
    const username = prompt('Enter your username:') || 'Anonymous';
    
    socket.emit('join', username);
    
    // Display messages
    socket.on('history', (messages) => {
      messages.forEach(displayMessage);
    });
    
    socket.on('message', displayMessage);
    
    socket.on('user-joined', (data) => {
      addSystemMessage(`${data.username} joined the chat`);
    });
    
    socket.on('user-left', (data) => {
      addSystemMessage(`${data.username} left the chat`);
    });
    
    socket.on('users', (users) => {
      document.getElementById('user-count').textContent = users.length;
      const list = document.getElementById('user-list');
      list.innerHTML = users.map(u => `<li>${u.username}</li>`).join('');
    });
    
    socket.on('user-typing', (data) => {
      const typing = document.getElementById('typing');
      if (data.isTyping) {
        typing.textContent = `${data.username} is typing...`;
      } else {
        typing.textContent = '';
      }
    });
    
    // Send message
    const input = document.getElementById('message-input');
    let typingTimer;
    
    input.addEventListener('input', () => {
      socket.emit('typing', true);
      clearTimeout(typingTimer);
      typingTimer = setTimeout(() => socket.emit('typing', false), 1000);
    });
    
    input.addEventListener('keypress', (e) => {
      if (e.key === 'Enter' && input.value.trim()) {
        socket.emit('message', input.value.trim());
        input.value = '';
        socket.emit('typing', false);
      }
    });
    
    function displayMessage(msg) {
      const div = document.createElement('div');
      div.className = 'message';
      div.innerHTML = `
        <span class="username">${msg.username}</span>
        <span class="time">${new Date(msg.timestamp).toLocaleTimeString()}</span>
        <div>${msg.text}</div>
      `;
      document.getElementById('messages').appendChild(div);
      div.scrollIntoView({ behavior: 'smooth' });
    }
    
    function addSystemMessage(text) {
      const div = document.createElement('div');
      div.className = 'message system-message';
      div.textContent = text;
      document.getElementById('messages').appendChild(div);
    }
  </script>
</body>
</html>
*/

/* INTERVIEW CONCEPTS:
1. WebSocket bidirectional communication
2. Event-driven architecture
3. Broadcasting to multiple clients
4. Room management
5. Presence detection (online users)
6. Real-time typing indicators
7. Message history
8. Private messaging
*/
