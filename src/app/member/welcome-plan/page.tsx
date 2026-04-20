'use client'

import { useUser } from '@clerk/nextjs'
import { Check, BarChart3, ChevronRight, Crown, Headphones } from 'lucide-react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useState, useEffect } from 'react'

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

const MEMBER_FEATURES = [
  'Wonderkids — Full access to the player database',
  'Tournaments — Browse all competitions and events',
  'On Demand — Custom reports on any player'
]

export default function WelcomePlanPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user, isLoaded } = useUser()
  const [isLoading, setIsLoading] = useState(false)
  const [profileCompleted, setProfileCompleted] = useState(false)

  useEffect(() => {
    const profile = searchParams.get('profile') === 'completed'
    setProfileCompleted(profile)
  }, [searchParams])

  const handleProceedToPayment = async () => {
    setIsLoading(true)

    try {
      const profileStatus = localStorage.getItem('profileStatus') || 'incomplete'
      const profileData = localStorage.getItem('profileData')

      const metadata: any = {
        selectedPlan: 'member'
      }

      if (profileStatus === 'completed' && profileData) {
        metadata.profileData = JSON.parse(profileData)
      }

      try {
        const metadataResponse = await fetch('/api/update-user-metadata', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            metadata: {
              ...user?.publicMetadata,
              ...metadata
            }
          })
        })

        if (!metadataResponse.ok) {
          const errorData = await metadataResponse.json()
          console.error('Failed to update user metadata:', errorData)
        }
      } catch (error) {
        console.error('Error updating metadata:', error)
      }

      localStorage.removeItem('profileStatus')
      localStorage.removeItem('profileData')

      const response = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          plan: 'member',
          billing: 'monthly'
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        console.error('Checkout error:', errorData)
        alert(`Error creating checkout session: ${errorData.details || errorData.error}`)
        return
      }

      const responseData = await response.json()

      if (responseData.url) {
        window.location.href = responseData.url
      } else {
        alert('Error: Could not get checkout URL')
      }
    } catch (error) {
      console.error('Error proceeding to payment:', error)
      alert('Error processing the request. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-[#f8f7f4] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#8c1a10] mx-auto mb-4"></div>
          <p className="text-[#6d6d6d]">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#f8f7f4]">
      <main className="max-w-3xl mx-auto px-6 py-12">
        {/* Progress Indicator */}
        <div className="flex items-center justify-center mb-8">
          <div className="flex items-center space-x-4">
            <div className="flex items-center">
              <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                <Check className="w-4 h-4 text-white" />
              </div>
              <span className="ml-2 text-sm text-green-600 font-medium">Account created</span>
            </div>
            <ChevronRight className="w-4 h-4 text-gray-400" />
            <div className="flex items-center">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                profileCompleted ? 'bg-green-500' : 'bg-gray-300'
              }`}>
                {profileCompleted ? (
                  <Check className="w-4 h-4 text-white" />
                ) : (
                  <span className="text-gray-600 text-sm font-medium">2</span>
                )}
              </div>
              <span className={`ml-2 text-sm font-medium ${
                profileCompleted ? 'text-green-600' : 'text-gray-600'
              }`}>
                {profileCompleted ? 'Profile completed' : 'Profile skipped'}
              </span>
            </div>
            <ChevronRight className="w-4 h-4 text-gray-400" />
            <div className="flex items-center">
              <div className="w-8 h-8 bg-[#8c1a10] rounded-full flex items-center justify-center">
                <span className="text-white text-sm font-medium">3</span>
              </div>
              <span className="ml-2 text-sm text-[#8c1a10] font-medium">Subscribe</span>
            </div>
          </div>
        </div>

        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r from-[#8c1a10] to-[#a01e12] rounded-full mb-6">
            <Crown className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-[#000000] mb-4">
            Almost done!
          </h1>
          <p className="text-xl text-[#6d6d6d]">
            Subscribe to Scoutea and get full access to the platform
          </p>
        </div>

        {/* Plan Card */}
        <Card className="mb-8 relative overflow-hidden border-2 border-[#8c1a10] shadow-xl">
          <CardHeader className="text-center pb-4">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-[#8c1a10] to-[#a01e12] rounded-full mb-4 mx-auto">
              <BarChart3 className="w-8 h-8 text-white" />
            </div>
            <CardTitle className="text-3xl font-bold text-[#000000] mb-2">
              Member Plan
            </CardTitle>
            <div className="flex items-baseline justify-center">
              <span className="text-5xl font-bold text-[#000000]">€9.90</span>
              <span className="text-[#6d6d6d] ml-2">/month</span>
            </div>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3 max-w-md mx-auto">
              {MEMBER_FEATURES.map((feature) => (
                <li key={feature} className="flex items-start gap-2 text-sm">
                  <Check className="w-5 h-5 text-[#8c1a10] flex-shrink-0 mt-0.5" />
                  <span className="text-gray-700">{feature}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        {/* Action Button */}
        <div className="flex justify-center">
          <Button
            onClick={handleProceedToPayment}
            disabled={isLoading}
            className="bg-[#8c1a10] hover:bg-[#6d1410] text-white px-10 py-6 text-base font-semibold"
          >
            {isLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                Processing...
              </>
            ) : (
              <>
                Proceed to payment (€9.90/month)
                <ChevronRight className="w-4 h-4 ml-2" />
              </>
            )}
          </Button>
        </div>

        {/* Support Section */}
        <div className="mt-12 text-center">
          <div className="bg-white rounded-lg p-6 border border-[#e7e7e7]">
            <Headphones className="w-8 h-8 text-[#8c1a10] mx-auto mb-3" />
            <h3 className="font-semibold text-[#000000] mb-2">Have questions?</h3>
            <p className="text-[#6d6d6d] text-sm mb-4">
              Our team is here to help you get the most out of Scoutea
            </p>
            <Button
              variant="outline"
              className="border-[#8c1a10] text-[#8c1a10] hover:bg-[#8c1a10] hover:text-white"
            >
              Contact Support
            </Button>
          </div>
        </div>
      </main>
    </div>
  )
}
