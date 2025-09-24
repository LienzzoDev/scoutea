export interface User {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'member' | 'scout';
  profileComplete: boolean;
  subscriptionStatus: 'active' | 'inactive' | 'trial';
  createdAt: Date;
  updatedAt: Date;
}

export interface UserProfile {
  userId: string;
  firstName: string;
  lastName: string;
  phone?: string;
  organization?: string;
  preferences: Record<string, any>;
}

export class UserService {
  static async getUserById(id: string): Promise<User | null> {
    // Mock implementation - replace with actual database query
    return {
      id,
      email: 'user@example.com',
      name: 'Sample User',
      role: 'member',
      profileComplete: true,
      subscriptionStatus: 'active',
      createdAt: new Date(),
      updatedAt: new Date()
    };
  }

  static async getUserByEmail(email: string): Promise<User | null> {
    // Mock implementation
    return {
      id: '1',
      email,
      name: 'Sample User',
      role: 'member',
      profileComplete: true,
      subscriptionStatus: 'active',
      createdAt: new Date(),
      updatedAt: new Date()
    };
  }

  static async createUser(userData: Omit<User, 'id' | 'createdAt' | 'updatedAt'>): Promise<User> {
    // Mock implementation
    return {
      ...userData,
      id: Math.random().toString(36).substr(2, 9),
      createdAt: new Date(),
      updatedAt: new Date()
    };
  }

  static async updateUser(id: string, updates: Partial<User>): Promise<User | null> {
    // Mock implementation
    const user = await this.getUserById(id);
    if (!user) return null;
    
    return {
      ...user,
      ...updates,
      updatedAt: new Date()
    };
  }

  static async getUserProfileStatus(_userId: string): Promise<{ complete: boolean; missingFields: string[] }> {
    // Mock implementation
    return {
      complete: true,
      missingFields: []
    };
  }

  static async updateUserProfile(userId: string, profile: Partial<UserProfile>): Promise<UserProfile> {
    // Mock implementation
    return {
      userId,
      firstName: profile.firstName || 'John',
      lastName: profile.lastName || 'Doe',
      ...(profile.phone !== undefined && { phone: profile.phone }),
      ...(profile.organization !== undefined && { organization: profile.organization }),
      preferences: profile.preferences || {}
    };
  }
}