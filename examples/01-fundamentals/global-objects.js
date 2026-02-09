/**
 * Global Objects - Interview Question
 * "What globals are available in Node.js vs Browser?"
 */

// Timers (same as browser)
console.log('=== Timers ===');
setTimeout(() => console.log('After 1 second'), 1000);
setImmediate(() => console.log('Immediate callback'));
setInterval(() => console.log('Every 2 seconds'), 2000);

// Clear timers
const timer = setTimeout(() => {}, 5000);
clearTimeout(timer);

// __dirname and __filename (not in ES modules!)
console.log('\n=== File Paths ===');
console.log('__dirname:', __dirname);
console.log('__filename:', __filename);

// Buffer (Node.js specific)
console.log('\n=== Buffer ===');
const buf = Buffer.from('Hello');
console.log('Buffer:', buf);
console.log('String:', buf.toString());

// Console methods
console.log('\n=== Console Methods ===');
console.log('Regular log');
console.error('Error message');
console.warn('Warning message');
console.info('Info message');
console.debug('Debug message');

console.table([
  { name: 'Alice', age: 30 },
  { name: 'Bob', age: 25 }
]);

console.time('operation');
// Some operation
console.timeEnd('operation');

console.count('counter');
console.count('counter');
console.countReset('counter');

// Global object
console.log('\n=== Global ===');
global.myGlobalVar = 'I am global';
console.log('Global var:', global.myGlobalVar);

// Process nextTick
console.log('\n=== Next Tick ===');
console.log('1');
process.nextTick(() => console.log('2 - nextTick'));
console.log('3');

// URL and URLSearchParams (WHATWG API)
console.log('\n=== URL ===');
const url = new URL('https://example.com/path?name=John&age=30');
console.log('Hostname:', url.hostname);
console.log('Pathname:', url.pathname);
console.log('Search params:', url.searchParams.get('name'));

// TextEncoder/TextDecoder
console.log('\n=== Text Encoding ===');
const encoder = new TextEncoder();
const decoder = new TextDecoder();
const encoded = encoder.encode('Hello 👋');
console.log('Encoded:', encoded);
console.log('Decoded:', decoder.decode(encoded));
