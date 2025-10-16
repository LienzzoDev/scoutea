import { prisma } from '@/lib/db'

import { logger } from '../logging/production-logger'

export interface UserSyncResult {
  success: boolean;
  message: string;
  userId?: string;
}

export class UserSyncService {
  static async syncUser(userId: string): Promise<UserSyncResult> {
    try {
      // Mock implementation - replace with actual user sync logic
      logger.info('Syncing user', { userId });
      
      // Simulate sync operation
      await new Promise(resolve => setTimeout(resolve, 100));
      
      return {
        success: true,
        message: 'User synced successfully',
        userId
      };
    } catch (error) {
      return {
        success: false,
        message: `Failed to sync user: ${error}`
      };
    }
  }

  static async getUserSyncStatus(_userId: string): Promise<{ synced: boolean; lastSync?: Date }> {
    // Mock implementation
    return {
      synced: true,
      lastSync: new Date()
    };
  }
}

export async function getOrCreateUser(clerkId: string) {
  try {
    console.log('🔍 getOrCreateUser: Looking for user with clerkId:', clerkId);
    
    // Intentar encontrar el usuario existente
    let user = await prisma.usuario.findUnique({
      where: { clerkId }
    });

    if (user) {
      console.log('✅ getOrCreateUser: User found:', user.id);
      return user;
    }

    // Si no existe, crear uno nuevo
    console.log('➕ getOrCreateUser: Creating new user...');
    user = await prisma.usuario.create({
      data: {
        clerkId,
        email: `user-${clerkId}@temp.com`, // Email temporal, se actualizará con webhook
        firstName: 'Usuario',
        lastName: 'Nuevo',
        profileCompleted: false
      }
    });

    console.log('✅ getOrCreateUser: User created:', user.id);
    return user;
  } catch (error) {
    console.error('❌ getOrCreateUser: Error:', error);
    throw error;
  }
}