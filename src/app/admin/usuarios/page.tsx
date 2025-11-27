'use client'

import { Users, UserPlus, Shield, Award, Mail } from 'lucide-react'
import { useEffect, useState } from 'react'

import { CreateUserDialog } from '@/components/admin/CreateUserDialog'
import { UserManagementTable } from '@/components/admin/UserManagementTable'
import DashboardHeader from '@/components/layout/dashboard-header'
import { UserRole } from '@/lib/services/role-service'

interface User {
  id: string
  email: string
  firstName: string | null
  lastName: string | null
  role: UserRole
  createdAt: number
  hasActiveSubscription: boolean
  isPending?: boolean
  status?: 'pending'
}

interface UserStats {
  total: number
  byRole: Record<UserRole, number>
  activeSubscriptions: number
  pendingInvitations: number
}

export default function UsuariosPage() {
  const [users, setUsers] = useState<User[]>([])
  const [stats, setStats] = useState<UserStats>({
    total: 0,
    byRole: { admin: 0, member: 0, scout: 0, tester: 0 },
    activeSubscriptions: 0,
    pendingInvitations: 0,
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchUsers = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/admin/users')
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.__error || 'Error al cargar usuarios')
      }

      setUsers(data.users)

      // Calculate stats (only count actual users, not pending invitations)
      const actualUsers = data.users.filter((u: User) => !u.isPending)
      const pendingInvitations = data.users.filter((u: User) => u.isPending).length

      const total = actualUsers.length
      const byRole: Record<UserRole, number> = { admin: 0, member: 0, scout: 0, tester: 0 }
      let activeSubscriptions = 0

      actualUsers.forEach((user: User) => {
        if (user.role && byRole[user.role] !== undefined) {
          byRole[user.role]++
        }
        if (user.hasActiveSubscription) {
          activeSubscriptions++
        }
      })

      setStats({ total, byRole, activeSubscriptions, pendingInvitations })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchUsers()
  }, [])

  if (loading) {
    return (
      <>
        <DashboardHeader />
        <main className="min-h-screen bg-[#0f1419]">
          <div className="px-6 py-8 max-w-7xl mx-auto">
            <div className="flex items-center justify-center py-12">
              <div className="flex items-center gap-2 text-slate-400">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#FF5733]"></div>
                <span>Cargando usuarios...</span>
              </div>
            </div>
          </div>
        </main>
      </>
    )
  }

  if (error) {
    return (
      <>
        <DashboardHeader />
        <main className="min-h-screen bg-[#0f1419]">
          <div className="px-6 py-8 max-w-7xl mx-auto">
            <div className="mb-6 p-4 bg-red-900/20 border border-red-700 rounded-lg">
              <p className="font-semibold text-red-400">Error al cargar usuarios</p>
              <p className="text-sm text-red-300">{error}</p>
            </div>
          </div>
        </main>
      </>
    )
  }

  return (
    <>
      <DashboardHeader />
      <main className="min-h-screen bg-[#0f1419]">
        <div className="px-6 py-8 max-w-7xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-[#D6DDE6]">Gestión de Usuarios</h1>
              <p className="text-sm text-slate-400 mt-1">
                Administra los usuarios de la plataforma, sus roles y suscripciones
              </p>
            </div>
            <CreateUserDialog onUserCreated={fetchUsers} />
          </div>

          {/* Stats Cards */}
          <div className="grid gap-4 md:grid-cols-5 mb-8">
            {/* Total Usuarios */}
            <div className="bg-[#131921] border border-slate-700 rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-medium text-slate-400">Total Usuarios</h3>
                <Users className="h-5 w-5 text-slate-500" />
              </div>
              <div className="text-3xl font-bold text-[#D6DDE6] mb-1">{stats.total}</div>
              <p className="text-xs text-slate-500">Usuarios registrados</p>
            </div>

            {/* Scouts */}
            <div className="bg-[#131921] border border-slate-700 rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-medium text-slate-400">Scouts</h3>
                <Award className="h-5 w-5 text-slate-500" />
              </div>
              <div className="text-3xl font-bold text-[#D6DDE6] mb-1">{stats.byRole.scout}</div>
              <p className="text-xs text-slate-500">Usuarios con rol scout</p>
            </div>

            {/* Members */}
            <div className="bg-[#131921] border border-slate-700 rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-medium text-slate-400">Members</h3>
                <UserPlus className="h-5 w-5 text-slate-500" />
              </div>
              <div className="text-3xl font-bold text-[#D6DDE6] mb-1">{stats.byRole.member}</div>
              <p className="text-xs text-slate-500">Usuarios con rol member</p>
            </div>

            {/* Suscripciones Activas */}
            <div className="bg-[#131921] border border-slate-700 rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-medium text-slate-400">Suscripciones Activas</h3>
                <Shield className="h-5 w-5 text-slate-500" />
              </div>
              <div className="text-3xl font-bold text-[#D6DDE6] mb-1">{stats.activeSubscriptions}</div>
              <p className="text-xs text-slate-500">
                {stats.total > 0
                  ? `${Math.round((stats.activeSubscriptions / stats.total) * 100)}% del total`
                  : 'No hay usuarios'}
              </p>
            </div>

            {/* Invitaciones Pendientes */}
            <div className="bg-[#131921] border border-yellow-700/50 rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-medium text-yellow-400">Invitaciones Pendientes</h3>
                <Mail className="h-5 w-5 text-yellow-500" />
              </div>
              <div className="text-3xl font-bold text-yellow-400 mb-1">{stats.pendingInvitations}</div>
              <p className="text-xs text-yellow-600">
                Esperando aceptación
              </p>
            </div>
          </div>

          {/* Table Section Header */}
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-[#D6DDE6]">Todos los Usuarios</h2>
            <p className="text-sm text-slate-400 mt-1">
              Lista completa de usuarios registrados en la plataforma
            </p>
          </div>

          {/* Users Table */}
          <UserManagementTable users={users} onUserUpdated={fetchUsers} />
        </div>
      </main>
    </>
  )
}
