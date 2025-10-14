'use client'

import { useUser, useClerk } from '@clerk/nextjs'
import { User, Mail, Calendar, Shield, ArrowLeft, LogOut } from "lucide-react"
import { useRouter } from 'next/navigation'
import { getUserRole } from '@/lib/auth/user-role'
import { Button } from '@/components/ui/button'

export default function AdminProfilePage() {
  const { user, isLoaded } = useUser()
  const { signOut } = useClerk()
  const userRole = getUserRole(user)
  const router = useRouter()

  const handleSignOut = async () => {
    await signOut()
    router.push('/')
  }

  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-[#080F17] flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#8c1a10]"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#080F17]">
      <main className="px-6 py-8 max-w-7xl mx-auto">
        {/* Back Button */}
        <Button
          variant="ghost"
          className="mb-6 text-[#D6DDE6] hover:text-white"
          onClick={() => router.push('/admin/dashboard')}
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Volver al Dashboard
        </Button>

        <h1 className="text-4xl font-bold text-[#D6DDE6] mb-8">Mi Perfil</h1>

        <div className="max-w-4xl">
          {/* Header Card */}
          <div className="bg-[#131921] border border-slate-700 rounded-lg p-8 mb-6">
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
                <h2 className="text-3xl font-bold text-[#D6DDE6] mb-2">
                  {user?.fullName || user?.firstName || 'Usuario'}
                </h2>

                <div className="space-y-2">
                  {user?.primaryEmailAddress?.emailAddress && (
                    <div className="flex items-center gap-2 text-gray-400">
                      <Mail className="w-4 h-4" />
                      <span>{user.primaryEmailAddress.emailAddress}</span>
                    </div>
                  )}

                  {user?.createdAt && (
                    <div className="flex items-center gap-2 text-gray-400">
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
          <div className="bg-[#131921] border border-slate-700 rounded-lg p-8 mb-6">
            <h3 className="text-xl font-semibold text-[#D6DDE6] mb-6">Detalles de la Cuenta</h3>

            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">
                    Nombre
                  </label>
                  <p className="text-[#D6DDE6] font-medium">
                    {user?.firstName || 'N/A'}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">
                    Apellido
                  </label>
                  <p className="text-[#D6DDE6] font-medium">
                    {user?.lastName || 'N/A'}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">
                    Email
                  </label>
                  <p className="text-[#D6DDE6] font-medium">
                    {user?.primaryEmailAddress?.emailAddress || 'N/A'}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">
                    ID de Usuario
                  </label>
                  <p className="text-[#D6DDE6] font-medium font-mono text-sm">
                    {user?.id || 'N/A'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Sign Out Button */}
          <div className="bg-[#131921] border border-slate-700 rounded-lg p-8">
            <h3 className="text-xl font-semibold text-[#D6DDE6] mb-4">Sesión</h3>
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
      </main>
    </div>
  )
}
