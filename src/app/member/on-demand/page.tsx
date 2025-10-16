'use client'

import { useAuth } from '@clerk/nextjs'
import { useState } from 'react'

import MemberNavbar from "@/components/layout/member-navbar"
import { Button } from "@/components/ui/button"

export default function OnDemandPage() {
  const [message, setMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle')
  const [errorMessage, setErrorMessage] = useState('')
  
  const { isSignedIn } = useAuth()

  const handleSend = async () => {
    if (!isSignedIn) {
      setStatus('error')
      setErrorMessage('Debes estar autenticado para enviar un mensaje')
      return
    }

    if (!message.trim()) {
      setStatus('error')
      setErrorMessage('Por favor, escribe un mensaje antes de enviarlo')
      return
    }

    setIsLoading(true)
    setStatus('idle')
    setErrorMessage('')

    try {
      const response = await fetch('/api/on-demand', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message: message.trim() }),
      })

      const data = await response.json()

      if (response.ok) {
        setStatus('success')
        setMessage('')
        // Auto-hide success message after 5 seconds
        setTimeout(() => setStatus('idle'), 5000)
      } else {
        setStatus('error')
        setErrorMessage(data.error || 'Error al enviar el mensaje')
      }
    } catch (error) {
      console.error('Error:', error)
      setStatus('error')
      setErrorMessage('Error de conexión. Por favor, inténtalo de nuevo.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#f8f7f4]">
      {/* Header */}
      <MemberNavbar />

      <main className="px-6 py-8 max-w-7xl mx-auto">
        {/* Breadcrumb */}
        <div className="mb-6">
          <nav className="text-sm text-[#6d6d6d]">
            <span className="text-[#000000]">On Demand</span>
            <span className="mx-2">›</span>
            <span className="text-[#000000]">On Demand</span>
          </nav>
        </div>

        {/* Title */}
        <h1 className="text-3xl font-bold text-[#000000] mb-8">On Demand</h1>

        {/* Message Form */}
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-lg p-8 border border-[#e7e7e7] shadow-sm">
            <h2 className="text-xl font-bold text-[#000000] mb-4">Send a message</h2>
            
            {/* Suggestions */}
            <div className="mb-6">
              <p className="text-[#6d6d6d] text-sm">
                Specific coverage or report | Player stats or videos | Search for a player profile
              </p>
            </div>

            {/* Status Messages */}
            {status === 'success' && (
              <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-green-800 font-medium">
                  ✅ Mensaje enviado correctamente. Te contactaremos pronto.
                </p>
              </div>
            )}

            {status === 'error' && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-800 font-medium">
                  ❌ {errorMessage}
                </p>
              </div>
            )}

            {/* Textarea */}
            <div className="mb-6">
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Your text here..."
                disabled={isLoading}
                className="w-full h-64 p-4 border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-[#8c1a10] focus:border-transparent text-[#000000] placeholder-[#6d6d6d] disabled:bg-gray-100 disabled:cursor-not-allowed"
              />
              <div className="text-right text-sm text-[#6d6d6d] mt-2">
                {message.length} caracteres
              </div>
            </div>

            {/* Send Button */}
            <div className="flex justify-end">
              <Button
                onClick={handleSend}
                disabled={isLoading || !message.trim()}
                className="bg-[#8c1a10] hover:bg-[#6d1410] text-white px-8 py-3 text-lg font-medium disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Enviando...
                  </div>
                ) : (
                  'Send'
                )}
              </Button>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
