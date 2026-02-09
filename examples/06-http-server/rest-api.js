/**
 * REST API with Node HTTP - Interview Question
 * "Build a RESTful API without frameworks"
 */

const http = require('http');
const url = require('url');

// In-memory database
let users = [
  { id: 1, name: 'Alice', email: 'alice@example.com', age: 30 },
  { id: 2, name: 'Bob', email: 'bob@example.com', age: 25 },
  { id: 3, name: 'Charlie', email: 'charlie@example.com', age: 35 }
];
let nextId = 4;

// Helper: Parse request body
function parseBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch (err) {
        reject(err);
      }
    });
    req.on('error', reject);
  });
}

// Helper: Send JSON response
function sendJSON(res, statusCode, data) {
  res.writeHead(statusCode, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(data));
}

// Helper: Send error
function sendError(res, statusCode, message) {
  sendJSON(res, statusCode, { error: message });
}

// Router
async function router(req, res) {
  const parsedUrl = url.parse(req.url, true);
  const pathname = parsedUrl.pathname;
  const method = req.method;
  
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }
  
  try {
    // GET /users - List all users
    if (pathname === '/users' && method === 'GET') {
      const { name, minAge } = parsedUrl.query;
      let filtered = users;
      
      if (name) {
        filtered = filtered.filter(u => 
          u.name.toLowerCase().includes(name.toLowerCase())
        );
      }
      
      if (minAge) {
        filtered = filtered.filter(u => u.age >= parseInt(minAge));
      }
      
      sendJSON(res, 200, {
        success: true,
        count: filtered.length,
        data: filtered
      });
    }
    
    // GET /users/:id - Get single user
    else if (pathname.match(/^\/users\/\d+$/) && method === 'GET') {
      const id = parseInt(pathname.split('/')[2]);
      const user = users.find(u => u.id === id);
      
      if (!user) {
        sendError(res, 404, 'User not found');
      } else {
        sendJSON(res, 200, { success: true, data: user });
      }
    }
    
    // POST /users - Create user
    else if (pathname === '/users' && method === 'POST') {
      const body = await parseBody(req);
      
      // Validation
      if (!body.name || !body.email) {
        sendError(res, 400, 'Name and email are required');
        return;
      }
      
      // Check duplicate email
      if (users.find(u => u.email === body.email)) {
        sendError(res, 409, 'Email already exists');
        return;
      }
      
      const newUser = {
        id: nextId++,
        name: body.name,
        email: body.email,
        age: body.age || 0
      };
      
      users.push(newUser);
      sendJSON(res, 201, { success: true, data: newUser });
    }
    
    // PUT /users/:id - Update user
    else if (pathname.match(/^\/users\/\d+$/) && method === 'PUT') {
      const id = parseInt(pathname.split('/')[2]);
      const userIndex = users.findIndex(u => u.id === id);
      
      if (userIndex === -1) {
        sendError(res, 404, 'User not found');
        return;
      }
      
      const body = await parseBody(req);
      const updatedUser = { ...users[userIndex], ...body, id };
      users[userIndex] = updatedUser;
      
      sendJSON(res, 200, { success: true, data: updatedUser });
    }
    
    // DELETE /users/:id - Delete user
    else if (pathname.match(/^\/users\/\d+$/) && method === 'DELETE') {
      const id = parseInt(pathname.split('/')[2]);
      const userIndex = users.findIndex(u => u.id === id);
      
      if (userIndex === -1) {
        sendError(res, 404, 'User not found');
        return;
      }
      
      const deleted = users.splice(userIndex, 1)[0];
      sendJSON(res, 200, { success: true, data: deleted });
    }
    
    // 404 - Not found
    else {
      sendError(res, 404, 'Route not found');
    }
    
  } catch (err) {
    console.error('Server error:', err);
    sendError(res, 500, 'Internal server error');
  }
}

const server = http.createServer(router);

const PORT = 3000;
server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log('\nAvailable endpoints:');
  console.log('GET    /users           - List all users');
  console.log('GET    /users?name=Alice - Search users');
  console.log('GET    /users/:id       - Get user by ID');
  console.log('POST   /users           - Create user');
  console.log('PUT    /users/:id       - Update user');
  console.log('DELETE /users/:id       - Delete user');
  console.log('\nTest commands:');
  console.log('curl http://localhost:3000/users');
  console.log('curl -X POST http://localhost:3000/users -H "Content-Type: application/json" -d \'{"name":"Dave","email":"dave@example.com","age":28}\'');
  console.log('curl -X PUT http://localhost:3000/users/1 -H "Content-Type: application/json" -d \'{"age":31}\'');
  console.log('curl -X DELETE http://localhost:3000/users/1');
});

/* INTERVIEW TAKEAWAYS:
1. Parse URL and query parameters
2. Handle different HTTP methods
3. Parse JSON request body
4. Validate input data
5. Handle errors properly
6. Use proper status codes
7. Enable CORS for browser access
*/
