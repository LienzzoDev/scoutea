import { clerkClient } from '@clerk/nextjs/server'

import { UserRole } from '@/lib/auth/role-utils'
import { prisma } from '@/lib/db'

export interface CreateUserInput {
  email: string
  firstName: string
  lastName: string
  role: UserRole
  redirectUrl?: string
}

export interface ClerkUser {
  id: string
  email: string
  firstName: string | null
  lastName: string | null
  role: UserRole
  createdAt: number
  hasActiveSubscription: boolean
}

export interface PendingInvitation {
  id: string
  email: string
  role: UserRole
  createdAt: number
  status: 'pending'
  isPending: true
}

export class UserManagementService {
  /**
   * Creates an invitation for a new user with the specified role
   * Clerk will automatically send an invitation email to the user
   * If an invitation already exists for this email, it will be revoked first
   */
  static async createUser(input: CreateUserInput): Promise<{ invitationId: string; email: string }> {
    const client = await clerkClient()

    // Determine redirect URL based on environment
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    const redirectUrl = input.redirectUrl || `${baseUrl}/register`

    try {
      // Try to revoke any existing pending invitations for this email
      await this.revokeInvitationByEmail(input.email)
    } catch (error) {
      // If no invitation exists or error revoking, continue anyway
      console.log('No existing invitation to revoke or error revoking:', error)
    }

    // Create invitation in Clerk (automatically sends email)
    const invitation = await client.invitations.createInvitation({
      emailAddress: input.email,
      redirectUrl,
      publicMetadata: {
        role: input.role,
        firstName: input.firstName,
        lastName: input.lastName,
        hasActiveSubscription: false,
      },
      notify: true, // Send invitation email automatically
    })

    return {
      invitationId: invitation.id,
      email: invitation.emailAddress,
    }
  }

  /**
   * Revokes a pending invitation by email address
   */
  static async revokeInvitationByEmail(email: string): Promise<void> {
    const client = await clerkClient()

    // Get all pending invitations
    const invitations = await client.invitations.getInvitationList({
      status: 'pending',
    })

    // Find invitation for this email
    const existingInvitation = invitations.data.find(
      inv => inv.emailAddress.toLowerCase() === email.toLowerCase()
    )

    if (existingInvitation) {
      // Revoke the existing invitation
      await client.invitations.revokeInvitation(existingInvitation.id)
      console.log(`Revoked existing invitation for ${email}`)
    }
  }

  /**
   * Syncs users from Clerk to the database
   * Creates or updates users in the database to match Clerk
   */
  static async syncUsersToDatabase(): Promise<void> {
    const client = await clerkClient()

    try {
      // Get all users from Clerk
      const { data: clerkUsers } = await client.users.getUserList({
        limit: 500, // Increased limit to handle more users
      })

      console.log(`Syncing ${clerkUsers.length} users from Clerk to database...`)

      // Sync each user to the database
      for (const clerkUser of clerkUsers) {
        const email = clerkUser.emailAddresses[0]?.emailAddress
        if (!email) {
          console.warn(`User ${clerkUser.id} has no email, skipping...`)
          continue
        }

        const userData = {
          clerkId: clerkUser.id,
          email,
          firstName: clerkUser.firstName || '',
          lastName: clerkUser.lastName || '',
        }

        try {
          // Upsert: create if doesn't exist, update if exists
          await prisma.usuario.upsert({
            where: { clerkId: clerkUser.id },
            update: userData,
            create: userData,
          })
        } catch (error) {
          console.error(`Error syncing user ${email}:`, error)
          // Continue with other users even if one fails
        }
      }

      console.log('User sync completed successfully')
    } catch (error) {
      console.error('Error syncing users from Clerk:', error)
      throw new Error('Failed to sync users from Clerk to database')
    }
  }

  /**
   * Lists all users from Clerk
   */
  static async listUsers(): Promise<ClerkUser[]> {
    const client = await clerkClient()

    const { data: users } = await client.users.getUserList({
      limit: 500,
    })

    return users.map(user => {
      // Check for subscription status in multiple formats
      const metadata = user.publicMetadata
      let hasActiveSubscription = false

      // Format 1: hasActiveSubscription boolean
      if (typeof metadata.hasActiveSubscription === 'boolean') {
        hasActiveSubscription = metadata.hasActiveSubscription
      }
      // Format 2: status string (e.g., "active", "inactive")
      else if (typeof metadata.status === 'string') {
        hasActiveSubscription = metadata.status === 'active'
      }
      // Format 3: subscriptionStatus string
      else if (typeof metadata.subscriptionStatus === 'string') {
        hasActiveSubscription = metadata.subscriptionStatus === 'active'
      }
      // Format 4: subscription.status nested object (Stripe integration format)
      else if (metadata.subscription && typeof metadata.subscription === 'object') {
        const subscription = metadata.subscription as { status?: string }
        if (subscription.status === 'active') {
          hasActiveSubscription = true
        }
      }

      return {
        id: user.id,
        email: user.emailAddresses[0]?.emailAddress ?? '',
        firstName: user.firstName,
        lastName: user.lastName,
        role: (metadata.role as UserRole) || 'member',
        createdAt: user.createdAt,
        hasActiveSubscription,
      }
    })
  }

  /**
   * Lists all pending invitations from Clerk
   */
  static async listPendingInvitations(): Promise<PendingInvitation[]> {
    const client = await clerkClient()

    const invitations = await client.invitations.getInvitationList({
      status: 'pending',
    })

    return invitations.data.map(invitation => ({
      id: invitation.id,
      email: invitation.emailAddress,
      role: (invitation.publicMetadata?.role as UserRole) || 'member',
      createdAt: invitation.createdAt,
      status: 'pending' as const,
      isPending: true as const,
    }))
  }

  /**
   * Lists all users and pending invitations combined
   */
  static async listUsersAndInvitations(): Promise<Array<ClerkUser | PendingInvitation>> {
    const [users, invitations] = await Promise.all([
      this.listUsers(),
      this.listPendingInvitations(),
    ])

    // Combine and sort by createdAt (newest first)
    return [...users, ...invitations].sort((a, b) => b.createdAt - a.createdAt)
  }

  /**
   * Updates user role in Clerk
   */
  static async updateUserRole(userId: string, role: UserRole): Promise<void> {
    const client = await clerkClient()

    await client.users.updateUserMetadata(userId, {
      publicMetadata: {
        role,
      },
    })
  }

  /**
   * Updates user subscription status
   * Sets both hasActiveSubscription (boolean) and status (string) for compatibility
   */
  static async updateUserSubscription(userId: string, hasActiveSubscription: boolean): Promise<void> {
    const client = await clerkClient()

    await client.users.updateUserMetadata(userId, {
      publicMetadata: {
        hasActiveSubscription,
        status: hasActiveSubscription ? 'active' : 'inactive',
      },
    })
  }

  /**
   * Deletes a user from Clerk and the database, or revokes an invitation
   */
  static async deleteUser(userId: string): Promise<void> {
    const client = await clerkClient()

    try {
      // Check if this is an invitation ID (invitations start with 'inv_')
      if (userId.startsWith('inv_')) {
        console.log(`Revoking invitation: ${userId}`)
        await client.invitations.revokeInvitation(userId)
        console.log(`Invitation revoked successfully: ${userId}`)
      } else {
        console.log(`Deleting user: ${userId}`)

        // First, delete the user from the database if they exist
        try {
          const dbUser = await prisma.usuario.findUnique({
            where: { clerkId: userId }
          })

          if (dbUser) {
            console.log(`Found database user: ${dbUser.email}, deleting...`)
            await prisma.usuario.delete({
              where: { clerkId: userId }
            })
            console.log(`Database user deleted: ${dbUser.email}`)
          } else {
            console.log(`No database user found for clerkId: ${userId}`)
          }
        } catch (dbError) {
          console.error('Error deleting from database:', dbError)
          // Continue to delete from Clerk even if DB deletion fails
        }

        // Then delete from Clerk
        await client.users.deleteUser(userId)
        console.log(`Clerk user deleted successfully: ${userId}`)
      }
    } catch (error) {
      console.error('Error in deleteUser:', error)

      // Extract more meaningful error message from Clerk API error
      if (error && typeof error === 'object' && 'clerkError' in error) {
        const clerkError = error as { clerkError?: boolean; errors?: Array<{ message: string }> }
        if (clerkError.errors && clerkError.errors.length > 0) {
          throw new Error(clerkError.errors[0].message)
        }
      }

      // Re-throw with original message or a generic one
      throw new Error(
        error instanceof Error ? error.message : 'Error al eliminar el usuario desde Clerk'
      )
    }
  }

  /**
   * Revokes a pending invitation by ID
   */
  static async revokeInvitation(invitationId: string): Promise<void> {
    const client = await clerkClient()
    await client.invitations.revokeInvitation(invitationId)
  }

  /**
   * Resends a pending invitation by revoking the old one and creating a new one
   */
  static async resendInvitation(invitationId: string): Promise<{ invitationId: string; email: string }> {
    const client = await clerkClient()

    try {
      // Get all pending invitations and find the one we want
      const invitations = await client.invitations.getInvitationList({
        status: 'pending',
      })

      const invitation = invitations.data.find(inv => inv.id === invitationId)

      if (!invitation) {
        throw new Error('Invitación no encontrada o ya fue aceptada')
      }

      // Extract details from the existing invitation
      const email = invitation.emailAddress
      const role = (invitation.publicMetadata?.role as UserRole) || 'member'
      const firstName = (invitation.publicMetadata?.firstName as string) || ''
      const lastName = (invitation.publicMetadata?.lastName as string) || ''

      console.log(`Resending invitation to ${email}...`)

      // Revoke the old invitation
      await client.invitations.revokeInvitation(invitationId)
      console.log(`Old invitation revoked: ${invitationId}`)

      // Create a new invitation with the same details
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
      const redirectUrl = `${baseUrl}/register`

      const newInvitation = await client.invitations.createInvitation({
        emailAddress: email,
        redirectUrl,
        publicMetadata: {
          role,
          firstName,
          lastName,
          hasActiveSubscription: false,
        },
        notify: true, // Send invitation email automatically
      })

      console.log(`New invitation sent to ${email}`)

      return {
        invitationId: newInvitation.id,
        email: newInvitation.emailAddress,
      }
    } catch (error) {
      console.error('Error resending invitation:', error)
      throw new Error(
        error instanceof Error ? error.message : 'Error al reenviar la invitación'
      )
    }
  }

  /**
   * Sends a password reset email to the user
   */
  static async sendPasswordResetEmail(userId: string): Promise<void> {
    const client = await clerkClient()

    // Get user's email
    const user = await client.users.getUser(userId)
    const email = user.emailAddresses[0]?.emailAddress

    if (!email) {
      throw new Error('User has no email address')
    }

    // Create a password reset link (Clerk will send the email automatically)
    await client.users.updateUser(userId, {
      // This triggers a password reset email
    })
  }
}