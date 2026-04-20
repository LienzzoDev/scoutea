'use client'

import { useUser, useClerk } from '@clerk/nextjs'
import { User, Mail, Calendar, Shield, LogOut, CreditCard } from "lucide-react"
import { useRouter } from 'next/navigation'
import { useState } from 'react'

import ScoutNavbar from '@/components/layout/scout-navbar'
import { Button } from '@/components/ui/button'
import { useSubscription } from '@/hooks/auth/use-subscription'
import { getUserRole } from '@/lib/auth/user-role'

export default function ScoutProfilePage() {
  const { user, isLoaded } = useUser()
  const { signOut } = useClerk()
  const router = useRouter()
  const userRole = getUserRole(user)
  const { subscription, hasActiveSubscription } = useSubscription()
  const [portalLoading, setPortalLoading] = useState(false)

  const handleSignOut = async () => {
    await signOut()
    router.push('/')
  }

  const handleManageSubscription = async () => {
    setPortalLoading(true)
    try {
      const res = await fetch('/api/create-portal-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ return_url: window.location.href }),
      })
      const data = await res.json()
      if (data.__error) throw new Error(data.__error)
      window.location.href = data.url
    } catch (error) {
      console.error('Error opening portal:', error)
      setPortalLoading(false)
    }
  }

  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-[#f8f7f4]">
        <ScoutNavbar />
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#8c1a10]"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#f8f7f4]">
      <ScoutNavbar />

      <main className="max-w-7xl mx-auto px-6 py-8">
        <h1 className="text-4xl font-bold text-[#000000] mb-8">Mi Perfil</h1>

        <div className="max-w-4xl">
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
                <h2 className="text-3xl font-bold text-[#000000] mb-2">
                  {user?.fullName || user?.firstName || 'Usuario'}
                </h2>

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
            <h3 className="text-xl font-semibold text-[#000000] mb-6">Detalles de la Cuenta</h3>

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

          {/* Subscription */}
          {hasActiveSubscription && (
            <div className="bg-white rounded-lg border border-[#e7e7e7] p-8 mb-6">
              <h3 className="text-xl font-semibold text-[#000000] mb-4">Subscription</h3>
              <p className="text-[#6d6d6d] mb-4">
                Plan: <span className="font-medium text-[#000000] capitalize">{subscription?.plan}</span>
                {subscription?.billing && (
                  <> · <span className="capitalize">{subscription.billing}</span></>
                )}
              </p>
              <Button
                onClick={handleManageSubscription}
                disabled={portalLoading}
                className="bg-[#8c1a10] hover:bg-[#6d1410] text-white"
              >
                <CreditCard className="w-4 h-4 mr-2" />
                {portalLoading ? 'Redirecting...' : 'Manage Subscription'}
              </Button>
            </div>
          )}

          {/* Sign Out Button */}
          <div className="bg-white rounded-lg border border-[#e7e7e7] p-8">
            <h3 className="text-xl font-semibold text-[#000000] mb-4">Session</h3>
            <Button
              onClick={handleSignOut}
              variant="destructive"
              className="bg-[#8c1a10] hover:bg-[#6d1410] text-white"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </div>
      </main>
    </div>
  )
}
