'use client'

import { useUser, useClerk } from '@clerk/nextjs'
import { User, Mail, Calendar, Shield, LogOut } from "lucide-react"
import { MemberPageLayout } from '@/components/layout/member-page-layout'
import { getUserRole } from '@/lib/auth/user-role'
import { Button } from '@/components/ui/button'
import { useRouter } from 'next/navigation'

export default function ProfilePage() {
  const { user, isLoaded } = useUser()
  const { signOut } = useClerk()
  const router = useRouter()
  const userRole = getUserRole(user)

  const handleSignOut = async () => {
    await signOut()
    router.push('/')
  }

  if (!isLoaded) {
    return (
      <MemberPageLayout showNavbar={true}>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#8c1a10]"></div>
        </div>
      </MemberPageLayout>
    )
  }

  return (
    <MemberPageLayout
      title="Mi Perfil"
      description="Información de tu cuenta"
      showNavbar={true}
    >
      <div className="max-w-4xl mx-auto">
        {/* Header Card */}
        <div className="bg-white rounded-lg border border-[#e7e7e7] p-8 mb-6">
          <div className="flex items-start gap-6">
            {/* Avatar */}
            <div className="w-24 h-24 bg-[#8c1a10] rounded-full flex items-center justify-center flex-shrink-0">
              {user?.imageUrl ? (
                <img
                  src={user.imageUrl}
                  alt={user.fullName || 'User'}
                  className="w-full h-full rounded-full object-cover"
                />
              ) : (
                <User className="w-12 h-12 text-white" />
              )}
            </div>

            {/* User Info */}
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-[#000000] mb-2">
                {user?.fullName || user?.firstName || 'Usuario'}
              </h1>

              <div className="space-y-2">
                {user?.primaryEmailAddress?.emailAddress && (
                  <div className="flex items-center gap-2 text-[#6d6d6d]">
                    <Mail className="w-4 h-4" />
                    <span>{user.primaryEmailAddress.emailAddress}</span>
                  </div>
                )}

                {user?.createdAt && (
                  <div className="flex items-center gap-2 text-[#6d6d6d]">
                    <Calendar className="w-4 h-4" />
                    <span>Miembro desde {new Date(user.createdAt).toLocaleDateString('es-ES', {
                      month: 'long',
                      year: 'numeric'
                    })}</span>
                  </div>
                )}

                {userRole && (
                  <div className="flex items-center gap-2">
                    <Shield className="w-4 h-4 text-[#8c1a10]" />
                    <span className="text-[#8c1a10] font-medium capitalize">{userRole}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Account Details */}
        <div className="bg-white rounded-lg border border-[#e7e7e7] p-8 mb-6">
          <h2 className="text-xl font-semibold text-[#000000] mb-6">Detalles de la Cuenta</h2>

          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-[#6d6d6d] mb-1">
                  Nombre
                </label>
                <p className="text-[#000000] font-medium">
                  {user?.firstName || 'N/A'}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-[#6d6d6d] mb-1">
                  Apellido
                </label>
                <p className="text-[#000000] font-medium">
                  {user?.lastName || 'N/A'}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-[#6d6d6d] mb-1">
                  Email
                </label>
                <p className="text-[#000000] font-medium">
                  {user?.primaryEmailAddress?.emailAddress || 'N/A'}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-[#6d6d6d] mb-1">
                  ID de Usuario
                </label>
                <p className="text-[#000000] font-medium font-mono text-sm">
                  {user?.id || 'N/A'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Sign Out Button */}
        <div className="bg-white rounded-lg border border-[#e7e7e7] p-8">
          <h2 className="text-xl font-semibold text-[#000000] mb-4">Sesión</h2>
          <Button
            onClick={handleSignOut}
            variant="destructive"
            className="bg-[#8c1a10] hover:bg-[#6d1410] text-white"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Cerrar Sesión
          </Button>
        </div>
      </div>
    </MemberPageLayout>
  )
}
