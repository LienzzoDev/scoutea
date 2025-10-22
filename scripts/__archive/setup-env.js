#!/usr/bin/env node

/**
 * Script to help setup environment variables
 */

const fs = require('fs')
const path = require('path')

function setupEnvironment() {
  const envPath = path.join(process.cwd(), '.env')
  const envExamplePath = path.join(process.cwd(), '.env.example')
  
  console.log('🔧 Environment Setup Helper')
  console.log('============================')
  
  // Check if .env exists
  if (fs.existsSync(envPath)) {
    console.log('✅ .env file found')
    
    // Read and validate .env
    const envContent = fs.readFileSync(envPath, 'utf8')
    const requiredVars = [
      'NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY',
      'CLERK_SECRET_KEY'
    ]
    
    const optionalVars = [
      'DATABASE_URL',
      'STRIPE_SECRET_KEY',
      'NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY',
      'NEXT_PUBLIC_APP_URL'
    ]
    
    console.log('\n📋 Required Variables:')
    requiredVars.forEach(varName => {
      const hasVar = envContent.includes(`${varName}=`)
      console.log(`  ${hasVar ? '✅' : '❌'} ${varName}`)
    })
    
    console.log('\n📋 Optional Variables:')
    optionalVars.forEach(varName => {
      const hasVar = envContent.includes(`${varName}=`)
      console.log(`  ${hasVar ? '✅' : '⚠️ '} ${varName} ${hasVar ? '' : '(optional in development)'}`)
    })
    
  } else {
    console.log('❌ .env file not found')
    
    if (fs.existsSync(envExamplePath)) {
      console.log('📄 .env.example found - copying to .env')
      fs.copyFileSync(envExamplePath, envPath)
      console.log('✅ Created .env from .env.example')
      console.log('🔧 Please edit .env with your actual values')
    } else {
      console.log('❌ .env.example not found')
      console.log('🔧 Creating basic .env file...')
      
      const basicEnv = `# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_your_key_here
CLERK_SECRET_KEY=sk_test_your_key_here
CLERK_WEBHOOK_SECRET=whsec_your_webhook_secret_here

# Database (optional in development)
DATABASE_URL="postgresql://username:password@localhost:5432/database_name"

# Stripe (optional in development)
STRIPE_SECRET_KEY=sk_test_your_stripe_key_here
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_key_here
STRIPE_WEBHOOK_SECRET=whsec_your_stripe_webhook_secret_here

# App Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXTAUTH_SECRET=your_nextauth_secret_here
NEXTAUTH_URL=http://localhost:3000

# Environment
NODE_ENV=development
`
      
      fs.writeFileSync(envPath, basicEnv)
      console.log('✅ Created basic .env file')
    }
  }
  
  console.log('\n🚀 Next Steps:')
  console.log('1. Edit .env with your actual Clerk keys')
  console.log('2. Get Clerk keys from: https://dashboard.clerk.com/')
  console.log('3. Run: pnpm dev')
  console.log('4. Check the debug panels in your browser (development only)')
}

// Run the setup
setupEnvironment()