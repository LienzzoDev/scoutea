#!/usr/bin/env node

/**
 * Network Diagnostics Script
 * 
 * Helps diagnose network and port issues
 */

const http = require('http')
const https = require('https')

function checkPort(port, protocol = 'http') {
  return new Promise((resolve) => {
    const client = protocol === 'https' ? https : http
    
    const req = client.request({
      hostname: 'localhost',
      port: port,
      path: '/api/test',
      method: 'GET',
      timeout: 5000
    }, (res) => {
      let data = ''
      res.on('data', chunk => data += chunk)
      res.on('end', () => {
        resolve({
          port,
          status: 'success',
          statusCode: res.statusCode,
          data: data ? JSON.parse(data) : null
        })
      })
    })
    
    req.on('error', (err) => {
      resolve({
        port,
        status: 'error',
        error: err.message
      })
    })
    
    req.on('timeout', () => {
      req.destroy()
      resolve({
        port,
        status: 'timeout',
        error: 'Request timeout'
      })
    })
    
    req.end()
  })
}

async function diagnoseNetwork() {
  console.log('🔍 Network Diagnostics')
  console.log('======================')
  
  const portsToCheck = [3000, 3001, 8080, 8000]
  
  console.log('📡 Checking ports...')
  
  for (const port of portsToCheck) {
    const result = await checkPort(port)
    
    if (result.status === 'success') {
      console.log(`✅ Port ${port}: ${result.statusCode} - ${result.data?.message || 'OK'}`)
      if (result.data) {
        console.log(`   Origin: ${result.data.origin}`)
        console.log(`   Host: ${result.data.host}`)
      }
    } else {
      console.log(`❌ Port ${port}: ${result.error}`)
    }
  }
  
  console.log('\n🌐 Environment Info:')
  console.log(`   Node.js: ${process.version}`)
  console.log(`   Platform: ${process.platform}`)
  console.log(`   Architecture: ${process.arch}`)
  
  console.log('\n📋 Process Info:')
  console.log(`   PID: ${process.pid}`)
  console.log(`   Working Directory: ${process.cwd()}`)
  
  console.log('\n🔧 Recommendations:')
  console.log('1. Make sure your Next.js dev server is running on port 3000')
  console.log('2. Check for any proxy or network configuration')
  console.log('3. Clear browser cache and hard refresh')
  console.log('4. Check for any running processes on conflicting ports')
  
  // Check for running processes (macOS/Linux)
  if (process.platform !== 'win32') {
    console.log('\n🔍 Checking for processes on common ports...')
    const { exec } = require('child_process')
    
    exec('lsof -i :3000,3001', (error, stdout, stderr) => {
      if (stdout) {
        console.log('Processes found:')
        console.log(stdout)
      } else {
        console.log('No processes found on ports 3000 or 3001')
      }
    })
  }
}

// Run diagnostics
diagnoseNetwork().catch(console.error)