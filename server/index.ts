#!/usr/bin/env node

// Simple server that starts the Discord bots
import { spawn } from 'child_process';
import path from 'path';

console.log('🚀 Starting Discord monitoring system...');

const botsDir = path.join(process.cwd(), 'bots');
const startScript = path.join(botsDir, 'start-bots.js');

// Start the bots
const botProcess = spawn('node', [startScript], {
  cwd: botsDir,
  stdio: 'inherit'
});

botProcess.on('error', (error) => {
  console.error('❌ Failed to start bots:', error);
  process.exit(1);
});

botProcess.on('exit', (code) => {
  console.log(`🔄 Bot process exited with code ${code}`);
  if (code !== 0) {
    process.exit(code);
  }
});

// Keep the process alive
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down Discord monitoring system...');
  botProcess.kill();
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('🛑 Received SIGTERM, shutting down...');
  botProcess.kill();
  process.exit(0);
});