# 11. Buffers

## 📚 Overview

Buffers are Node.js's way of handling binary data. They represent fixed-size chunks of memory allocated outside V8's heap, used for reading files, network communication, and image processing.

## 🎯 Key Concepts

### Why Buffers?

JavaScript originally had no mechanism to read or manipulate binary data. Buffers fill this gap, essential for:
- File I/O
- Network protocols
- Image/video processing
- Cryptography

## 💻 Examples

### Creating Buffers

```javascript
// From string (default UTF-8)
const buf1 = Buffer.from('Hello');
console.log(buf1); // <Buffer 48 65 6c 6c 6f>

// With encoding
const buf2 = Buffer.from('Hello', 'utf8');
const buf3 = Buffer.from('48656c6c6f', 'hex');
const buf4 = Buffer.from('SGVsbG8=', 'base64');

// From array of bytes
const buf5 = Buffer.from([72, 101, 108, 108, 111]);

// Allocate empty buffer
const buf6 = Buffer.alloc(10); // 10 bytes, filled with zeros
console.log(buf6); // <Buffer 00 00 00 00 00 00 00 00 00 00>

// Allocate without initialization (faster, but may contain old data)
const buf7 = Buffer.allocUnsafe(10);
buf7.fill(0); // Fill with zeros

// Create from TypedArray
const arr = new Uint8Array([1, 2, 3]);
const buf8 = Buffer.from(arr);
```

### Reading from Buffers

```javascript
const buf = Buffer.from('Hello World');

// Convert to string
console.log(buf.toString());           // 'Hello World'
console.log(buf.toString('hex'));      // '48656c6c6f20576f726c64'
console.log(buf.toString('base64'));   // 'SGVsbG8gV29ybGQ='

// Read bytes
console.log(buf[0]);                   // 72 (H)
console.log(buf.length);               // 11 bytes

// Slice (creates view, not copy!)
const slice = buf.slice(0, 5);
console.log(slice.toString());         // 'Hello'

// Slice with subarray (alias for slice)
const sub = buf.subarray(6, 11);
console.log(sub.toString());           // 'World'

// Check if buffer
console.log(Buffer.isBuffer(buf));     // true

// Get byte length of string
console.log(Buffer.byteLength('Hello')); // 5
console.log(Buffer.byteLength('你好'));  // 6 (UTF-8)
```

### Writing to Buffers

```javascript
const buf = Buffer.alloc(11);

// Write string
buf.write('Hello', 0, 'utf8');
console.log(buf.toString());  // 'Hello\x00\x00\x00\x00\x00\x00'

// Write at offset
buf.write('World', 6, 'utf8');
console.log(buf.toString());  // 'Hello\x00World'

// Write full buffer
buf.write('Hello World'); // Overwrites
console.log(buf.toString()); // 'Hello World'

// Fill buffer
const buf2 = Buffer.alloc(10);
buf2.fill('a');
console.log(buf2.toString()); // 'aaaaaaaaaa'

buf2.fill('ab');
console.log(buf2.toString()); // 'ababababab'

buf2.fill(0); // Fill with zeros
```

### Buffer Methods

```javascript
const buf1 = Buffer.from('Hello');
const buf2 = Buffer.from('World');

// Concatenate buffers
const buf3 = Buffer.concat([buf1, buf2]);
console.log(buf3.toString()); // 'HelloWorld'

// With separator
const buf4 = Buffer.concat([buf1, Buffer.from(' '), buf2]);
console.log(buf4.toString()); // 'Hello World'

// Compare buffers
console.log(buf1.compare(buf2));  // -1 (buf1 < buf2)
console.log(buf1.equals(buf1));   // true

// Copy buffer
const buf5 = Buffer.alloc(5);
buf1.copy(buf5);
console.log(buf5.toString()); // 'Hello'

// Copy with offset
const target = Buffer.alloc(10);
buf1.copy(target, 0);  // Copy to start
buf2.copy(target, 5);  // Copy to position 5
console.log(target.toString()); // 'HelloWorld'

// indexOf
const buf = Buffer.from('Hello World');
console.log(buf.indexOf('World'));     // 6
console.log(buf.indexOf(Buffer.from('World'))); // 6
console.log(buf.lastIndexOf('o'));     // 7

// includes
console.log(buf.includes('World'));    // true
```

### Encodings

```javascript
const text = 'Hello 你好';

// UTF-8 (default, 1-4 bytes per character)
const utf8 = Buffer.from(text, 'utf8');
console.log(utf8.length); // 12 bytes

// UTF-16LE (2 bytes per character)
const utf16 = Buffer.from(text, 'utf16le');
console.log(utf16.length); // 16 bytes

// Base64
const base64 = Buffer.from('SGVsbG8=', 'base64');
console.log(base64.toString()); // 'Hello'

// Hex
const hex = Buffer.from('48656c6c6f', 'hex');
console.log(hex.toString()); // 'Hello'

// ASCII (only 0-127)
const ascii = Buffer.from('Hello', 'ascii');

// Latin1 (ISO-8859-1, 0-255)
const latin1 = Buffer.from('Hello', 'latin1');

// Convert between encodings
const original = 'Hello 世界';
const buf = Buffer.from(original, 'utf8');
const base64Str = buf.toString('base64');
console.log(base64Str); // 'SGVsbG8g5LiW55WM'

const decoded = Buffer.from(base64Str, 'base64');
console.log(decoded.toString('utf8')); // 'Hello 世界'
```

### Binary Data Operations

```javascript
// Read integers
const buf = Buffer.alloc(8);

// Write 32-bit integer (Big Endian)
buf.writeInt32BE(12345, 0);
console.log(buf.readInt32BE(0)); // 12345

// Write 32-bit integer (Little Endian)
buf.writeInt32LE(12345, 0);
console.log(buf.readInt32LE(0)); // 12345

// Unsigned integers
buf.writeUInt32BE(4294967295, 0); // Max uint32
console.log(buf.readUInt32BE(0)); // 4294967295

// 16-bit integers
buf.writeInt16BE(32767, 0);
console.log(buf.readInt16BE(0)); // 32767

// 8-bit integers
buf.writeInt8(127, 0);
console.log(buf.readInt8(0)); // 127

// Floating point
buf.writeFloatBE(3.14159, 0);
console.log(buf.readFloatBE(0)); // 3.14159...

buf.writeDoubleBE(Math.PI, 0);
console.log(buf.readDoubleBE(0)); // 3.141592653589793

// BigInt (Node.js 12+)
const bigBuf = Buffer.alloc(8);
bigBuf.writeBigInt64BE(9007199254740991n, 0);
console.log(bigBuf.readBigInt64BE(0)); // 9007199254740991n
```

### Buffer and Streams

```javascript
const fs = require('fs');

// Read file as buffer
const data = fs.readFileSync('file.txt');
console.log(Buffer.isBuffer(data)); // true

// Write buffer to file
const buf = Buffer.from('Hello World');
fs.writeFileSync('output.txt', buf);

// Stream with buffers
const readStream = fs.createReadStream('large-file.txt');

readStream.on('data', (chunk) => {
  console.log('Chunk:', chunk.length, 'bytes');
  console.log(Buffer.isBuffer(chunk)); // true
});

// Transform buffer in stream
const { Transform } = require('stream');

const upperCaseTransform = new Transform({
  transform(chunk, encoding, callback) {
    const upperChunk = Buffer.from(chunk.toString().toUpperCase());
    callback(null, upperChunk);
  }
});

fs.createReadStream('input.txt')
  .pipe(upperCaseTransform)
  .pipe(fs.createWriteStream('output.txt'));
```

### Buffer Pool

```javascript
// Buffer.allocUnsafe uses buffer pool for efficiency
const buf1 = Buffer.allocUnsafe(10);
const buf2 = Buffer.allocUnsafe(10);

// May contain old data!
console.log(buf1); // May show random bytes

// Always initialize
buf1.fill(0);
buf2.fill(0);

// Buffer.alloc is slower but safe (already zeroed)
const safeBuf = Buffer.alloc(10);
console.log(safeBuf); // <Buffer 00 00 00 00 00 00 00 00 00 00>
```

### Working with JSON

```javascript
const obj = { name: 'John', age: 30 };

// Convert object to buffer
const json = JSON.stringify(obj);
const buf = Buffer.from(json);

console.log(buf.toString()); // '{"name":"John","age":30}'

// Convert buffer to object
const parsed = JSON.parse(buf.toString());
console.log(parsed); // { name: 'John', age: 30 }

// Buffer in JSON
const bufToJSON = Buffer.from('Hello');
console.log(JSON.stringify(bufToJSON));
// {"type":"Buffer","data":[72,101,108,108,111]}

// Parse back
const parsed2 = JSON.parse('{"type":"Buffer","data":[72,101,108,108,111]}');
const restored = Buffer.from(parsed2.data);
console.log(restored.toString()); // 'Hello'
```

### Cryptography with Buffers

```javascript
const crypto = require('crypto');

// Hash
const hash = crypto.createHash('sha256');
hash.update('password123');
const hashed = hash.digest(); // Returns buffer
console.log(hashed.toString('hex'));

// HMAC
const hmac = crypto.createHmac('sha256', 'secret-key');
hmac.update('data');
const signature = hmac.digest('hex');

// Random bytes
const randomBuffer = crypto.randomBytes(16);
console.log(randomBuffer.toString('hex')); // 32 hex characters

// Encryption
const algorithm = 'aes-256-cbc';
const key = crypto.randomBytes(32);
const iv = crypto.randomBytes(16);

const cipher = crypto.createCipheriv(algorithm, key, iv);
let encrypted = cipher.update('Secret message', 'utf8', 'hex');
encrypted += cipher.final('hex');

// Decryption
const decipher = crypto.createDecipheriv(algorithm, key, iv);
let decrypted = decipher.update(encrypted, 'hex', 'utf8');
decrypted += decipher.final('utf8');
console.log(decrypted); // 'Secret message'
```

### Image Processing Example

```javascript
// Reading image as buffer
const fs = require('fs');
const imageBuffer = fs.readFileSync('image.png');

console.log('Image size:', imageBuffer.length, 'bytes');
console.log('First bytes:', imageBuffer.slice(0, 4).toString('hex'));
// PNG signature: 89504e47

// Check image type
function getImageType(buffer) {
  const signatures = {
    '89504e47': 'PNG',
    'ffd8ffe0': 'JPEG',
    'ffd8ffe1': 'JPEG',
    '47494638': 'GIF'
  };
  
  const sig = buffer.slice(0, 4).toString('hex');
  return signatures[sig] || 'Unknown';
}

console.log('Type:', getImageType(imageBuffer));

// Convert to base64 (for embedding in HTML/JSON)
const base64Image = imageBuffer.toString('base64');
const dataUri = `data:image/png;base64,${base64Image}`;
```

## 🎤 Interview Questions

### Q1: What is a Buffer in Node.js?
**Answer:** Fixed-size chunk of memory for handling binary data. Allocated outside V8 heap. Essential for file I/O, network operations, and binary data.

### Q2: Difference between Buffer.alloc() and Buffer.allocUnsafe()?
**Answer:**
- `Buffer.alloc()`: Slower, memory zeroed (safe)
- `Buffer.allocUnsafe()`: Faster, may contain old data (must initialize)

### Q3: How to convert Buffer to string?
**Answer:**
```javascript
const buf = Buffer.from('Hello');
const str = buf.toString();           // UTF-8
const hex = buf.toString('hex');      // Hexadecimal
const base64 = buf.toString('base64'); // Base64
```

### Q4: Are Buffers mutable or immutable?
**Answer:** Mutable. You can modify buffer contents. Unlike strings which are immutable in JavaScript.

### Q5: What encodings does Buffer support?
**Answer:** utf8, utf16le, latin1, base64, hex, ascii, binary, ucs2

### Q6: Difference between slice() and subarray()?
**Answer:** Both create views (not copies) of original buffer. `subarray()` is alias for `slice()`. Modifying view modifies original.

### Q7: How to concatenate buffers?
**Answer:**
```javascript
const buf1 = Buffer.from('Hello');
const buf2 = Buffer.from('World');
const combined = Buffer.concat([buf1, buf2]);
```

### Q8: What is Buffer pooling?
**Answer:** `Buffer.allocUnsafe()` uses internal buffer pool for performance. Reuses preallocated memory for small buffers.

### Q9: How to read integers from Buffer?
**Answer:**
```javascript
const buf = Buffer.alloc(4);
buf.writeInt32BE(12345, 0);
const num = buf.readInt32BE(0); // 12345
```
BE = Big Endian, LE = Little Endian

### Q10: Can you JSON.stringify() a Buffer?
**Answer:** Yes, converts to `{type: "Buffer", data: [...]}`
```javascript
const buf = Buffer.from('Hi');
JSON.stringify(buf); // '{"type":"Buffer","data":[72,105]}'
```

## 🎯 Best Practices

1. **Use Buffer.alloc() for security**
   ```javascript
   const buf = Buffer.alloc(10); // Safe, zeroed
   ```

2. **Always specify encoding**
   ```javascript
   const buf = Buffer.from('text', 'utf8');
   const str = buf.toString('utf8');
   ```

3. **Use streams for large files**
   ```javascript
   // Bad for large files
   const data = fs.readFileSync('huge.txt');
   
   // Good
   fs.createReadStream('huge.txt').pipe(dest);
   ```

4. **Be careful with slice()**
   ```javascript
   const buf = Buffer.from('Hello');
   const slice = buf.slice(0, 2); // View, not copy!
   slice[0] = 88; // Modifies original too!
   ```

5. **Initialize allocUnsafe buffers**
   ```javascript
   const buf = Buffer.allocUnsafe(10);
   buf.fill(0); // Clear old data
   ```

## 📚 Additional Resources

- [Node.js Buffer API](https://nodejs.org/api/buffer.html)
- [Buffer Tutorial](https://nodejs.dev/learn/nodejs-buffers)

---

[← Previous: Events](./10-events.md) | [Next: Child Process →](./12-child-process.md)
