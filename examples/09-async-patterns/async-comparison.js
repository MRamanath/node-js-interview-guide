/**
 * Async Patterns - Interview Questions
 * "Compare callbacks, promises, and async/await"
 */

// Simulated async operations
function delay(ms, value) {
  return new Promise(resolve => setTimeout(() => resolve(value), ms));
}

function randomDelay(value) {
  return delay(Math.random() * 1000, value);
}

console.log('=== 1. CALLBACKS (Old Way) ===\n');

// Callback Hell
function callbackExample() {
  console.log('Starting callback chain...');
  
  setTimeout(() => {
    console.log('Step 1 complete');
    
    setTimeout(() => {
      console.log('Step 2 complete');
      
      setTimeout(() => {
        console.log('Step 3 complete');
        console.log('All steps done!\n');
        promiseExample();
      }, 500);
    }, 500);
  }, 500);
}

console.log('=== 2. PROMISES (Better) ===\n');

function promiseExample() {
  console.log('Starting promise chain...');
  
  delay(500, 'Step 1')
    .then(result => {
      console.log(result, 'complete');
      return delay(500, 'Step 2');
    })
    .then(result => {
      console.log(result, 'complete');
      return delay(500, 'Step 3');
    })
    .then(result => {
      console.log(result, 'complete');
      console.log('All steps done!\n');
      asyncAwaitExample();
    })
    .catch(err => console.error('Error:', err));
}

console.log('=== 3. ASYNC/AWAIT (Best) ===\n');

async function asyncAwaitExample() {
  try {
    console.log('Starting async/await...');
    
    const step1 = await delay(500, 'Step 1');
    console.log(step1, 'complete');
    
    const step2 = await delay(500, 'Step 2');
    console.log(step2, 'complete');
    
    const step3 = await delay(500, 'Step 3');
    console.log(step3, 'complete');
    
    console.log('All steps done!\n');
    parallelExample();
  } catch (err) {
    console.error('Error:', err);
  }
}

console.log('=== 4. PARALLEL EXECUTION ===\n');

async function parallelExample() {
  console.log('Sequential (slow):');
  const start1 = Date.now();
  
  await delay(500, 'Task 1');
  await delay(500, 'Task 2');
  await delay(500, 'Task 3');
  
  console.log('Sequential time:', Date.now() - start1, 'ms\n');
  
  console.log('Parallel (fast):');
  const start2 = Date.now();
  
  await Promise.all([
    delay(500, 'Task 1'),
    delay(500, 'Task 2'),
    delay(500, 'Task 3')
  ]);
  
  console.log('Parallel time:', Date.now() - start2, 'ms\n');
  
  promiseMethodsExample();
}

console.log('=== 5. PROMISE METHODS ===\n');

async function promiseMethodsExample() {
  // Promise.all - Wait for all (fails if any fails)
  try {
    console.log('Promise.all:');
    const results = await Promise.all([
      randomDelay('A'),
      randomDelay('B'),
      randomDelay('C')
    ]);
    console.log('All results:', results);
  } catch (err) {
    console.log('Failed:', err);
  }
  
  // Promise.race - First to complete wins
  console.log('\nPromise.race:');
  const winner = await Promise.race([
    randomDelay('Fast'),
    randomDelay('Medium'),
    randomDelay('Slow')
  ]);
  console.log('Winner:', winner);
  
  // Promise.allSettled - Wait for all (never fails)
  console.log('\nPromise.allSettled:');
  const settled = await Promise.allSettled([
    Promise.resolve('Success'),
    Promise.reject('Error'),
    randomDelay('Done')
  ]);
  console.log('All settled:', settled);
  
  // Promise.any - First successful result
  console.log('\nPromise.any:');
  const any = await Promise.any([
    delay(800, 'Slow success'),
    delay(200, 'Fast success'),
    Promise.reject('Fast failure')
  ]);
  console.log('First success:', any);
  
  console.log('\n');
  errorHandlingExample();
}

console.log('=== 6. ERROR HANDLING ===\n');

async function errorHandlingExample() {
  // Try/catch
  try {
    console.log('Try/catch:');
    await Promise.reject('Error occurred!');
  } catch (err) {
    console.log('Caught:', err);
  }
  
  // Multiple try/catch
  try {
    console.log('\nMultiple operations:');
    const result1 = await delay(200, 'Success 1');
    console.log(result1);
    
    // This will throw
    throw new Error('Intentional error');
    
    // This won't execute
    const result2 = await delay(200, 'Success 2');
    console.log(result2);
  } catch (err) {
    console.log('Error caught:', err.message);
  }
  
  // Finally
  try {
    console.log('\nWith finally:');
    await delay(200, 'Operation');
  } catch (err) {
    console.log('Error:', err);
  } finally {
    console.log('Finally always runs (cleanup here)');
  }
  
  console.log('\n');
  realWorldExample();
}

console.log('=== 7. REAL-WORLD EXAMPLE ===\n');

// Simulated API calls
async function fetchUser(id) {
  await delay(300);
  return { id, name: `User${id}`, email: `user${id}@example.com` };
}

async function fetchPosts(userId) {
  await delay(400);
  return [
    { id: 1, userId, title: 'Post 1' },
    { id: 2, userId, title: 'Post 2' }
  ];
}

async function fetchComments(postId) {
  await delay(200);
  return [
    { id: 1, postId, text: 'Comment 1' },
    { id: 2, postId, text: 'Comment 2' }
  ];
}

async function realWorldExample() {
  try {
    console.log('Fetching user data...');
    const start = Date.now();
    
    // Sequential (slower)
    const user = await fetchUser(1);
    console.log('User:', user.name);
    
    const posts = await fetchPosts(user.id);
    console.log('Posts:', posts.length);
    
    const comments = await Promise.all(
      posts.map(post => fetchComments(post.id))
    );
    console.log('Comments:', comments.flat().length);
    
    console.log('Time:', Date.now() - start, 'ms');
    
    console.log('\nOptimized version:');
    const start2 = Date.now();
    
    // Parallel where possible
    const [user2, posts2] = await Promise.all([
      fetchUser(1),
      fetchPosts(1) // Can fetch in parallel if we know ID
    ]);
    
    const comments2 = await Promise.all(
      posts2.map(post => fetchComments(post.id))
    );
    
    console.log('User:', user2.name);
    console.log('Posts:', posts2.length);
    console.log('Comments:', comments2.flat().length);
    console.log('Time:', Date.now() - start2, 'ms (faster!)');
    
  } catch (err) {
    console.error('Error:', err);
  }
}

// Start the examples
callbackExample();

/* INTERVIEW TAKEAWAYS:
1. Async/await is cleaner than callbacks and promises
2. Use Promise.all for parallel operations
3. Promise.allSettled when you need all results (success or failure)
4. Promise.race for timeout patterns
5. Always use try/catch with async/await
6. Optimize by running independent operations in parallel
7. Be careful with loops and async/await
*/
