import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2 } from 'lucide-react'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'

import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

// Schema simple para crear scout
const scoutSchema = z.object({
  scout_name: z.string().min(3, 'El usuario debe tener al menos 3 caracteres'),
  name: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
  surname: z.string().min(2, 'El apellido debe tener al menos 2 caracteres'),
  email: z.string().email('Email inválido'),
  nationality: z.string().optional(),
  country: z.string().optional(),
  open_to_work: z.boolean().default(false),
})

type ScoutFormValues = z.infer<typeof scoutSchema>

interface CreateScoutDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

export default function CreateScoutDialog({
  open,
  onOpenChange,
  onSuccess
}: CreateScoutDialogProps) {
  const [loading, setLoading] = useState(false)

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors }
  } = useForm<ScoutFormValues>({
    resolver: zodResolver(scoutSchema),
    defaultValues: {
      scout_name: '',
      name: '',
      surname: '',
      email: '',
      nationality: '',
      country: '',
      open_to_work: false
    }
  })

  // Watch open_to_work for checkbox sync
  const openToWork = watch('open_to_work')

  const onSubmit = async (values: ScoutFormValues) => {
    try {
      setLoading(true)
      
      const response = await fetch('/api/admin/scouts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values)
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Error al crear scout')
      }

      reset()
      onSuccess()
      onOpenChange(false)
    } catch (error) {
      console.error(error)
      alert(error instanceof Error ? error.message : 'Error al crear el scout')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-[#1a2332] border-slate-700 text-white max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">Crear Nuevo Scout</DialogTitle>
          <DialogDescription className="text-slate-400">
            Añade un nuevo scout manualmente a la base de datos.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          
          <div className="space-y-2">
            <Label htmlFor="scout_name">Usuario (Scout Name)</Label>
            <Input 
              id="scout_name"
              {...register('scout_name')}
              className="bg-[#131921] border-slate-700" 
              placeholder="Ej: scout_pro_99" 
            />
            {errors.scout_name && (
              <p className="text-xs text-red-400">{errors.scout_name.message}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nombre</Label>
              <Input 
                id="name"
                {...register('name')}
                className="bg-[#131921] border-slate-700" 
                placeholder="Ej: Juan" 
              />
              {errors.name && (
                <p className="text-xs text-red-400">{errors.name.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="surname">Apellido</Label>
              <Input 
                id="surname"
                {...register('surname')}
                className="bg-[#131921] border-slate-700" 
                placeholder="Ej: Pérez" 
              />
              {errors.surname && (
                <p className="text-xs text-red-400">{errors.surname.message}</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input 
              id="email"
              type="email"
              {...register('email')}
              className="bg-[#131921] border-slate-700" 
              placeholder="juan@ejemplo.com" 
            />
            {errors.email && (
              <p className="text-xs text-red-400">{errors.email.message}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="nationality">Nacionalidad</Label>
              <Input 
                id="nationality"
                {...register('nationality')}
                className="bg-[#131921] border-slate-700" 
                placeholder="Ej: Spain" 
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="country">País Residencia</Label>
              <Input 
                id="country"
                {...register('country')}
                className="bg-[#131921] border-slate-700" 
                placeholder="Ej: Spain" 
              />
            </div>
          </div>

          <div className="flex flex-row items-center space-x-3 rounded-md border border-slate-700 p-4 bg-[#131921]">
            <Checkbox
              id="open_to_work"
              checked={openToWork}
              onCheckedChange={(checked) => setValue('open_to_work', checked === true)}
              className="border-slate-500 data-[state=checked]:bg-green-600 data-[state=checked]:border-green-600"
            />
            <div className="space-y-1 leading-none">
              <Label htmlFor="open_to_work" className="cursor-pointer font-normal">
                Open to Work
              </Label>
              <p className="text-xs text-slate-400">
                Indica si el scout está disponible para ofertas laborales.
              </p>
            </div>
          </div>

          <DialogFooter className="pt-4">
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading} className="bg-[#FF5733] hover:bg-[#E64A2B] text-white">
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Crear Scout
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
