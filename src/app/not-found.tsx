'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#f8f7f4] to-[#e8e6e0]">
      <div className="max-w-md w-full mx-auto text-center p-6">
        <div className="mb-6">
          <div className="w-24 h-24 bg-[#8c1a10]/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-6xl font-bold text-[#8c1a10]">404</span>
          </div>
          <h1 className="text-3xl font-bold text-[#2e3138] mb-2">
            Página no encontrada
          </h1>
          <p className="text-[#6d6d6d] mb-6">
            Lo sentimos, la página que buscas no existe o ha sido movida.
          </p>
        </div>

        <div className="space-y-3">
          <Link href="/" className="block">
            <Button className="w-full bg-[#8c1a10] hover:bg-[#6d1410] text-white">
              Volver al inicio
            </Button>
          </Link>
          <Button
            variant="outline"
            onClick={() => window.history.back()}
            className="w-full border-[#8c1a10] text-[#8c1a10] hover:bg-[#8c1a10] hover:text-white"
          >
            Volver atrás
          </Button>
        </div>
      </div>
    </div>
  )
}
