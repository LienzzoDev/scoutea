'use client'

import { Check, Crown, ArrowRight } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

interface Plan {
  id: string
  name: string
  price: { monthly: number; yearly: number } | null
  description: string
  features: string[]
  popular: boolean
  color: string
}

interface PlanSelectorProps {
  plans: Plan[]
}

export default function PlanSelector({ plans }: PlanSelectorProps) {
  const [mounted, setMounted] = useState(false)
  const router = useRouter()

  useEffect(() => {
    setMounted(true)
  }, [])

  const plan = plans[0]

  const handleSubscribe = () => {
    if (plan) {
      localStorage.setItem('selectedPlan', plan.id)
      router.push('/register?plan=' + plan.id)
    } else {
      router.push('/register')
    }
  }

  const handleLogin = () => {
    router.push('/login')
  }

  if (!mounted || !plan) {
    return (
      <div className="min-h-[400px] flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-[#8c1a10] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-[#6d6d6d]">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <>
      {/* CTA Buttons */}
      <div className="flex items-center justify-center gap-4 mb-12">
        <button
          onClick={handleSubscribe}
          className="bg-[#8c1a10] hover:bg-[#6d1410] text-white font-semibold px-8 py-3 rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl inline-flex items-center justify-center"
        >
          Subscribe to {plan.name}
          <ArrowRight className="ml-2 w-5 h-5" />
        </button>
        <button
          onClick={handleLogin}
          className="text-[#6d6d6d] hover:text-[#8c1a10] font-semibold px-6 py-3 rounded-lg transition-all duration-200 inline-flex items-center justify-center"
        >
          Sign In
        </button>
      </div>

      {/* Pricing Card */}
      <div className="max-w-md mx-auto mb-16">
        <div className="relative rounded-lg border-2 border-[#8c1a10] bg-white shadow-xl">
          {plan.popular && (
            <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
              <div className="bg-gradient-to-r from-[#8c1a10] to-[#a01e12] text-white px-4 py-1 rounded-full border inline-flex items-center text-xs font-semibold">
                <Crown className="w-4 h-4 mr-1" />
                All Access
              </div>
            </div>
          )}

          <div className="text-center pb-4 flex flex-col space-y-1.5 p-6">
            <h3 className="text-2xl font-bold text-[#000000] mb-2">
              {plan.name}
            </h3>
            <p className="text-[#6d6d6d] mb-4">{plan.description}</p>

            {plan.price && (
              <div className="flex items-baseline justify-center">
                <span className="text-5xl font-bold text-[#8c1a10]">
                  €{plan.price.monthly.toFixed(2).replace('.00', '')}
                </span>
                <span className="text-[#6d6d6d] ml-2">/month</span>
              </div>
            )}
          </div>

          <div className="p-6 pt-0">
            <ul className="space-y-3 mb-6">
              {plan.features.map((feature, index) => (
                <li key={index} className="flex items-start">
                  <Check className="w-5 h-5 text-[#8c1a10] mr-3 mt-0.5 flex-shrink-0" />
                  <span className="text-[#6d6d6d]">{feature}</span>
                </li>
              ))}
            </ul>

            <button
              onClick={handleSubscribe}
              className="w-full inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors h-12 px-4 py-2 bg-[#8c1a10] hover:bg-[#6d1410] text-white"
            >
              Get Started
              <ArrowRight className="ml-2 w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Final CTA */}
      <div className="text-center bg-white rounded-2xl p-8 shadow-lg">
        <h2 className="text-3xl font-bold text-[#000000] mb-4">
          Ready to join?
        </h2>
        <p className="text-[#6d6d6d] mb-6">
          Join the football professionals already using Scoutea to discover talent.
        </p>
        <div className="flex items-center justify-center gap-4">
          <button
            onClick={handleSubscribe}
            className="bg-[#8c1a10] hover:bg-[#6d1410] text-white font-semibold px-8 py-3 rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl inline-flex items-center justify-center"
          >
            Subscribe now
            <ArrowRight className="ml-2 w-5 h-5" />
          </button>
          <button
            onClick={handleLogin}
            className="text-[#6d6d6d] hover:text-[#8c1a10] font-semibold px-6 py-3 rounded-lg transition-all duration-200 inline-flex items-center justify-center"
          >
            Sign In
          </button>
        </div>
      </div>
    </>
  )
}
