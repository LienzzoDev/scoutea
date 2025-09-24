#!/usr/bin/env node

/**
 * Process Cleanup Script
 * 
 * Helps clean up multiple Node.js processes that might be conflicting
 */

const { exec } = require('child_process')
const path = require('path')

function findNodeProcesses() {
  return new Promise((resolve, reject) => {
    exec('ps aux | grep node', (error, stdout, stderr) => {
      if (error) {
        reject(error)
        return
      }
      
      const processes = stdout.split('\n')
        .filter(line => line.includes('node') && !line.includes('grep'))
        .map(line => {
          const parts = line.trim().split(/\s+/)
          return {
            pid: parts[1],
            command: parts.slice(10).join(' ')
          }
        })
        .filter(proc => proc.command.includes('next') || proc.command.includes('dev'))
      
      resolve(processes)
    })
  })
}

function killProcess(pid) {
  return new Promise((resolve) => {
    exec(`kill ${pid}`, (error) => {
      resolve(!error)
    })
  })
}

async function cleanupProcesses() {
  console.log('🧹 Process Cleanup')
  console.log('==================')
  
  try {
    const processes = await findNodeProcesses()
    
    if (processes.length === 0) {
      console.log('✅ No Node.js development processes found')
      return
    }
    
    console.log(`🔍 Found ${processes.length} Node.js development processes:`)
    processes.forEach((proc, index) => {
      console.log(`${index + 1}. PID: ${proc.pid} - ${proc.command}`)
    })
    
    console.log('\n🛑 Stopping processes...')
    
    for (const proc of processes) {
      const success = await killProcess(proc.pid)
      if (success) {
        console.log(`✅ Stopped process ${proc.pid}`)
      } else {
        console.log(`❌ Failed to stop process ${proc.pid}`)
      }
    }
    
    console.log('\n✅ Cleanup complete!')
    console.log('🚀 You can now start your development server with: pnpm dev')
    
  } catch (error) {
    console.error('❌ Error during cleanup:', error.message)
  }
}

// Check if we're on a supported platform
if (process.platform === 'win32') {
  console.log('❌ This script is not supported on Windows')
  console.log('Please manually stop any running Node.js processes and restart your dev server')
  process.exit(1)
}

// Run cleanup
cleanupProcesses()