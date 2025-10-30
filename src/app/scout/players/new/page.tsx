'use client'

import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

export default function NewPlayerPage() {
  const router = useRouter()

  useEffect(() => {
    router.replace('/scout/portfolio/new')
  }, [router])

  return (
    <div className="min-h-screen bg-[#f8f7f4] flex items-center justify-center">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#8c1a10]"></div>
    </div>
  )
}