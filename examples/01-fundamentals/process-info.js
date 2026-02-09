/**
 * Process Information - Common Interview Question
 * Companies ask: "How do you access environment variables and process info?"
 */

// Environment variables
console.log('Environment:', process.env.NODE_ENV || 'development');
console.log('Custom var:', process.env.API_KEY || 'not set');

// Process information
console.log('\n=== Process Info ===');
console.log('Process ID:', process.pid);
console.log('Parent PID:', process.ppid);
console.log('Node version:', process.version);
console.log('Platform:', process.platform);
console.log('Architecture:', process.arch);
console.log('Current directory:', process.cwd());
console.log('Uptime:', process.uptime(), 'seconds');

// Memory usage
console.log('\n=== Memory Usage ===');
const memory = process.memoryUsage();
console.log('RSS:', Math.round(memory.rss / 1024 / 1024), 'MB');
console.log('Heap Total:', Math.round(memory.heapTotal / 1024 / 1024), 'MB');
console.log('Heap Used:', Math.round(memory.heapUsed / 1024 / 1024), 'MB');

// CPU usage
console.log('\n=== CPU Usage ===');
console.log(process.cpuUsage());

// Command line arguments
console.log('\n=== Arguments ===');
console.log('All args:', process.argv);
console.log('Script args:', process.argv.slice(2));

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\nReceived SIGINT, shutting down gracefully...');
  // Cleanup code here
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\nReceived SIGTERM, shutting down gracefully...');
  process.exit(0);
});

// Run: node process-info.js arg1 arg2
// Run with env: NODE_ENV=production API_KEY=secret123 node process-info.js
