#!/usr/bin/env node

/**
 * Quick Start Development Server
 * 
 * This script bypasses PowerShell execution policy issues by running the dev server directly.
 * 
 * Usage:
 *   node run-dev.js
 */

const path = require('path');
const { spawn } = require('child_process');

const projectRoot = path.resolve(__dirname, 'BLOOMCARE-main');

console.log('🚀 Starting BloomCare development server...');
console.log(`📁 Project: ${projectRoot}`);
console.log(`🌐 URL: http://localhost:8080`);
console.log('---');

// Run vite dev server
const vite = spawn('npx', ['vite', '--port', '8080'], {
  cwd: projectRoot,
  stdio: 'inherit',
  shell: true,
});

vite.on('error', (error) => {
  console.error('❌ Failed to start dev server:', error.message);
  process.exit(1);
});

vite.on('close', (code) => {
  if (code === 0) {
    console.log('✅ Dev server stopped gracefully');
  } else {
    console.error(`❌ Dev server exited with code ${code}`);
  }
  process.exit(code);
});

// Handle Ctrl+C
process.on('SIGINT', () => {
  console.log('\n⏹️  Stopping dev server...');
  vite.kill();
});
