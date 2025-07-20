#!/usr/bin/env node

// Keep Server Running - Process Manager for Afropop Operations Manual
// This script ensures the server stays running and restarts if it crashes

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Afropop Operations Manual - Process Manager');
console.log('===============================================');
console.log('This will keep your server running continuously...\n');

let server = null;
let restartCount = 0;
const maxRestarts = 10;
const restartDelay = 3000; // 3 seconds

function startServer() {
    console.log(`⚡ Starting server (attempt ${restartCount + 1})...`);
    
    server = spawn('npm', ['start'], {
        stdio: 'inherit',
        shell: true
    });

    server.on('close', (code) => {
        console.log(`\n💥 Server stopped with code ${code}`);
        
        if (code !== 0 && restartCount < maxRestarts) {
            restartCount++;
            console.log(`🔄 Restarting in ${restartDelay/1000} seconds...`);
            setTimeout(startServer, restartDelay);
        } else if (restartCount >= maxRestarts) {
            console.log('❌ Max restart attempts reached. Please check for errors.');
            process.exit(1);
        } else {
            console.log('✅ Server stopped gracefully');
            process.exit(0);
        }
    });

    server.on('error', (error) => {
        console.error('❌ Failed to start server:', error);
    });
}

// Handle graceful shutdown
process.on('SIGINT', () => {
    console.log('\n🛑 Shutdown signal received...');
    if (server) {
        console.log('🔄 Stopping server gracefully...');
        server.kill('SIGTERM');
        setTimeout(() => {
            server.kill('SIGKILL');
            process.exit(0);
        }, 5000);
    } else {
        process.exit(0);
    }
});

process.on('SIGTERM', () => {
    console.log('\n🛑 Termination signal received...');
    if (server) {
        server.kill('SIGTERM');
    }
    process.exit(0);
});

// Start the server
startServer();

console.log('Press Ctrl+C to stop the server');
console.log('===============================================');