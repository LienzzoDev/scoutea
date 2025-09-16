'use client'

import { useState } from 'react'

import MemberNavbar from "@/components/layout/member-navbar"
import { Button } from "@/components/ui/button"

export default function OnDemandPage() {
  const [message, setMessage] = useState('')

  const handleSend = () => {
    // Handle send message logic here
    console.log('Sending message:', message)
    setMessage('')
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

            {/* Textarea */}
            <div className="mb-6">
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Your text here..."
                className="w-full h-64 p-4 border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-[#8c1a10] focus:border-transparent text-[#000000] placeholder-[#6d6d6d]"
              />
            </div>

            {/* Send Button */}
            <div className="flex justify-end">
              <Button
                onClick={handleSend}
                className="bg-[#8c1a10] hover:bg-[#6d1410] text-white px-8 py-3 text-lg font-medium"
              >
                Send
              </Button>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
