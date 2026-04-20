// Extend Clerk's JWT session claims with our custom public metadata
declare global {
  interface CustomJwtSessionClaims {
    public_metadata?: {
      role?: 'admin' | 'member' | 'tester';
      hasActiveSubscription?: boolean;
    };
    publicMetadata?: {
      role?: 'admin' | 'member' | 'tester';
      hasActiveSubscription?: boolean;
    };
  }
}

export {}
