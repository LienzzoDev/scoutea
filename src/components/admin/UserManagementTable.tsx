'use client'

import { MoreHorizontal, Shield, Trash2, CheckCircle, XCircle, Mail } from 'lucide-react'
import { useState } from 'react'

import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
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

interface UserManagementTableProps {
  users: User[]
  onUserUpdated: () => void
}

export function UserManagementTable({ users, onUserUpdated }: UserManagementTableProps) {
  const [loadingUserId, setLoadingUserId] = useState<string | null>(null)

  const handleUpdateRole = async (userId: string, newRole: UserRole) => {
    setLoadingUserId(userId)
    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ role: newRole }),
      })

      if (!response.ok) {
        throw new Error('Error al actualizar rol')
      }

      onUserUpdated()
    } catch (error) {
      console.error('Error updating role:', error)
      alert('Error al actualizar el rol del usuario')
    } finally {
      setLoadingUserId(null)
    }
  }

  const handleToggleSubscription = async (userId: string, currentStatus: boolean) => {
    setLoadingUserId(userId)
    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ hasActiveSubscription: !currentStatus }),
      })

      if (!response.ok) {
        throw new Error('Error al actualizar suscripción')
      }

      onUserUpdated()
    } catch (error) {
      console.error('Error updating subscription:', error)
      alert('Error al actualizar la suscripción')
    } finally {
      setLoadingUserId(null)
    }
  }

  const handleDeleteUser = async (userId: string, userEmail: string) => {
    if (!confirm(`¿Estás seguro de eliminar al usuario ${userEmail}?`)) {
      return
    }

    setLoadingUserId(userId)
    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.__error || 'Error al eliminar usuario')
      }

      onUserUpdated()
    } catch (error) {
      console.error('Error deleting user:', error)
      alert(error instanceof Error ? error.message : 'Error al eliminar usuario')
    } finally {
      setLoadingUserId(null)
    }
  }

  const handleResendInvitation = async (userId: string, userEmail: string) => {
    if (!confirm(`¿Reenviar invitación a ${userEmail}?`)) {
      return
    }

    setLoadingUserId(userId)
    try {
      const response = await fetch(`/api/admin/users/${userId}/resend-invitation`, {
        method: 'POST',
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.__error || 'Error al reenviar invitación')
      }

      const data = await response.json()
      alert(data.message || 'Invitación reenviada exitosamente')
      onUserUpdated()
    } catch (error) {
      console.error('Error resending invitation:', error)
      alert(error instanceof Error ? error.message : 'Error al reenviar invitación')
    } finally {
      setLoadingUserId(null)
    }
  }

  const getRoleBadge = (role: UserRole) => {
    const styles: Record<UserRole, string> = {
      admin: 'bg-red-900/30 text-red-400 border-red-700',
      scout: 'bg-blue-900/30 text-blue-400 border-blue-700',
      member: 'bg-green-900/30 text-green-400 border-green-700',
      tester: 'bg-purple-900/30 text-purple-400 border-purple-700',
    }

    const labels: Record<UserRole, string> = {
      admin: 'Admin',
      scout: 'Scout',
      member: 'Member',
      tester: 'Tester',
    }

    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${styles[role]}`}>
        {labels[role]}
      </span>
    )
  }

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  return (
    <div className="rounded-lg border border-slate-700 bg-[#131921] overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="border-slate-700 hover:bg-slate-800/50">
            <TableHead className="text-slate-400 font-semibold">Usuario</TableHead>
            <TableHead className="text-slate-400 font-semibold">Email</TableHead>
            <TableHead className="text-slate-400 font-semibold">Rol</TableHead>
            <TableHead className="text-slate-400 font-semibold">Suscripción</TableHead>
            <TableHead className="text-slate-400 font-semibold">Fecha de Registro</TableHead>
            <TableHead className="text-right text-slate-400 font-semibold">Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {users.length === 0 ? (
            <TableRow className="border-slate-700">
              <TableCell colSpan={6} className="text-center text-slate-500 py-8">
                No hay usuarios registrados
              </TableCell>
            </TableRow>
          ) : (
            users.map((user) => (
              <TableRow key={user.id} className={`border-slate-700 ${user.isPending ? 'bg-yellow-900/10' : 'hover:bg-slate-800/30'}`}>
                <TableCell className="font-medium text-[#D6DDE6]">
                  {user.isPending ? (
                    <div className="flex items-center gap-2">
                      <span className="text-yellow-400">(Invitación pendiente)</span>
                    </div>
                  ) : (
                    <>{user.firstName} {user.lastName}</>
                  )}
                </TableCell>
                <TableCell className="text-slate-400">{user.email}</TableCell>
                <TableCell>{getRoleBadge(user.role)}</TableCell>
                <TableCell>
                  {user.isPending ? (
                    <div className="flex items-center gap-1 text-yellow-400">
                      <span className="text-sm">⏳ Pendiente</span>
                    </div>
                  ) : user.hasActiveSubscription ? (
                    <div className="flex items-center gap-1 text-green-400">
                      <CheckCircle className="h-4 w-4" />
                      <span className="text-sm">Activa</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1 text-slate-500">
                      <XCircle className="h-4 w-4" />
                      <span className="text-sm">Inactiva</span>
                    </div>
                  )}
                </TableCell>
                <TableCell className="text-slate-400">{formatDate(user.createdAt)}</TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        className="h-8 w-8 p-0 text-slate-400 hover:text-[#D6DDE6] hover:bg-slate-700"
                        disabled={loadingUserId === user.id}
                      >
                        <span className="sr-only">Abrir menú</span>
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="bg-[#131921] border-slate-700">
                      <DropdownMenuLabel className="text-slate-300">Acciones</DropdownMenuLabel>
                      <DropdownMenuSeparator className="bg-slate-700" />

                      {user.isPending ? (
                        // For pending invitations, show resend and revoke options
                        <>
                          <DropdownMenuItem
                            onClick={() => handleResendInvitation(user.id, user.email)}
                            className="text-blue-400 hover:bg-blue-900/20 hover:text-blue-300 focus:bg-blue-900/20 focus:text-blue-300"
                          >
                            <Mail className="mr-2 h-4 w-4" />
                            Reenviar Invitación
                          </DropdownMenuItem>

                          <DropdownMenuSeparator className="bg-slate-700" />

                          <DropdownMenuItem
                            onClick={() => handleDeleteUser(user.id, user.email)}
                            className="text-red-400 hover:bg-red-900/20 hover:text-red-300 focus:bg-red-900/20 focus:text-red-300"
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Revocar Invitación
                          </DropdownMenuItem>
                        </>
                      ) : (
                        // For actual users, show all options
                        <>
                          <DropdownMenuLabel className="text-xs font-normal text-slate-500">
                            Cambiar Rol
                          </DropdownMenuLabel>
                          {(['member', 'scout', 'tester', 'admin'] as UserRole[]).map((role) => (
                            <DropdownMenuItem
                              key={role}
                              onClick={() => handleUpdateRole(user.id, role)}
                              disabled={user.role === role}
                              className="text-slate-300 hover:bg-slate-700 hover:text-[#D6DDE6] focus:bg-slate-700 focus:text-[#D6DDE6]"
                            >
                              <Shield className="mr-2 h-4 w-4" />
                              {role.charAt(0).toUpperCase() + role.slice(1)}
                            </DropdownMenuItem>
                          ))}

                          <DropdownMenuSeparator className="bg-slate-700" />

                          <DropdownMenuItem
                            onClick={() => handleToggleSubscription(user.id, user.hasActiveSubscription)}
                            className="text-slate-300 hover:bg-slate-700 hover:text-[#D6DDE6] focus:bg-slate-700 focus:text-[#D6DDE6]"
                          >
                            {user.hasActiveSubscription ? (
                              <>
                                <XCircle className="mr-2 h-4 w-4" />
                                Desactivar Suscripción
                              </>
                            ) : (
                              <>
                                <CheckCircle className="mr-2 h-4 w-4" />
                                Activar Suscripción
                              </>
                            )}
                          </DropdownMenuItem>

                          <DropdownMenuSeparator className="bg-slate-700" />

                          <DropdownMenuItem
                            onClick={() => handleDeleteUser(user.id, user.email)}
                            className="text-red-400 hover:bg-red-900/20 hover:text-red-300 focus:bg-red-900/20 focus:text-red-300"
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Eliminar Usuario
                          </DropdownMenuItem>
                        </>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  )
}
