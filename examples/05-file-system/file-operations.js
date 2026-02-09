/**
 * File System Operations - Interview Questions
 * "Implement common file operations efficiently"
 */

const fs = require('fs').promises;
const path = require('path');

// Setup
const testDir = path.join(__dirname, 'test-files');

async function setupTestEnv() {
  try {
    await fs.mkdir(testDir, { recursive: true });
    console.log('Test directory created\n');
  } catch (err) {
    console.error('Setup error:', err);
  }
}

// 1. Read/Write operations
async function basicOperations() {
  console.log('=== Basic Operations ===');
  
  const file = path.join(testDir, 'test.txt');
  
  // Write
  await fs.writeFile(file, 'Hello, World!');
  console.log('File written');
  
  // Read
  const content = await fs.readFile(file, 'utf8');
  console.log('Content:', content);
  
  // Append
  await fs.appendFile(file, '\nAppended line');
  console.log('Content appended');
  
  // Read again
  const updated = await fs.readFile(file, 'utf8');
  console.log('Updated:', updated);
  console.log();
}

// 2. Directory operations
async function directoryOperations() {
  console.log('=== Directory Operations ===');
  
  // Create nested directories
  const nested = path.join(testDir, 'a', 'b', 'c');
  await fs.mkdir(nested, { recursive: true });
  console.log('Nested dirs created');
  
  // List directory
  const files = await fs.readdir(testDir);
  console.log('Files:', files);
  
  // List with file types
  const entries = await fs.readdir(testDir, { withFileTypes: true });
  entries.forEach(entry => {
    console.log(`${entry.name} - ${entry.isDirectory() ? 'DIR' : 'FILE'}`);
  });
  console.log();
}

// 3. File stats and metadata
async function fileStats() {
  console.log('=== File Stats ===');
  
  const file = path.join(testDir, 'test.txt');
  const stats = await fs.stat(file);
  
  console.log('Size:', stats.size, 'bytes');
  console.log('Created:', stats.birthtime);
  console.log('Modified:', stats.mtime);
  console.log('Is file:', stats.isFile());
  console.log('Is directory:', stats.isDirectory());
  console.log();
}

// 4. Copy file (multiple methods)
async function copyFile() {
  console.log('=== Copy File ===');
  
  const source = path.join(testDir, 'test.txt');
  const dest = path.join(testDir, 'test-copy.txt');
  
  // Method 1: fs.copyFile
  await fs.copyFile(source, dest);
  console.log('File copied using fs.copyFile');
  
  // Method 2: Read and write
  const content = await fs.readFile(source);
  await fs.writeFile(dest + '2', content);
  console.log('File copied using read/write');
  console.log();
}

// 5. Move/Rename file
async function moveFile() {
  console.log('=== Move/Rename File ===');
  
  const oldPath = path.join(testDir, 'test-copy.txt');
  const newPath = path.join(testDir, 'renamed.txt');
  
  await fs.rename(oldPath, newPath);
  console.log('File renamed');
  console.log();
}

// 6. Delete operations
async function deleteOperations() {
  console.log('=== Delete Operations ===');
  
  // Delete file
  const file = path.join(testDir, 'test-copy.txt2');
  await fs.unlink(file);
  console.log('File deleted');
  
  // Delete empty directory
  const emptyDir = path.join(testDir, 'a', 'b', 'c');
  await fs.rmdir(emptyDir);
  console.log('Empty dir deleted');
  
  // Delete directory recursively
  const dir = path.join(testDir, 'a');
  await fs.rm(dir, { recursive: true, force: true });
  console.log('Directory tree deleted');
  console.log();
}

// 7. Check file existence
async function checkExists() {
  console.log('=== Check Existence ===');
  
  const file = path.join(testDir, 'test.txt');
  const nonExistent = path.join(testDir, 'does-not-exist.txt');
  
  // Method 1: Using fs.access
  try {
    await fs.access(file);
    console.log('File exists (access)');
  } catch {
    console.log('File does not exist');
  }
  
  // Method 2: Using fs.stat
  try {
    await fs.stat(file);
    console.log('File exists (stat)');
  } catch {
    console.log('File does not exist');
  }
  
  try {
    await fs.access(nonExistent);
  } catch {
    console.log('Non-existent file confirmed');
  }
  console.log();
}

// 8. Watch for file changes
async function watchFile() {
  console.log('=== Watch File (run for 5 seconds) ===');
  
  const file = path.join(testDir, 'watched.txt');
  await fs.writeFile(file, 'Initial content');
  
  const watcher = fs.watch(testDir);
  
  setTimeout(() => {
    fs.appendFile(file, '\nModified!');
  }, 1000);
  
  setTimeout(async () => {
    watcher.close();
    console.log('Watcher closed\n');
    
    // Cleanup
    await cleanup();
  }, 5000);
  
  for await (const event of watcher) {
    console.log('Event:', event.eventType, 'File:', event.filename);
  }
}

// 9. Cleanup
async function cleanup() {
  try {
    await fs.rm(testDir, { recursive: true, force: true });
    console.log('Test directory cleaned up');
  } catch (err) {
    console.error('Cleanup error:', err);
  }
}

// Run all examples
async function main() {
  await setupTestEnv();
  await basicOperations();
  await directoryOperations();
  await fileStats();
  await copyFile();
  await moveFile();
  await deleteOperations();
  await checkExists();
  await watchFile();
}

main().catch(console.error);

/* INTERVIEW TIPS:
1. Always use async/await with fs.promises
2. Use recursive: true for nested directories
3. Use force: true when deleting to avoid errors
4. Check file existence with fs.access (faster than stat)
5. Use streams for large files
6. Handle errors properly with try/catch
*/
