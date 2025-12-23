# 09. Async Patterns

## 📚 Overview

Asynchronous programming is fundamental to Node.js. Understanding callbacks, promises, and async/await is essential for writing efficient, non-blocking code.

## 🎯 Key Concepts

### Evolution of Async in Node.js

```
Callbacks → Promises → Async/Await → Async Generators
(2009)      (ES6 2015)  (ES2017)      (ES2018)
```

## 💻 Examples

### Callbacks

```javascript
const fs = require('fs');

// Basic callback pattern
fs.readFile('file.txt', 'utf8', (err, data) => {
  if (err) {
    console.error('Error:', err);
    return;
  }
  console.log('Data:', data);
});

// Callback Hell (Pyramid of Doom)
fs.readFile('file1.txt', 'utf8', (err1, data1) => {
  if (err1) return console.error(err1);
  
  fs.readFile('file2.txt', 'utf8', (err2, data2) => {
    if (err2) return console.error(err2);
    
    fs.readFile('file3.txt', 'utf8', (err3, data3) => {
      if (err3) return console.error(err3);
      
      console.log(data1, data2, data3);
    });
  });
});

// Error-first callback convention
function asyncOperation(param, callback) {
  setTimeout(() => {
    if (param) {
      callback(null, 'Success'); // (error, result)
    } else {
      callback(new Error('Failed'));
    }
  }, 1000);
}

asyncOperation(true, (err, result) => {
  if (err) {
    console.error(err);
  } else {
    console.log(result);
  }
});
```

### Promises

```javascript
const fs = require('fs').promises;

// Basic promise
fs.readFile('file.txt', 'utf8')
  .then(data => {
    console.log(data);
    return fs.readFile('file2.txt', 'utf8');
  })
  .then(data2 => {
    console.log(data2);
  })
  .catch(err => {
    console.error('Error:', err);
  })
  .finally(() => {
    console.log('Cleanup');
  });

// Creating promises
function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function asyncOperation(value) {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      if (value) {
        resolve('Success');
      } else {
        reject(new Error('Failed'));
      }
    }, 1000);
  });
}

// Using promises
asyncOperation(true)
  .then(result => console.log(result))
  .catch(err => console.error(err));

// Promise chaining
getUserById(123)
  .then(user => getPostsByUser(user.id))
  .then(posts => getCommentsByPost(posts[0].id))
  .then(comments => console.log(comments))
  .catch(err => console.error(err));

// Returning promises in chains
function getUser(id) {
  return db.query('SELECT * FROM users WHERE id = ?', [id])
    .then(rows => rows[0]);
}

function getUserWithPosts(id) {
  let user;
  return getUser(id)
    .then(u => {
      user = u;
      return db.query('SELECT * FROM posts WHERE user_id = ?', [id]);
    })
    .then(posts => {
      user.posts = posts;
      return user;
    });
}
```

### Async/Await

```javascript
// Basic async/await
async function readFiles() {
  try {
    const data1 = await fs.readFile('file1.txt', 'utf8');
    const data2 = await fs.readFile('file2.txt', 'utf8');
    const data3 = await fs.readFile('file3.txt', 'utf8');
    
    console.log(data1, data2, data3);
  } catch (err) {
    console.error('Error:', err);
  }
}

// Async function always returns a promise
async function getData() {
  return 'Hello'; // Automatically wrapped in Promise.resolve()
}

getData().then(result => console.log(result)); // "Hello"

// Error handling
async function fetchUser(id) {
  try {
    const response = await fetch(`/api/users/${id}`);
    
    if (!response.ok) {
      throw new Error(`HTTP error: ${response.status}`);
    }
    
    const user = await response.json();
    return user;
  } catch (err) {
    console.error('Failed to fetch user:', err);
    throw err; // Re-throw to caller
  }
}

// Multiple awaits (sequential)
async function sequential() {
  const user = await getUser(123);       // Wait 1s
  const posts = await getPosts(user.id); // Wait 1s
  const comments = await getComments();  // Wait 1s
  // Total: 3 seconds
  return { user, posts, comments };
}

// Parallel execution with Promise.all
async function parallel() {
  const [user, posts, comments] = await Promise.all([
    getUser(123),
    getPosts(456),
    getComments()
  ]);
  // Total: 1 second (all run simultaneously)
  return { user, posts, comments };
}

// Async IIFE (Immediately Invoked Function Expression)
(async () => {
  const data = await fetchData();
  console.log(data);
})();

// Top-level await (ES2022, Node.js 14.8+)
const data = await fetchData();
console.log(data);
```

### Promise Combinators

```javascript
// Promise.all - Wait for all to complete
async function getAllData() {
  try {
    const [users, posts, comments] = await Promise.all([
      fetchUsers(),
      fetchPosts(),
      fetchComments()
    ]);
    
    return { users, posts, comments };
  } catch (err) {
    // Fails if ANY promise rejects
    console.error('At least one request failed:', err);
  }
}

// Promise.allSettled - Wait for all, get all results
async function getAllResults() {
  const results = await Promise.allSettled([
    fetchUsers(),
    fetchPosts(),
    fetchComments()
  ]);
  
  results.forEach((result, index) => {
    if (result.status === 'fulfilled') {
      console.log(`Request ${index} succeeded:`, result.value);
    } else {
      console.log(`Request ${index} failed:`, result.reason);
    }
  });
  
  return results;
}

// Promise.race - First to complete
async function getFirstResponse() {
  const fastest = await Promise.race([
    fetchFromServer1(),
    fetchFromServer2(),
    fetchFromServer3()
  ]);
  
  return fastest; // Returns first resolved OR rejected
}

// Timeout pattern with Promise.race
function timeout(ms) {
  return new Promise((_, reject) => 
    setTimeout(() => reject(new Error('Timeout')), ms)
  );
}

async function fetchWithTimeout(url, ms = 5000) {
  return Promise.race([
    fetch(url),
    timeout(ms)
  ]);
}

// Promise.any - First successful result (ES2021)
async function getFirstSuccess() {
  try {
    const first = await Promise.any([
      fetchFromServer1(),
      fetchFromServer2(),
      fetchFromServer3()
    ]);
    
    return first; // First fulfilled promise
  } catch (err) {
    // Only fails if ALL promises reject
    console.error('All requests failed');
  }
}
```

### Error Handling Patterns

```javascript
// Try-catch with async/await
async function handleErrors() {
  try {
    const data = await riskyOperation();
    return data;
  } catch (err) {
    if (err.code === 'ENOENT') {
      console.log('File not found');
    } else if (err.name === 'ValidationError') {
      console.log('Validation failed');
    } else {
      console.error('Unexpected error:', err);
    }
    throw err; // Re-throw if needed
  }
}

// Catch specific errors
async function specificErrors() {
  try {
    await operation();
  } catch (err) {
    if (err instanceof ValidationError) {
      // Handle validation error
    } else if (err instanceof NetworkError) {
      // Handle network error
    } else {
      throw err; // Pass to outer handler
    }
  }
}

// Finally for cleanup
async function withCleanup() {
  const connection = await getConnection();
  try {
    const result = await connection.query('SELECT * FROM users');
    return result;
  } catch (err) {
    console.error('Query failed:', err);
    throw err;
  } finally {
    await connection.close(); // Always cleanup
  }
}

// Promise error handling
fetch('/api/data')
  .then(response => response.json())
  .then(data => processData(data))
  .catch(err => {
    // Catches errors from any step
    console.error('Error:', err);
  });

// Unhandled promise rejection
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  // In production: log and potentially exit
  process.exit(1);
});
```

### Promisify Pattern

```javascript
const { promisify } = require('util');
const fs = require('fs');

// Convert callback to promise
const readFile = promisify(fs.readFile);
const writeFile = promisify(fs.writeFile);

async function example() {
  const data = await readFile('file.txt', 'utf8');
  await writeFile('output.txt', data);
}

// Manual promisify
function promisifyManual(fn) {
  return function(...args) {
    return new Promise((resolve, reject) => {
      fn(...args, (err, result) => {
        if (err) reject(err);
        else resolve(result);
      });
    });
  };
}

const readFileAsync = promisifyManual(fs.readFile);

// Promisify with context
function promisifyWithContext(fn, context) {
  return function(...args) {
    return new Promise((resolve, reject) => {
      fn.call(context, ...args, (err, result) => {
        if (err) reject(err);
        else resolve(result);
      });
    });
  };
}
```

### Async Control Flow

```javascript
// Sequential execution
async function sequential(items) {
  const results = [];
  
  for (const item of items) {
    const result = await processItem(item);
    results.push(result);
  }
  
  return results;
}

// Parallel execution
async function parallel(items) {
  const promises = items.map(item => processItem(item));
  return Promise.all(promises);
}

// Controlled concurrency
async function concurrency(items, limit) {
  const results = [];
  const executing = [];
  
  for (const item of items) {
    const promise = processItem(item).then(result => {
      executing.splice(executing.indexOf(promise), 1);
      return result;
    });
    
    results.push(promise);
    executing.push(promise);
    
    if (executing.length >= limit) {
      await Promise.race(executing);
    }
  }
  
  return Promise.all(results);
}

// Using p-limit library
const pLimit = require('p-limit');
const limit = pLimit(3); // Max 3 concurrent

const input = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

const promises = input.map(i => limit(() => processItem(i)));
const results = await Promise.all(promises);

// Batching
async function processBatches(items, batchSize) {
  const results = [];
  
  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize);
    const batchResults = await Promise.all(
      batch.map(item => processItem(item))
    );
    results.push(...batchResults);
  }
  
  return results;
}
```

### Async Iterators

```javascript
// Async generator
async function* asyncGenerator() {
  yield await fetchPage(1);
  yield await fetchPage(2);
  yield await fetchPage(3);
}

// Using async iterator
for await (const page of asyncGenerator()) {
  console.log(page);
}

// Async iterable
const asyncIterable = {
  async *[Symbol.asyncIterator]() {
    for (let i = 1; i <= 5; i++) {
      await delay(1000);
      yield i;
    }
  }
};

for await (const num of asyncIterable) {
  console.log(num); // 1, 2, 3, 4, 5 (one per second)
}

// Paginated API with async generator
async function* fetchAllPages(apiUrl) {
  let page = 1;
  let hasMore = true;
  
  while (hasMore) {
    const response = await fetch(`${apiUrl}?page=${page}`);
    const data = await response.json();
    
    yield data.items;
    
    hasMore = data.hasNextPage;
    page++;
  }
}

// Usage
for await (const items of fetchAllPages('/api/users')) {
  items.forEach(item => console.log(item));
}
```

### Retry Pattern

```javascript
// Simple retry
async function retry(fn, maxAttempts = 3) {
  let lastError;
  
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastError = err;
      console.log(`Attempt ${attempt} failed:`, err.message);
      
      if (attempt < maxAttempts) {
        await delay(1000 * attempt); // Exponential backoff
      }
    }
  }
  
  throw lastError;
}

// Usage
const data = await retry(() => fetchData('/api/data'));

// Retry with exponential backoff
async function retryWithBackoff(fn, maxAttempts = 5, initialDelay = 1000) {
  let delay = initialDelay;
  
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (err) {
      if (attempt === maxAttempts) throw err;
      
      console.log(`Attempt ${attempt} failed, retrying in ${delay}ms...`);
      await new Promise(resolve => setTimeout(resolve, delay));
      delay *= 2; // Exponential backoff
    }
  }
}

// Conditional retry
async function retryConditional(fn, shouldRetry, maxAttempts = 3) {
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (err) {
      if (attempt === maxAttempts || !shouldRetry(err)) {
        throw err;
      }
      await delay(1000 * attempt);
    }
  }
}

// Usage
await retryConditional(
  () => fetchData(),
  (err) => err.statusCode >= 500 // Only retry server errors
);
```

## 🎤 Interview Questions

### Q1: What is callback hell?
**Answer:** Nested callbacks creating hard-to-read pyramid-shaped code. Solved by promises or async/await.

### Q2: Difference between Promise and async/await?
**Answer:**
- Promises: `.then()` chaining
- Async/await: Syntactic sugar over promises, looks synchronous
- Both are non-blocking
- Async/await has better error handling with try-catch

### Q3: What does Promise.all() do?
**Answer:** Waits for all promises to resolve. Returns array of results. Rejects immediately if any promise rejects.

### Q4: Difference between Promise.all() and Promise.allSettled()?
**Answer:**
- `Promise.all()`: Fails fast, rejects if any rejects
- `Promise.allSettled()`: Waits for all, returns all results (fulfilled or rejected)

### Q5: What is Promise.race()?
**Answer:** Returns first settled promise (fulfilled or rejected). Useful for timeouts and fallbacks.

### Q6: How to handle errors in async/await?
**Answer:**
```javascript
async function example() {
  try {
    const data = await fetchData();
    return data;
  } catch (err) {
    console.error(err);
    throw err;
  }
}
```

### Q7: What is the promisify utility?
**Answer:** Converts callback-based functions to promise-based:
```javascript
const { promisify } = require('util');
const readFile = promisify(fs.readFile);
```

### Q8: Can you use await outside async function?
**Answer:** Yes, in ES2022+ with top-level await (in modules). Otherwise, must be inside async function.

### Q9: What happens if you don't await a promise?
**Answer:** Promise executes but you don't wait for result. Can cause race conditions or unhandled rejections.

### Q10: How to run promises in parallel vs sequential?
**Answer:**
```javascript
// Sequential (3 seconds)
const a = await fetch1();
const b = await fetch2();
const c = await fetch3();

// Parallel (1 second)
const [a, b, c] = await Promise.all([fetch1(), fetch2(), fetch3()]);
```

## 🎯 Best Practices

1. **Always handle promise rejections**
   ```javascript
   process.on('unhandledRejection', (err) => {
     console.error('Unhandled rejection:', err);
     process.exit(1);
   });
   ```

2. **Use Promise.all for parallel operations**
   ```javascript
   const [users, posts] = await Promise.all([fetchUsers(), fetchPosts()]);
   ```

3. **Implement timeouts**
   ```javascript
   const data = await Promise.race([
     fetchData(),
     timeout(5000)
   ]);
   ```

4. **Use try-catch-finally**
   ```javascript
   try {
     await operation();
   } catch (err) {
     handleError(err);
   } finally {
     cleanup();
   }
   ```

5. **Don't mix callbacks and promises**
   ```javascript
   // BAD
   async function bad() {
     fs.readFile('file', (err, data) => {}); // Callback
     await otherOp(); // Promise
   }
   
   // GOOD
   async function good() {
     await fs.promises.readFile('file');
     await otherOp();
   }
   ```

## 📚 Additional Resources

- [MDN: Promises](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise)
- [MDN: async/await](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/async_function)

---

[← Previous: Middleware](./08-middleware.md) | [Next: Events →](./10-events.md)
