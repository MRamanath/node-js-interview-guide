# 04. Streams

## 📚 Overview

Streams are one of the most powerful features in Node.js for handling data efficiently. Instead of loading entire files or data into memory, streams process data in chunks, making them perfect for handling large files and real-time data.

## 🎯 Key Concepts

### What are Streams?

Streams are **collections of data** that might not be available all at once. They allow you to:
- 📦 Process data piece by piece (chunks)
- 💾 Use less memory (don't load everything at once)
- ⚡ Start processing immediately (don't wait for all data)
- 🔗 Pipe data between operations

### Types of Streams

```
┌─────────────────┬──────────────────┬─────────────────┐
│   Readable      │     Writable     │     Duplex      │
│  (read data)    │   (write data)   │  (both R & W)   │
│                 │                  │                 │
│  fs.createRead  │ fs.createWrite   │   TCP Socket    │
│  http.request   │  http.response   │   TLS Socket    │
│  process.stdin  │  process.stdout  │                 │
└─────────────────┴──────────────────┴─────────────────┘
           │
           └──────────────┐
                          │
                  ┌───────▼────────┐
                  │   Transform    │
                  │ (modify data)  │
                  │                │
                  │  zlib.createGzip  │
                  │  crypto streams    │
                  └────────────────┘
```

## 💻 Examples

### Reading Files with Streams

```javascript
const fs = require('fs');

// BAD: Load entire file into memory
const data = fs.readFileSync('huge-file.txt'); // 1GB file = 1GB RAM!
console.log(data);

// GOOD: Stream the file in chunks
const readStream = fs.createReadStream('huge-file.txt', {
  encoding: 'utf8',
  highWaterMark: 64 * 1024 // 64KB chunks
});

readStream.on('data', (chunk) => {
  console.log('Received chunk:', chunk.length, 'bytes');
  // Process chunk immediately
});

readStream.on('end', () => {
  console.log('Finished reading file');
});

readStream.on('error', (error) => {
  console.error('Error:', error);
});
```

### Creating Custom Readable Stream

```javascript
const { Readable } = require('stream');

class CounterStream extends Readable {
  constructor(max) {
    super();
    this.current = 1;
    this.max = max;
  }
  
  _read() {
    if (this.current <= this.max) {
      // Push data to stream
      this.push(`Number: ${this.current}\n`);
      this.current++;
    } else {
      // Signal end of stream
      this.push(null);
    }
  }
}

const counter = new CounterStream(100);

counter.on('data', (chunk) => {
  console.log(chunk.toString());
});

counter.on('end', () => {
  console.log('Stream ended');
});

// Or use pipe
counter.pipe(process.stdout);
```

### Creating Custom Writable Stream

```javascript
const { Writable } = require('stream');

class FileWriterStream extends Writable {
  constructor(filename) {
    super();
    this.filename = filename;
    this.fd = fs.openSync(filename, 'w');
  }
  
  _write(chunk, encoding, callback) {
    // Write chunk to file
    fs.write(this.fd, chunk, (err) => {
      if (err) {
        callback(err);
      } else {
        console.log('Wrote', chunk.length, 'bytes');
        callback();
      }
    });
  }
  
  _final(callback) {
    // Close file when stream ends
    fs.close(this.fd, callback);
  }
}

const writer = new FileWriterStream('output.txt');

writer.write('Hello, ');
writer.write('World!\n');
writer.end('Goodbye!');
```

### Piping Streams

```javascript
const fs = require('fs');
const zlib = require('zlib');

// Read file -> Compress -> Write file
fs.createReadStream('input.txt')
  .pipe(zlib.createGzip())
  .pipe(fs.createWriteStream('input.txt.gz'))
  .on('finish', () => {
    console.log('File compressed successfully!');
  });

// Chain multiple operations
fs.createReadStream('large-log.txt')
  .pipe(splitLines())        // Transform: split by lines
  .pipe(filterErrors())      // Transform: filter error logs
  .pipe(formatJSON())        // Transform: format as JSON
  .pipe(process.stdout);     // Output to console
```

### Transform Stream

```javascript
const { Transform } = require('stream');

class UpperCaseTransform extends Transform {
  _transform(chunk, encoding, callback) {
    // Transform data and push to output
    this.push(chunk.toString().toUpperCase());
    callback();
  }
}

// Usage
const upper = new UpperCaseTransform();

process.stdin
  .pipe(upper)
  .pipe(process.stdout);

// Type something and press Enter to see it in UPPERCASE
```

### Real-world: CSV Parser

```javascript
const { Transform } = require('stream');
const fs = require('fs');

class CSVParser extends Transform {
  constructor() {
    super({ objectMode: true });
    this.header = null;
    this.buffer = '';
  }
  
  _transform(chunk, encoding, callback) {
    this.buffer += chunk.toString();
    const lines = this.buffer.split('\n');
    
    // Keep last incomplete line in buffer
    this.buffer = lines.pop();
    
    lines.forEach((line, index) => {
      if (!this.header) {
        this.header = line.split(',');
      } else {
        const values = line.split(',');
        const obj = {};
        this.header.forEach((key, i) => {
          obj[key] = values[i];
        });
        this.push(obj);
      }
    });
    
    callback();
  }
  
  _flush(callback) {
    if (this.buffer) {
      const values = this.buffer.split(',');
      const obj = {};
      this.header.forEach((key, i) => {
        obj[key] = values[i];
      });
      this.push(obj);
    }
    callback();
  }
}

// Usage
fs.createReadStream('data.csv')
  .pipe(new CSVParser())
  .on('data', (row) => {
    console.log('Row:', row);
  });
```

### Backpressure Handling

```javascript
const fs = require('fs');

const readable = fs.createReadStream('huge-file.txt');
const writable = fs.createWriteStream('copy.txt');

readable.on('data', (chunk) => {
  // write() returns false if buffer is full
  const canContinue = writable.write(chunk);
  
  if (!canContinue) {
    console.log('Backpressure! Pausing read stream');
    readable.pause();
  }
});

// Resume when write buffer is drained
writable.on('drain', () => {
  console.log('Drain event! Resuming read stream');
  readable.resume();
});

readable.on('end', () => {
  writable.end();
});

// Better: Use pipe() - handles backpressure automatically!
readable.pipe(writable);
```

### Stream Pipeline (Error Handling)

```javascript
const { pipeline } = require('stream');
const fs = require('fs');
const zlib = require('zlib');

// Automatically handles errors and cleanup
pipeline(
  fs.createReadStream('input.txt'),
  zlib.createGzip(),
  fs.createWriteStream('input.txt.gz'),
  (err) => {
    if (err) {
      console.error('Pipeline failed:', err);
    } else {
      console.log('Pipeline succeeded');
    }
  }
);

// With promises
const { pipeline } = require('stream/promises');

async function compressFile() {
  try {
    await pipeline(
      fs.createReadStream('input.txt'),
      zlib.createGzip(),
      fs.createWriteStream('input.txt.gz')
    );
    console.log('Success!');
  } catch (err) {
    console.error('Failed:', err);
  }
}
```

### Object Mode Streams

```javascript
const { Readable, Transform } = require('stream');

// Create stream that emits objects
const objectStream = new Readable({
  objectMode: true,
  read() {
    this.push({ id: 1, name: 'Alice' });
    this.push({ id: 2, name: 'Bob' });
    this.push({ id: 3, name: 'Charlie' });
    this.push(null); // End
  }
});

// Transform objects
const addEmail = new Transform({
  objectMode: true,
  transform(user, encoding, callback) {
    user.email = `${user.name.toLowerCase()}@example.com`;
    callback(null, user);
  }
});

objectStream
  .pipe(addEmail)
  .on('data', (user) => {
    console.log('User:', user);
  });

/* Output:
User: { id: 1, name: 'Alice', email: 'alice@example.com' }
User: { id: 2, name: 'Bob', email: 'bob@example.com' }
User: { id: 3, name: 'Charlie', email: 'charlie@example.com' }
*/
```

### HTTP Streaming

```javascript
const http = require('http');
const fs = require('fs');

http.createServer((req, res) => {
  if (req.url === '/video') {
    // Stream video file
    res.writeHead(200, { 'Content-Type': 'video/mp4' });
    fs.createReadStream('movie.mp4').pipe(res);
  }
  else if (req.url === '/upload' && req.method === 'POST') {
    // Stream incoming upload to file
    const writeStream = fs.createWriteStream('uploaded-file.dat');
    req.pipe(writeStream);
    
    writeStream.on('finish', () => {
      res.end('Upload complete!');
    });
  }
}).listen(3000);
```

## 🎤 Interview Questions

### Q1: What are streams in Node.js?
**Answer:** Streams are abstract interfaces for working with streaming data. They allow processing data piece by piece without loading everything into memory, making them memory-efficient and performant for large datasets.

### Q2: What are the 4 types of streams?
**Answer:**
1. **Readable** - Read data from source (fs.createReadStream, http.IncomingMessage)
2. **Writable** - Write data to destination (fs.createWriteStream, http.ServerResponse)
3. **Duplex** - Both readable and writable (TCP socket, WebSocket)
4. **Transform** - Modify data during read/write (zlib.createGzip, crypto streams)

### Q3: What is backpressure?
**Answer:** Backpressure occurs when the destination (writable) can't process data as fast as the source (readable) provides it.

**Handling backpressure:**
```javascript
const canWrite = writableStream.write(data);
if (!canWrite) {
  readableStream.pause();
}
writableStream.on('drain', () => {
  readableStream.resume();
});

// Or use pipe() - handles automatically
readableStream.pipe(writableStream);
```

### Q4: What is the difference between readable.pipe() and readable.on('data')?
**Answer:**
- **pipe()**: Automatically handles backpressure, errors, and cleanup. Recommended.
- **on('data')**: Manual control, must handle backpressure yourself

```javascript
// Good - automatic backpressure
readable.pipe(writable);

// Manual - must handle backpressure
readable.on('data', (chunk) => {
  const ok = writable.write(chunk);
  if (!ok) readable.pause();
});
```

### Q5: What are flowing and paused modes?
**Answer:**
- **Flowing mode**: Data automatically read and emitted via 'data' events
- **Paused mode**: Must explicitly call read() to get data

```javascript
// Switch to flowing mode
readable.on('data', callback);  // or
readable.pipe(destination);     // or
readable.resume();

// Switch to paused mode
readable.pause();
```

### Q6: What is highWaterMark?
**Answer:** Buffer size threshold before backpressure kicks in.
- Default: 16KB for binary streams, 16 objects for object streams
- Can be configured in stream options

```javascript
const stream = fs.createReadStream('file.txt', {
  highWaterMark: 64 * 1024 // 64KB chunks
});
```

### Q7: When to use streams vs buffers?
**Answer:**
- **Streams**: Large files, real-time data, memory constraints, progressive processing
- **Buffers**: Small files, need all data at once, random access required

### Q8: What is stream.pipeline()?
**Answer:** Utility function that pipes streams with proper error handling and cleanup.

```javascript
const { pipeline } = require('stream');

pipeline(
  source,
  transform1,
  transform2,
  destination,
  (err) => {
    if (err) console.error('Failed:', err);
  }
);
```

Benefits:
- Destroys all streams if one fails
- Properly handles errors
- Cleans up resources

### Q9: What is object mode?
**Answer:** Allows streams to work with any JavaScript value instead of just Buffers/Strings.

```javascript
const stream = new Readable({
  objectMode: true,
  read() {
    this.push({ id: 1, name: 'Alice' });
    this.push(null);
  }
});
```

### Q10: How to handle stream errors?
**Answer:**
```javascript
// Method 1: Listen to error event on each stream
readStream.on('error', handleError);
writeStream.on('error', handleError);

// Method 2: Use pipeline (recommended)
pipeline(
  readStream,
  transformStream,
  writeStream,
  (err) => {
    if (err) console.error('Pipeline error:', err);
  }
);

// Method 3: Async pipeline with try-catch
try {
  await pipeline(readStream, writeStream);
} catch (err) {
  console.error('Error:', err);
}
```

## 🎯 Best Practices

1. **Use streams for large files**
   ```javascript
   // Bad - loads entire file
   const data = fs.readFileSync('huge.txt');
   
   // Good - streams data
   fs.createReadStream('huge.txt').pipe(response);
   ```

2. **Always handle errors**
   ```javascript
   stream.on('error', (err) => {
     console.error('Stream error:', err);
   });
   ```

3. **Use pipeline() for multiple streams**
   ```javascript
   pipeline(input, transform, output, handleError);
   ```

4. **Set appropriate highWaterMark**
   ```javascript
   const stream = fs.createReadStream('file', {
     highWaterMark: 128 * 1024 // 128KB for large files
   });
   ```

5. **Use object mode for structured data**
   ```javascript
   const stream = new Transform({
     objectMode: true,
     transform(obj, enc, cb) {
       // Transform object
       cb(null, obj);
     }
   });
   ```

## 📚 Additional Resources

- [Node.js Stream API](https://nodejs.org/api/stream.html)
- [Stream Handbook](https://github.com/substack/stream-handbook)
- [Backpressuring in Streams](https://nodejs.org/en/docs/guides/backpressuring-in-streams/)

---

[← Previous: Event Loop](./03-event-loop.md) | [Next: File System →](./05-file-system.md)
