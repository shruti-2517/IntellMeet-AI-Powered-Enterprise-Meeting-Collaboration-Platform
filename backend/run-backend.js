// Run this with: node run-backend.js (from ANY directory)
// It installs dependencies and starts the IntellMeet backend server

const { execSync, spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

const BACKEND_DIR = path.join(__dirname);

console.log('\n🚀 IntellMeet Backend Launcher');
console.log('================================\n');
console.log(`📁 Backend directory: ${BACKEND_DIR}`);

// Step 1: Install dependencies if needed
const nodeModules = path.join(BACKEND_DIR, 'node_modules');
if (!fs.existsSync(nodeModules)) {
  console.log('\n📦 Installing dependencies (first run)...\n');
  try {
    execSync('npm install', { cwd: BACKEND_DIR, stdio: 'inherit' });
    console.log('\n✅ Dependencies installed!\n');
  } catch (err) {
    console.error('❌ npm install failed:', err.message);
    process.exit(1);
  }
} else {
  console.log('✅ node_modules found — skipping install\n');
}

// Step 2: Start the dev server
console.log('🟢 Starting server at http://localhost:5000\n');
console.log('   Press Ctrl+C to stop.\n');
console.log('='.repeat(50) + '\n');

const server = spawn('node', ['server.js'], {
  cwd: BACKEND_DIR,
  stdio: 'inherit',
  env: { ...process.env },
  shell: false,
});

server.on('error', (err) => {
  console.error('Failed to start server:', err.message);
  process.exit(1);
});

server.on('exit', (code) => {
  console.log(`\nServer exited with code ${code}`);
  process.exit(code || 0);
});

process.on('SIGINT', () => {
  console.log('\n\n🛑 Shutting down...');
  server.kill('SIGINT');
});
