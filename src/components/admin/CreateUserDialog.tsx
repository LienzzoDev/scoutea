'use client'

import { PlusCircle } from 'lucide-react'
import { useState } from 'react'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { UserRole } from '@/lib/services/role-service'

interface CreateUserDialogProps {
  onUserCreated: () => void
}

export function CreateUserDialog({ onUserCreated }: CreateUserDialogProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [formData, setFormData] = useState({
    email: '',
    firstName: '',
    lastName: '',
    role: 'member' as UserRole,
  })
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setSuccessMessage(null)

    try {
      const response = await fetch('/api/admin/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.__error || 'Error al enviar invitación')
      }

      // Show success message
      setSuccessMessage(data.message || 'Invitación enviada exitosamente')

      // Reset form
      setFormData({
        email: '',
        firstName: '',
        lastName: '',
        role: 'member',
      })

      // Close dialog after 2 seconds and refresh user list
      setTimeout(() => {
        setOpen(false)
        setSuccessMessage(null)
        onUserCreated()
      }, 2000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-[#FF5733] hover:bg-[#E64A2B] text-white">
          <PlusCircle className="mr-2 h-4 w-4" />
          Invitar Usuario
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px] bg-[#131921] border-slate-700">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle className="text-[#D6DDE6]">Invitar Nuevo Usuario</DialogTitle>
            <DialogDescription className="text-slate-400">
              Envía una invitación por email. El usuario recibirá un link único para completar su
              registro y establecer su contraseña.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            {error && (
              <div className="rounded-md bg-red-900/20 border border-red-700 p-3 text-sm text-red-400">
                {error}
              </div>
            )}

            {successMessage && (
              <div className="rounded-md bg-green-900/20 border border-green-700 p-3 text-sm text-green-400">
                ✓ {successMessage}
              </div>
            )}

            <div className="grid gap-2">
              <Label htmlFor="email" className="text-slate-300">Email *</Label>
              <Input
                id="email"
                type="email"
                placeholder="usuario@ejemplo.com"
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
                required
                className="bg-[#0f1419] border-slate-700 text-white placeholder:text-slate-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="firstName" className="text-slate-300">Nombre *</Label>
                <Input
                  id="firstName"
                  placeholder="Juan"
                  value={formData.firstName}
                  onChange={(e) =>
                    setFormData({ ...formData, firstName: e.target.value })
                  }
                  required
                  className="bg-[#0f1419] border-slate-700 text-white placeholder:text-slate-500"
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="lastName" className="text-slate-300">Apellido *</Label>
                <Input
                  id="lastName"
                  placeholder="Pérez"
                  value={formData.lastName}
                  onChange={(e) =>
                    setFormData({ ...formData, lastName: e.target.value })
                  }
                  required
                  className="bg-[#0f1419] border-slate-700 text-white placeholder:text-slate-500"
                />
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="role" className="text-slate-300">Rol *</Label>
              <Select
                value={formData.role}
                onValueChange={(value) =>
                  setFormData({ ...formData, role: value as UserRole })
                }
              >
                <SelectTrigger className="bg-[#0f1419] border-slate-700 text-white">
                  <SelectValue placeholder="Seleccionar rol" />
                </SelectTrigger>
                <SelectContent className="bg-[#131921] border-slate-700">
                  <SelectItem value="member" className="text-white hover:bg-slate-700">Member (Usuario)</SelectItem>
                  <SelectItem value="scout" className="text-white hover:bg-slate-700">Scout</SelectItem>
                  <SelectItem value="tester" className="text-white hover:bg-slate-700">Tester</SelectItem>
                  <SelectItem value="admin" className="text-white hover:bg-slate-700">Admin</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-slate-500">
                El usuario establecerá su contraseña al aceptar la invitación
              </p>
            </div>

            <div className="rounded-lg bg-blue-900/10 border border-blue-700/30 p-3">
              <p className="text-xs text-blue-400 mb-2">
                <strong>📧 Invitación automática:</strong> Se enviará un email con un link único que expira en 30 días. El usuario deberá completar su registro y crear su contraseña.
              </p>
              <p className="text-xs text-blue-300">
                <strong>♻️ Reinvitar:</strong> Si el email ya fue invitado, la invitación anterior se revocará automáticamente y se enviará una nueva.
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={loading}
              className="border-slate-700 bg-[#0f1419] text-white hover:bg-slate-700"
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={loading} className="bg-[#FF5733] hover:bg-[#E64A2B] text-white">
              {loading ? 'Enviando invitación...' : 'Enviar Invitación'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
