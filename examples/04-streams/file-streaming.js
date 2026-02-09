/**
 * File Streaming - Interview Question
 * "How do you process large files without loading them into memory?"
 */

const fs = require('fs');
const path = require('path');

// Create a large test file
const testFile = path.join(__dirname, 'large-file.txt');
const writeStream = fs.createWriteStream(testFile);

// Write 10MB of data
console.log('Creating 10MB test file...');
for (let i = 0; i < 100000; i++) {
  writeStream.write(`Line ${i}: ${'x'.repeat(100)}\n`);
}
writeStream.end();

writeStream.on('finish', () => {
  console.log('Test file created!\n');
  
  // BAD: Loading entire file into memory
  console.log('=== BAD: readFileSync (loads all into memory) ===');
  const startBad = process.memoryUsage().heapUsed;
  const dataBad = fs.readFileSync(testFile, 'utf8');
  const endBad = process.memoryUsage().heapUsed;
  console.log('Lines read:', dataBad.split('\n').length);
  console.log('Memory used:', Math.round((endBad - startBad) / 1024 / 1024), 'MB\n');
  
  // GOOD: Streaming (processes in chunks)
  console.log('=== GOOD: createReadStream (chunks) ===');
  const startGood = process.memoryUsage().heapUsed;
  const readStream = fs.createReadStream(testFile, {
    encoding: 'utf8',
    highWaterMark: 64 * 1024 // 64KB chunks
  });
  
  let lineCount = 0;
  let buffer = '';
  
  readStream.on('data', (chunk) => {
    buffer += chunk;
    const lines = buffer.split('\n');
    buffer = lines.pop(); // Keep incomplete line
    lineCount += lines.length;
  });
  
  readStream.on('end', () => {
    if (buffer) lineCount++; // Last line
    const endGood = process.memoryUsage().heapUsed;
    console.log('Lines read:', lineCount);
    console.log('Memory used:', Math.round((endGood - startGood) / 1024 / 1024), 'MB\n');
    
    // Copy file using streams (efficient)
    console.log('=== Copying file with streams ===');
    const source = fs.createReadStream(testFile);
    const dest = fs.createWriteStream(testFile + '.copy');
    
    source.pipe(dest);
    
    dest.on('finish', () => {
      console.log('File copied successfully!');
      
      // Cleanup
      fs.unlinkSync(testFile);
      fs.unlinkSync(testFile + '.copy');
      console.log('Test files cleaned up');
    });
  });
  
  readStream.on('error', (err) => {
    console.error('Read error:', err);
  });
});

// Transform stream example
const { Transform } = require('stream');

class UpperCaseTransform extends Transform {
  _transform(chunk, encoding, callback) {
    const upperChunk = chunk.toString().toUpperCase();
    this.push(upperChunk);
    callback();
  }
}

// Usage:
// fs.createReadStream('input.txt')
//   .pipe(new UpperCaseTransform())
//   .pipe(fs.createWriteStream('output.txt'));
