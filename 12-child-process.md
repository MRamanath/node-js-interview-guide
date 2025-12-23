# 12. Child Process

## 📚 Overview

The child_process module enables Node.js to spawn child processes, execute shell commands, and run other programs. Essential for CPU-intensive tasks, running system commands, and parallel processing.

## 🎯 Key Concepts

### Four Ways to Create Child Processes

```
exec()      - Spawns shell, buffers output
execFile()  - No shell, buffers output  
spawn()     - Streams data, more control
fork()      - Special spawn() for Node.js files
```

## 💻 Examples

### exec() - Run Shell Commands

```javascript
const { exec } = require('child_process');

// Basic command
exec('ls -la', (error, stdout, stderr) => {
  if (error) {
    console.error('Error:', error.message);
    return;
  }
  
  if (stderr) {
    console.error('Stderr:', stderr);
    return;
  }
  
  console.log('Output:', stdout);
});

// With options
exec('git log --oneline', {
  cwd: '/path/to/repo',
  env: { ...process.env, CUSTOM: 'value' },
  maxBuffer: 1024 * 1024, // 1MB
  timeout: 5000, // 5 seconds
  shell: '/bin/bash'
}, (error, stdout, stderr) => {
  console.log(stdout);
});

// Promise version
const { promisify } = require('util');
const execPromise = promisify(exec);

async function runCommand() {
  try {
    const { stdout, stderr } = await execPromise('ls -la');
    console.log(stdout);
  } catch (err) {
    console.error('Error:', err.message);
  }
}
```

### execFile() - Execute File Directly

```javascript
const { execFile } = require('child_process');

// Execute binary/script (no shell)
execFile('node', ['--version'], (error, stdout, stderr) => {
  if (error) {
    console.error('Error:', error);
    return;
  }
  console.log('Node version:', stdout);
});

// Execute Python script
execFile('python3', ['script.py', 'arg1', 'arg2'], (error, stdout, stderr) => {
  if (error) {
    console.error('Python error:', error);
    return;
  }
  console.log('Python output:', stdout);
});

// Promise version
const { promisify } = require('util');
const execFilePromise = promisify(execFile);

async function runPython() {
  try {
    const { stdout } = await execFilePromise('python3', ['script.py']);
    console.log(stdout);
  } catch (err) {
    console.error(err);
  }
}
```

### spawn() - Stream-Based Process

```javascript
const { spawn } = require('child_process');

// Basic spawn
const ls = spawn('ls', ['-la']);

ls.stdout.on('data', (data) => {
  console.log(`stdout: ${data}`);
});

ls.stderr.on('data', (data) => {
  console.error(`stderr: ${data}`);
});

ls.on('close', (code) => {
  console.log(`Process exited with code ${code}`);
});

ls.on('error', (error) => {
  console.error(`Error: ${error.message}`);
});

// Long-running process
const server = spawn('node', ['server.js']);

server.stdout.on('data', (data) => {
  console.log(`Server: ${data}`);
});

// Pipe to file
const fs = require('fs');
const logFile = fs.createWriteStream('server.log');
server.stdout.pipe(logFile);
server.stderr.pipe(logFile);

// Kill process
setTimeout(() => {
  server.kill('SIGTERM');
}, 5000);

// Interactive process
const python = spawn('python3', ['-i']);

python.stdout.on('data', (data) => {
  console.log(`Output: ${data}`);
});

// Send input to process
python.stdin.write('print("Hello from Node")\n');
python.stdin.write('2 + 2\n');
python.stdin.end();
```

### fork() - Node.js Specific

```javascript
// parent.js
const { fork } = require('child_process');

const child = fork('child.js');

// Send message to child
child.send({ cmd: 'START', data: { value: 42 } });

// Receive message from child
child.on('message', (msg) => {
  console.log('From child:', msg);
});

child.on('exit', (code) => {
  console.log('Child exited with code', code);
});

// child.js
process.on('message', (msg) => {
  console.log('From parent:', msg);
  
  if (msg.cmd === 'START') {
    const result = heavyComputation(msg.data.value);
    process.send({ cmd: 'RESULT', result });
  }
});

function heavyComputation(n) {
  // CPU-intensive work
  return n * 2;
}
```

### Worker Pool Pattern

```javascript
// pool.js
const { fork } = require('child_process');
const path = require('path');

class WorkerPool {
  constructor(size, workerScript) {
    this.size = size;
    this.workerScript = workerScript;
    this.workers = [];
    this.queue = [];
    
    for (let i = 0; i < size; i++) {
      this.createWorker();
    }
  }
  
  createWorker() {
    const worker = {
      process: fork(this.workerScript),
      busy: false
    };
    
    worker.process.on('message', (msg) => {
      worker.busy = false;
      
      if (msg.error) {
        worker.callback(new Error(msg.error));
      } else {
        worker.callback(null, msg.result);
      }
      
      this.processQueue();
    });
    
    worker.process.on('exit', () => {
      console.log('Worker died, creating new one');
      const index = this.workers.indexOf(worker);
      this.workers.splice(index, 1);
      this.createWorker();
    });
    
    this.workers.push(worker);
  }
  
  runTask(task, callback) {
    const worker = this.workers.find(w => !w.busy);
    
    if (worker) {
      worker.busy = true;
      worker.callback = callback;
      worker.process.send(task);
    } else {
      this.queue.push({ task, callback });
    }
  }
  
  processQueue() {
    if (this.queue.length === 0) return;
    
    const worker = this.workers.find(w => !w.busy);
    if (worker) {
      const { task, callback } = this.queue.shift();
      worker.busy = true;
      worker.callback = callback;
      worker.process.send(task);
    }
  }
  
  destroy() {
    this.workers.forEach(w => w.process.kill());
  }
}

// Usage
const pool = new WorkerPool(4, path.join(__dirname, 'worker.js'));

for (let i = 0; i < 100; i++) {
  pool.runTask({ number: i }, (err, result) => {
    if (err) console.error(err);
    else console.log('Result:', result);
  });
}
```

### Execute with Shell

```javascript
const { spawn } = require('child_process');

// With shell (allows pipes, redirects)
const child = spawn('ls -la | grep .js', {
  shell: true
});

child.stdout.on('data', (data) => {
  console.log(data.toString());
});

// Equivalent to exec but streaming
const grep = spawn('grep', ['node'], {
  shell: true,
  cwd: process.cwd()
});

grep.stdin.write('node.js\n');
grep.stdin.write('python.py\n');
grep.stdin.write('nodejs\n');
grep.stdin.end();

grep.stdout.on('data', (data) => {
  console.log('Match:', data.toString());
});
```

### Process Communication

```javascript
// parent.js
const { fork } = require('child_process');

const child = fork('child.js');

// Send different types of messages
child.send({ type: 'config', data: { port: 3000 } });
child.send({ type: 'start' });

child.on('message', (msg) => {
  switch (msg.type) {
    case 'ready':
      console.log('Child is ready');
      break;
    case 'progress':
      console.log(`Progress: ${msg.percent}%`);
      break;
    case 'complete':
      console.log('Task complete:', msg.result);
      break;
  }
});

// child.js
let config = {};

process.on('message', (msg) => {
  switch (msg.type) {
    case 'config':
      config = msg.data;
      process.send({ type: 'ready' });
      break;
      
    case 'start':
      performTask();
      break;
  }
});

async function performTask() {
  for (let i = 0; i <= 100; i += 10) {
    process.send({ type: 'progress', percent: i });
    await new Promise(r => setTimeout(r, 100));
  }
  
  process.send({ type: 'complete', result: 'Done!' });
  process.exit(0);
}
```

### Detached Processes

```javascript
const { spawn } = require('child_process');
const fs = require('fs');

// Detach process to run independently
const out = fs.openSync('./out.log', 'a');
const err = fs.openSync('./err.log', 'a');

const child = spawn('node', ['long-running.js'], {
  detached: true,
  stdio: ['ignore', out, err]
});

// Unreference so parent can exit
child.unref();

console.log('Started detached process');
process.exit(0); // Parent exits, child continues
```

### Error Handling

```javascript
const { spawn } = require('child_process');

const child = spawn('nonexistent-command');

child.on('error', (err) => {
  console.error('Failed to start process:', err.message);
  // Error: spawn nonexistent-command ENOENT
});

child.on('close', (code, signal) => {
  if (code !== 0) {
    console.error(`Process exited with code ${code}`);
  }
  if (signal) {
    console.error(`Process killed with signal ${signal}`);
  }
});

// Timeout handling
const child2 = spawn('sleep', ['100']);

const timeout = setTimeout(() => {
  console.log('Killing process due to timeout');
  child2.kill('SIGTERM');
  
  setTimeout(() => {
    if (!child2.killed) {
      child2.kill('SIGKILL'); // Force kill
    }
  }, 5000);
}, 10000);

child2.on('exit', () => {
  clearTimeout(timeout);
});
```

### Real-World: Image Processing

```javascript
// Process images in parallel
const { fork } = require('child_process');
const fs = require('fs');

async function processImages(imagePaths) {
  const results = await Promise.all(
    imagePaths.map(path => processImage(path))
  );
  return results;
}

function processImage(imagePath) {
  return new Promise((resolve, reject) => {
    const worker = fork('image-worker.js');
    
    worker.send({ imagePath });
    
    worker.on('message', (msg) => {
      if (msg.error) {
        reject(new Error(msg.error));
      } else {
        resolve(msg.result);
      }
    });
    
    worker.on('error', reject);
    
    setTimeout(() => {
      worker.kill();
      reject(new Error('Timeout'));
    }, 30000);
  });
}

// image-worker.js
const sharp = require('sharp');

process.on('message', async (msg) => {
  try {
    await sharp(msg.imagePath)
      .resize(800, 600)
      .toFile(msg.imagePath.replace('.jpg', '-thumb.jpg'));
    
    process.send({ result: 'Success' });
  } catch (err) {
    process.send({ error: err.message });
  }
  
  process.exit(0);
});
```

## 🎤 Interview Questions

### Q1: What is the difference between exec() and spawn()?
**Answer:**
- `exec()`: Buffers output, returns on completion, uses shell
- `spawn()`: Streams output, more control, better for large data

### Q2: When to use fork() vs spawn()?
**Answer:**
- `fork()`: For Node.js scripts, has IPC (Inter-Process Communication)
- `spawn()`: For any executable, no built-in messaging

### Q3: What is IPC in child_process?
**Answer:** Inter-Process Communication. Fork creates communication channel between parent/child using `send()` and `message` event.

### Q4: How to handle child process errors?
**Answer:**
```javascript
child.on('error', (err) => {}); // Failed to spawn
child.on('exit', (code) => {}); // Exit code != 0
child.on('close', (code, signal) => {});
```

### Q5: What is a detached process?
**Answer:** Process that runs independently of parent. Parent can exit while child continues. Use `detached: true` and `unref()`.

### Q6: Difference between exec() and execFile()?
**Answer:**
- `exec()`: Spawns shell, can use shell features (pipes, etc.)
- `execFile()`: Directly executes file, more efficient, more secure

### Q7: How to kill a child process?
**Answer:**
```javascript
child.kill('SIGTERM'); // Graceful
child.kill('SIGKILL'); // Force kill
```

### Q8: What is maxBuffer in exec()?
**Answer:** Maximum stdout/stderr buffer size (default 1MB). Exceeding it kills process with error.

### Q9: Can child processes share memory with parent?
**Answer:** No, each process has separate memory. Must communicate via IPC, streams, or files.

### Q10: How to pass environment variables to child process?
**Answer:**
```javascript
spawn('command', [], {
  env: { ...process.env, CUSTOM: 'value' }
});
```

## 🎯 Best Practices

1. **Use spawn() for large output**
   ```javascript
   const child = spawn('cmd');
   child.stdout.pipe(process.stdout);
   ```

2. **Always handle errors**
   ```javascript
   child.on('error', handleError);
   child.on('exit', checkExitCode);
   ```

3. **Set timeouts**
   ```javascript
   setTimeout(() => child.kill(), 30000);
   ```

4. **Clean up resources**
   ```javascript
   process.on('exit', () => child.kill());
   ```

5. **Use fork() for CPU-intensive tasks**
   ```javascript
   const worker = fork('heavy-computation.js');
   worker.send({ data });
   ```

## 📚 Additional Resources

- [Node.js Child Process API](https://nodejs.org/api/child_process.html)
- [Process Communication](https://nodejs.org/api/process.html#process_process_send_message_sendhandle_options_callback)

---

[← Previous: Buffers](./11-buffers.md) | [Next: Clustering →](./13-clustering.md)
