/**
 * CSV Processing with Streams - Real Interview Question!
 * "Process a large CSV file and transform data"
 */

const fs = require('fs');
const { Transform, pipeline } = require('stream');
const path = require('path');

// Create sample CSV
const csvFile = path.join(__dirname, 'users.csv');
const outputFile = path.join(__dirname, 'users-processed.csv');

// Generate sample data
console.log('Creating sample CSV...');
const csvWriter = fs.createWriteStream(csvFile);
csvWriter.write('id,name,email,age,salary\n');
for (let i = 1; i <= 10000; i++) {
  csvWriter.write(`${i},User${i},user${i}@example.com,${20 + (i % 50)},${30000 + (i % 50000)}\n`);
}
csvWriter.end();

csvWriter.on('finish', () => {
  console.log('Sample CSV created with 10,000 rows\n');
  processCSV();
});

function processCSV() {
  // Custom transform streams
  class CSVParser extends Transform {
    constructor() {
      super({ objectMode: true });
      this.headers = null;
      this.buffer = '';
    }
    
    _transform(chunk, encoding, callback) {
      this.buffer += chunk.toString();
      const lines = this.buffer.split('\n');
      this.buffer = lines.pop(); // Keep incomplete line
      
      lines.forEach(line => {
        if (!line.trim()) return;
        
        if (!this.headers) {
          this.headers = line.split(',');
        } else {
          const values = line.split(',');
          const obj = {};
          this.headers.forEach((header, i) => {
            obj[header] = values[i];
          });
          this.push(obj);
        }
      });
      
      callback();
    }
    
    _flush(callback) {
      if (this.buffer.trim() && this.headers) {
        const values = this.buffer.split(',');
        const obj = {};
        this.headers.forEach((header, i) => {
          obj[header] = values[i];
        });
        this.push(obj);
      }
      callback();
    }
  }
  
  class DataFilter extends Transform {
    constructor(filterFn) {
      super({ objectMode: true });
      this.filterFn = filterFn;
      this.filtered = 0;
      this.total = 0;
    }
    
    _transform(obj, encoding, callback) {
      this.total++;
      if (this.filterFn(obj)) {
        this.push(obj);
      } else {
        this.filtered++;
      }
      callback();
    }
    
    _flush(callback) {
      console.log(`Filtered ${this.filtered} out of ${this.total} records`);
      callback();
    }
  }
  
  class DataTransformer extends Transform {
    constructor(transformFn) {
      super({ objectMode: true });
      this.transformFn = transformFn;
    }
    
    _transform(obj, encoding, callback) {
      const transformed = this.transformFn(obj);
      this.push(transformed);
      callback();
    }
  }
  
  class CSVStringify extends Transform {
    constructor() {
      super({ objectMode: true });
      this.headers = null;
    }
    
    _transform(obj, encoding, callback) {
      if (!this.headers) {
        this.headers = Object.keys(obj);
        this.push(this.headers.join(',') + '\n');
      }
      const values = this.headers.map(h => obj[h]);
      this.push(values.join(',') + '\n');
      callback();
    }
  }
  
  // Process the CSV
  console.log('Processing CSV...');
  
  const startTime = Date.now();
  const startMemory = process.memoryUsage().heapUsed;
  
  pipeline(
    fs.createReadStream(csvFile),
    new CSVParser(),
    // Filter: only users with age > 30
    new DataFilter(user => parseInt(user.age) > 30),
    // Transform: add bonus field
    new DataTransformer(user => ({
      ...user,
      bonus: parseInt(user.salary) * 0.1,
      processed: new Date().toISOString()
    })),
    new CSVStringify(),
    fs.createWriteStream(outputFile),
    (err) => {
      if (err) {
        console.error('Pipeline error:', err);
      } else {
        const duration = Date.now() - startTime;
        const memoryUsed = process.memoryUsage().heapUsed - startMemory;
        
        console.log(`\nProcessing complete in ${duration}ms`);
        console.log(`Memory used: ${Math.round(memoryUsed / 1024 / 1024)}MB`);
        console.log(`Output: ${outputFile}`);
        
        // Show sample output
        const output = fs.readFileSync(outputFile, 'utf8');
        const lines = output.split('\n').slice(0, 5);
        console.log('\nSample output:');
        lines.forEach(line => console.log(line));
        
        // Cleanup
        setTimeout(() => {
          fs.unlinkSync(csvFile);
          fs.unlinkSync(outputFile);
          console.log('\nTest files cleaned up');
        }, 1000);
      }
    }
  );
}

/* KEY CONCEPTS FOR INTERVIEWS:
1. Use streams for large files (memory efficient)
2. pipeline() automatically handles errors and cleanup
3. objectMode for working with objects instead of buffers
4. Transform streams for data processing
5. Backpressure is handled automatically by streams
*/
