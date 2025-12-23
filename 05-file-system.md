# 05. File System

## 📚 Overview

The File System (fs) module provides an API for interacting with the file system. It offers synchronous, callback-based, and promise-based methods for file operations.

## 🎯 Key Concepts

### Three API Styles

```javascript
// 1. Synchronous (blocking)
const data = fs.readFileSync('file.txt', 'utf8');

// 2. Callback-based (async)
fs.readFile('file.txt', 'utf8', (err, data) => {});

// 3. Promise-based (async)
const data = await fs.promises.readFile('file.txt', 'utf8');
```

## 💻 Examples

### Reading Files

```javascript
const fs = require('fs');
const fsPromises = require('fs').promises;

// Sync - Blocks execution
try {
  const data = fs.readFileSync('file.txt', 'utf8');
  console.log(data);
} catch (err) {
  console.error(err);
}

// Async Callback
fs.readFile('file.txt', 'utf8', (err, data) => {
  if (err) {
    console.error('Error:', err);
    return;
  }
  console.log(data);
});

// Async Promise (modern way)
async function readFile() {
  try {
    const data = await fsPromises.readFile('file.txt', 'utf8');
    console.log(data);
  } catch (err) {
    console.error('Error:', err);
  }
}

// Read as buffer (binary)
const buffer = await fsPromises.readFile('image.png');
console.log(buffer); // <Buffer 89 50 4e 47...>
```

### Writing Files

```javascript
// Write (overwrites existing file)
await fsPromises.writeFile('file.txt', 'Hello, World!');

// Append to file
await fsPromises.appendFile('log.txt', 'New log entry\n');

// Write with options
await fsPromises.writeFile('file.txt', 'content', {
  encoding: 'utf8',
  mode: 0o666,
  flag: 'w'  // 'w' = write, 'a' = append
});

// Write JSON
const data = { name: 'John', age: 30 };
await fsPromises.writeFile('data.json', JSON.stringify(data, null, 2));

// Sync write
fs.writeFileSync('file.txt', 'content');
```

### Directory Operations

```javascript
// Create directory
await fsPromises.mkdir('newdir');

// Create nested directories
await fsPromises.mkdir('path/to/nested/dir', { recursive: true });

// Read directory contents
const files = await fsPromises.readdir('.');
console.log(files); // ['file1.txt', 'file2.txt', 'subdir']

// Read with file types
const entries = await fsPromises.readdir('.', { withFileTypes: true });
for (const entry of entries) {
  console.log(entry.name, entry.isDirectory() ? 'DIR' : 'FILE');
}

// Remove directory
await fsPromises.rmdir('emptydir');

// Remove directory recursively (Node.js 14.14+)
await fsPromises.rm('dir', { recursive: true, force: true });
```

### File Information

```javascript
// Get file stats
const stats = await fsPromises.stat('file.txt');

console.log('Size:', stats.size, 'bytes');
console.log('Is file:', stats.isFile());
console.log('Is directory:', stats.isDirectory());
console.log('Is symbolic link:', stats.isSymbolicLink());
console.log('Created:', stats.birthtime);
console.log('Modified:', stats.mtime);
console.log('Accessed:', stats.atime);
console.log('Mode:', stats.mode.toString(8)); // Permissions in octal

// Check if file exists
async function fileExists(path) {
  try {
    await fsPromises.access(path, fs.constants.F_OK);
    return true;
  } catch {
    return false;
  }
}

const exists = await fileExists('file.txt');
```

### File Operations

```javascript
// Copy file
await fsPromises.copyFile('source.txt', 'destination.txt');

// Move/rename file
await fsPromises.rename('old-name.txt', 'new-name.txt');

// Delete file
await fsPromises.unlink('file.txt');

// Create hard link
await fsPromises.link('original.txt', 'link.txt');

// Create symbolic link
await fsPromises.symlink('original.txt', 'symlink.txt');

// Read symbolic link
const target = await fsPromises.readlink('symlink.txt');

// Change permissions
await fsPromises.chmod('file.txt', 0o755);

// Change ownership (requires sudo)
await fsPromises.chown('file.txt', uid, gid);
```

### Watching Files

```javascript
// Watch file for changes
const watcher = fs.watch('file.txt', (eventType, filename) => {
  console.log(`Event: ${eventType} on ${filename}`);
});

// Stop watching
watcher.close();

// Watch with fs.watchFile (polling-based, more reliable)
fs.watchFile('file.txt', (curr, prev) => {
  console.log('File modified');
  console.log('Current mtime:', curr.mtime);
  console.log('Previous mtime:', prev.mtime);
});

// Stop watching
fs.unwatchFile('file.txt');

// Better: Use chokidar library for production
const chokidar = require('chokidar');
const watcher = chokidar.watch('*.txt', {
  ignored: /(^|[\/\\])\../,
  persistent: true
});

watcher
  .on('add', path => console.log(`File ${path} added`))
  .on('change', path => console.log(`File ${path} changed`))
  .on('unlink', path => console.log(`File ${path} removed`));
```

### Streaming Large Files

```javascript
// Read large file with stream
const readStream = fs.createReadStream('large-file.txt', {
  encoding: 'utf8',
  highWaterMark: 64 * 1024 // 64KB chunks
});

readStream.on('data', (chunk) => {
  console.log('Chunk size:', chunk.length);
});

readStream.on('end', () => {
  console.log('Finished reading');
});

// Write large file with stream
const writeStream = fs.createWriteStream('output.txt');
writeStream.write('Line 1\n');
writeStream.write('Line 2\n');
writeStream.end('Final line\n');

writeStream.on('finish', () => {
  console.log('Finished writing');
});

// Copy large file efficiently
fs.createReadStream('large-input.txt')
  .pipe(fs.createWriteStream('large-output.txt'));
```

### Working with JSON

```javascript
// Read JSON file
async function readJSON(filepath) {
  const data = await fsPromises.readFile(filepath, 'utf8');
  return JSON.parse(data);
}

const config = await readJSON('config.json');

// Write JSON file
async function writeJSON(filepath, data) {
  await fsPromises.writeFile(
    filepath,
    JSON.stringify(data, null, 2)
  );
}

await writeJSON('data.json', { users: [], posts: [] });
```

### Temporary Files

```javascript
const os = require('os');
const path = require('path');

// Get temp directory
const tmpDir = os.tmpdir();
console.log('Temp dir:', tmpDir);

// Create temp file
const tmpFile = path.join(tmpDir, `temp-${Date.now()}.txt`);
await fsPromises.writeFile(tmpFile, 'temporary data');

// Clean up temp file
await fsPromises.unlink(tmpFile);
```

### File Locking Pattern

```javascript
const lockfile = require('proper-lockfile');

async function processWithLock() {
  const release = await lockfile.lock('file.txt');
  
  try {
    // Process file while locked
    const data = await fsPromises.readFile('file.txt', 'utf8');
    // ... do work ...
    await fsPromises.writeFile('file.txt', newData);
  } finally {
    await release();
  }
}
```

### Recursive Directory Listing

```javascript
const path = require('path');

async function listFilesRecursive(dir) {
  const entries = await fsPromises.readdir(dir, { withFileTypes: true });
  const files = [];
  
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    
    if (entry.isDirectory()) {
      files.push(...await listFilesRecursive(fullPath));
    } else {
      files.push(fullPath);
    }
  }
  
  return files;
}

const allFiles = await listFilesRecursive('.');
console.log('All files:', allFiles);
```

## 🎤 Interview Questions

### Q1: What is the difference between fs and fs.promises?
**Answer:** 
- `fs` provides callback-based methods and synchronous methods
- `fs.promises` provides promise-based methods for cleaner async/await code
- Both access same underlying functionality

```javascript
// Callback style
fs.readFile('file.txt', (err, data) => {});

// Promise style
const data = await fs.promises.readFile('file.txt');
```

### Q2: When should you use synchronous file operations?
**Answer:** Only for:
- Application startup/initialization
- Configuration loading before server starts
- Command-line tools
- **Never** in request handlers or event loop callbacks (blocks execution)

### Q3: What is the difference between readFile() and createReadStream()?
**Answer:**
- `readFile()` loads entire file into memory at once
- `createReadStream()` reads file in chunks, memory efficient
- Use streams for files larger than 1-2MB

### Q4: How to check if a file exists?
**Answer:**
```javascript
// Don't use fs.exists() - deprecated!

// Correct way
try {
  await fs.promises.access('file.txt', fs.constants.F_OK);
  console.log('File exists');
} catch {
  console.log('File does not exist');
}

// Or just try to open it
try {
  const data = await fs.promises.readFile('file.txt');
} catch (err) {
  if (err.code === 'ENOENT') {
    console.log('File not found');
  }
}
```

### Q5: What are common fs error codes?
**Answer:**
- `ENOENT` - No such file or directory
- `EACCES` - Permission denied
- `EEXIST` - File already exists
- `EISDIR` - Expected file, got directory
- `ENOTDIR` - Expected directory, got file
- `EMFILE` - Too many open files

### Q6: How to watch for file changes?
**Answer:**
```javascript
// fs.watch - uses OS events (fast but less reliable)
fs.watch('file.txt', (eventType, filename) => {});

// fs.watchFile - uses polling (slower but more reliable)
fs.watchFile('file.txt', (curr, prev) => {});

// Production: Use chokidar library
const chokidar = require('chokidar');
chokidar.watch('**/*.js').on('change', path => {});
```

### Q7: What is the difference between appendFile() and writeFile()?
**Answer:**
- `writeFile()` overwrites entire file content
- `appendFile()` adds content to end of file
- Both create file if it doesn't exist

### Q8: How to handle large files efficiently?
**Answer:**
```javascript
// BAD - Loads entire file into memory
const data = await fs.promises.readFile('huge-file.txt');

// GOOD - Streams data in chunks
fs.createReadStream('huge-file.txt')
  .pipe(processStream)
  .pipe(fs.createWriteStream('output.txt'));
```

### Q9: What are file descriptors?
**Answer:** Integer representing an open file (low-level)
```javascript
const fd = fs.openSync('file.txt', 'r');
const buffer = Buffer.alloc(100);
fs.readSync(fd, buffer, 0, 100, 0);
fs.closeSync(fd); // Must close to avoid leaks!

// Modern way: use promises API instead
```

### Q10: How to copy directories recursively?
**Answer:**
```javascript
// Node.js 16+
await fs.promises.cp('source-dir', 'dest-dir', { recursive: true });

// Older versions - manually recurse
async function copyDir(src, dest) {
  await fs.promises.mkdir(dest, { recursive: true });
  const entries = await fs.promises.readdir(src, { withFileTypes: true });
  
  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    
    if (entry.isDirectory()) {
      await copyDir(srcPath, destPath);
    } else {
      await fs.promises.copyFile(srcPath, destPath);
    }
  }
}
```

## 🎯 Best Practices

1. **Use promises API for async code**
   ```javascript
   const fs = require('fs').promises;
   const data = await fs.readFile('file.txt', 'utf8');
   ```

2. **Always handle errors**
   ```javascript
   try {
     await fs.readFile('file.txt');
   } catch (err) {
     console.error('Error:', err.code, err.message);
   }
   ```

3. **Use streams for large files**
   ```javascript
   fs.createReadStream('large.txt')
     .pipe(processStream)
     .pipe(fs.createWriteStream('output.txt'));
   ```

4. **Never use sync methods in request handlers**
   ```javascript
   // BAD - blocks event loop
   app.get('/file', (req, res) => {
     const data = fs.readFileSync('file.txt');
     res.send(data);
   });
   
   // GOOD - non-blocking
   app.get('/file', async (req, res) => {
     const data = await fs.promises.readFile('file.txt');
     res.send(data);
   });
   ```

5. **Close file descriptors**
   ```javascript
   const fd = await fs.promises.open('file.txt', 'r');
   try {
     // Use file
   } finally {
     await fd.close();
   }
   ```

## 📚 Additional Resources

- [Node.js File System API](https://nodejs.org/api/fs.html)
- [Stream API](https://nodejs.org/api/stream.html)

---

[← Previous: Streams](./04-streams.md) | [Next: HTTP Server →](./06-http-server.md)
