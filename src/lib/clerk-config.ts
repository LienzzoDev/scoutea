/**
 * Clerk Configuration
 * 
 * Centralized configuration for Clerk authentication
 */

// Get Clerk environment variables directly to avoid circular dependency
const getClerkEnvVars = () => {
  const publishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
  const secretKey = process.env.CLERK_SECRET_KEY
  const webhookSecret = process.env.CLERK_WEBHOOK_SECRET

  // Validate required Clerk variables
  if (!publishableKey) {
    throw new Error('NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY is required')
  }

  if (!secretKey) {
    throw new Error('CLERK_SECRET_KEY is required')
  }

  return {
    publishableKey,
    secretKey,
    webhookSecret
  }
}

const clerkEnv = getClerkEnvVars()

export const clerkConfig = {
  publishableKey: clerkEnv.publishableKey,
  secretKey: clerkEnv.secretKey,
  webhookSecret: clerkEnv.webhookSecret,
  
  // Appearance configuration
  appearance: {
    variables: {
      colorPrimary: '#f97316', // orange-500
      colorBackground: '#ffffff',
      colorText: '#1e293b',
      colorTextSecondary: '#64748b',
      colorInputBackground: '#ffffff',
      colorBorder: '#e2e8f0',
      colorInputText: '#1e293b',
      borderRadius: '0.5rem',
    },
    elements: {
      formButtonPrimary: 'bg-orange-500 hover:bg-orange-600 text-white',
      card: 'shadow-lg border border-gray-200',
      headerTitle: 'text-2xl font-bold text-gray-900',
      headerSubtitle: 'text-gray-600',
    }
  },
  
  // Localization
  localization: {
    locale: 'es-ES' as const
  },
  
  // Sign-in/up options
  signIn: {
    appearance: {
      elements: {
        rootBox: 'mx-auto',
        card: 'shadow-xl border-0 bg-white',
      }
    }
  },
  
  signUp: {
    appearance: {
      elements: {
        rootBox: 'mx-auto',
        card: 'shadow-xl border-0 bg-white',
      }
    }
  }
}

// Validate Clerk configuration
export function validateClerkConfig() {
  try {
    getClerkEnvVars()
    return true
  } catch (error) {
    console.error('Clerk configuration validation failed:', error)
    return false
  }
}

// Helper to get Clerk URLs
export function getClerkUrls() {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
  
  return {
    signIn: `${baseUrl}/login`,
    signUp: `${baseUrl}/register`,
    afterSignIn: `${baseUrl}/member/dashboard`,
    afterSignUp: `${baseUrl}/member/welcome`,
  }
}