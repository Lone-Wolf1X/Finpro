#!/usr/bin/env node

/**
 * Smart Dev Starter
 * 1. Start frontend first (fast)
 * 2. Compile backend in background
 * 3. Start backend
 */

const { spawn } = require('child_process');

console.log('🎨 Starting Frontend first...\n');

// Start frontend immediately
const frontend = spawn('npm', ['run', 'dev'], {
    cwd: './frontend',
    shell: true,
    stdio: 'inherit'
});

console.log('🔨 Compiling backend in background...\n');

// Compile backend
const compile = spawn('mvn', ['clean', 'compile'], {
    cwd: './backend',
    shell: true,
    stdio: 'pipe'
});

compile.on('close', (code) => {
    if (code === 0) {
        console.log('✅ Backend compiled successfully!\n');
        console.log('🚀 Starting Backend...\n');

        // Start backend after compilation
        const backend = spawn('mvn', ['spring-boot:run'], {
            cwd: './backend',
            shell: true,
            stdio: 'inherit'
        });

        // Handle exit
        process.on('SIGINT', () => {
            console.log('\n🛑 Shutting down...');
            frontend.kill();
            backend.kill();
            process.exit();
        });
    } else {
        console.error('❌ Backend compilation failed!');
        frontend.kill();
        process.exit(1);
    }
});
