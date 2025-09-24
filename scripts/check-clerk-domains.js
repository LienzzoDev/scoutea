#!/usr/bin/env node

/**
 * Script to check and suggest Clerk domains for CSP configuration
 */

const fs = require('fs')
const path = require('path')

function extractClerkDomains() {
  const envPath = path.join(process.cwd(), '.env')
  const envExamplePath = path.join(process.cwd(), '.env.example')
  
  let clerkPublishableKey = ''
  
  // Try to read from .env first, then .env.example
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8')
    const match = envContent.match(/NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=["']?([^"'\n]+)["']?/)
    if (match) {
      clerkPublishableKey = match[1]
    }
  } else if (fs.existsSync(envExamplePath)) {
    const envContent = fs.readFileSync(envExamplePath, 'utf8')
    const match = envContent.match(/NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=["']?([^"'\n]+)["']?/)
    if (match) {
      clerkPublishableKey = match[1]
    }
  }
  
  if (!clerkPublishableKey || clerkPublishableKey.includes('...')) {
    console.log('❌ No valid Clerk publishable key found in environment files')
    console.log('📝 Please set NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY in your .env file')
    return
  }
  
  // Extract instance from publishable key
  // Format: pk_test_<instance>_<hash> or pk_live_<instance>_<hash>
  const keyParts = clerkPublishableKey.split('_')
  if (keyParts.length < 3) {
    console.log('❌ Invalid Clerk publishable key format')
    return
  }
  
  const instance = keyParts[2]
  const isTest = keyParts[1] === 'test'
  
  console.log('🔍 Clerk Configuration Analysis')
  console.log('================================')
  console.log(`Environment: ${isTest ? 'Test' : 'Production'}`)
  console.log(`Instance: ${instance}`)
  console.log('')
  
  // Generate domain suggestions
  const domains = [
    `https://${instance}.clerk.accounts.dev`,
    `https://clerk.${instance}.lcl.dev`, // Local development
    'https://api.clerk.com',
    'https://clerk.com',
    'https://img.clerk.com'
  ]
  
  console.log('📋 Suggested CSP Domains:')
  console.log('==========================')
  domains.forEach(domain => {
    console.log(`  ${domain}`)
  })
  
  console.log('')
  console.log('🔧 Required CSP Directives for Clerk:')
  console.log('')
  console.log('script-src: Add the clerk.accounts.dev domain')
  console.log('connect-src: Add api.clerk.com and clerk.accounts.dev domain')
  console.log('img-src: Add img.clerk.com')
  console.log('frame-src: Add clerk.accounts.dev domain if using embedded components')
  console.log('worker-src: Add blob: and clerk.accounts.dev domain (IMPORTANT for web workers)')
  console.log('child-src: Add blob: and clerk.accounts.dev domain (fallback for older browsers)')
  console.log('')
  
  // Check current next.config.ts
  const nextConfigPath = path.join(process.cwd(), 'next.config.ts')
  if (fs.existsSync(nextConfigPath)) {
    const configContent = fs.readFileSync(nextConfigPath, 'utf8')
    const hasClerkDomains = configContent.includes('clerk.accounts.dev')
    const hasWorkerSrc = configContent.includes('worker-src')
    const hasBlobSupport = configContent.includes('blob:')
    
    console.log('📋 CSP Configuration Check:')
    console.log('===========================')
    console.log(`✅ Clerk domains: ${hasClerkDomains ? 'Found' : 'Missing'}`)
    console.log(`${hasWorkerSrc ? '✅' : '❌'} worker-src directive: ${hasWorkerSrc ? 'Found' : 'Missing'}`)
    console.log(`${hasBlobSupport ? '✅' : '❌'} blob: support: ${hasBlobSupport ? 'Found' : 'Missing'}`)
    
    if (!hasWorkerSrc || !hasBlobSupport) {
      console.log('')
      console.log('⚠️  Missing critical CSP directives for Clerk web workers!')
      console.log('   Add: worker-src \'self\' blob: https://*.clerk.accounts.dev')
      console.log('   Add: child-src \'self\' blob: https://*.clerk.accounts.dev')
    }
  }
}

// Run the analysis
extractClerkDomains()