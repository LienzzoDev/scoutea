'use client'

import { Check, Star, Zap, Users, Shield, Globe, Headphones, ArrowLeft } from 'lucide-react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useState, useEffect } from 'react'

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { getStripe } from '@/lib/stripe'

export default function SubscriptionPlansPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>('monthly')
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null)

  // Obtener plan preseleccionado desde URL params o localStorage
  useEffect(() => {
    const planFromUrl = searchParams.get('plan') || searchParams.get('selectedPlan')
    const planFromStorage = localStorage.getItem('selectedPlan')
    
    if (planFromUrl) {
      setSelectedPlan(planFromUrl)
      localStorage.setItem('selectedPlan', planFromUrl)
    } else if (planFromStorage) {
      setSelectedPlan(planFromStorage)
    }
  }, [searchParams])

  const plans = [
    {
      id: 'basic',
      name: 'Basic',
      description: 'Perfect for individual scouts and small teams',
      monthlyPrice: 10,
      annualPrice: 8,
      icon: Users,
      color: 'bg-blue-500',
      features: [
        'Up to 50 player profiles',
        'Basic scouting reports',
        'Standard analytics dashboard',
        'Email support',
        'Mobile app access',
        'Basic comparison tools',
        'Export to PDF',
        '1 team collaboration'
      ],
      limitations: [
        'Limited to 5 reports per month',
        'Basic data visualization',
        'Standard response time'
      ]
    },
    {
      id: 'premium',
      name: 'Premium',
      description: 'Advanced features for professional scouts and agencies',
      monthlyPrice: 20,
      annualPrice: 17,
      icon: Star,
      color: 'bg-gradient-to-r from-purple-500 to-pink-500',
      popular: true,
      features: [
        'Unlimited player profiles',
        'Advanced scouting reports',
        'AI-powered insights',
        'Priority support',
        'Advanced analytics & trends',
        'Custom comparison tools',
        'Export to multiple formats',
        'Unlimited team collaboration',
        'Video analysis tools',
        'Custom branding',
        'API access',
        'Advanced filters & search'
      ],
      limitations: []
    }
  ]

  const handleSelectPlan = (planId: string) => {
    setSelectedPlan(planId)
    localStorage.setItem('selectedPlan', planId)
  }

  const handleSubscribe = async () => {
    if (!selectedPlan) return
    
    try {
      console.log(`Selected plan: ${selectedPlan} (${billingCycle})`)
      
      // Crear checkout session
      const response = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          plan: selectedPlan,
          billing: billingCycle,
        }),
      })

      const { sessionId } = await response.json()

      if (!sessionId) {
        throw new Error('No session ID received')
      }

      // Redirigir a Stripe Checkout
      const stripe = await getStripe()
      if (stripe) {
        const { error } = await stripe.redirectToCheckout({ sessionId })
        
        if (error) {
          console.error('Error redirecting to checkout:', error)
          alert('Error al procesar el pago. Por favor, inténtalo de nuevo.')
        }
      } else {
        console.error('Stripe not loaded')
        alert('Error al cargar Stripe. Por favor, recarga la página e inténtalo de nuevo.')
      }
    } catch (error) {
      console.error('Error selecting plan:', error)
      alert('Error al procesar el pago. Por favor, inténtalo de nuevo.')
    }
  }

  const getPrice = (plan: typeof plans[0]) => {
    return billingCycle === 'annual' ? plan.annualPrice : plan.monthlyPrice
  }

  const getSavings = (plan: typeof plans[0]) => {
    const monthlyTotal = plan.monthlyPrice * 12
    const annualTotal = plan.annualPrice * 12
    return monthlyTotal - annualTotal
  }

  return (
    <div className="min-h-screen bg-[#f8f7f4]">
      <main className="px-6 py-12 max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-[#000000] mb-4">
            Choose Your Plan
          </h1>
          <p className="text-[#6d6d6d] text-xl max-w-2xl mx-auto">
            Unlock the full potential of Scoutea with our comprehensive scouting platform
          </p>
        </div>

        {/* Billing Toggle */}
        <div className="flex justify-center mb-8">
          <div className="bg-white rounded-lg p-1 border border-[#e7e7e7]">
            <button
              onClick={() => setBillingCycle('monthly')}
              className={`px-6 py-2 rounded-md text-sm font-medium transition-all ${
                billingCycle === 'monthly'
                  ? 'bg-[#8c1a10] text-white'
                  : 'text-[#6d6d6d] hover:text-[#000000]'
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setBillingCycle('annual')}
              className={`px-6 py-2 rounded-md text-sm font-medium transition-all ${
                billingCycle === 'annual'
                  ? 'bg-[#8c1a10] text-white'
                  : 'text-[#6d6d6d] hover:text-[#000000]'
              }`}
            >
              Annual
              {billingCycle === 'annual' && (
                <Badge className="ml-2 bg-green-500 text-white text-xs">
                  Save 20%
                </Badge>
              )}
            </button>
          </div>
        </div>

        {/* Plans Grid */}
        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {plans.map((plan) => {
            const Icon = plan.icon
            const price = getPrice(plan)
            const savings = getSavings(plan)
            
            return (
              <Card 
                key={plan.id}
                className={`relative overflow-hidden cursor-pointer transition-all duration-300 ${
                  selectedPlan === plan.id
                    ? 'border-2 border-[#8c1a10] shadow-xl scale-105' 
                    : plan.popular 
                    ? 'border border-[#8c1a10] shadow-lg' 
                    : 'border border-[#e7e7e7] hover:shadow-md'
                }`}
                onClick={() => handleSelectPlan(plan.id)}
              >
                {plan.popular && (
                  <div className="absolute top-0 left-0 right-0 bg-[#8c1a10] text-white text-center py-2 text-sm font-medium">
                    Most Popular
                  </div>
                )}
                
                <CardHeader className={`text-center ${plan.popular ? 'pt-12' : 'pt-6'}`}>
                  <div className={`w-16 h-16 mx-auto rounded-full ${plan.color} flex items-center justify-center mb-4`}>
                    <Icon className="w-8 h-8 text-white" />
                  </div>
                  
                  <CardTitle className="text-2xl font-bold text-[#000000]">
                    {plan.name}
                  </CardTitle>
                  
                  <p className="text-[#6d6d6d] text-sm">
                    {plan.description}
                  </p>
                  
                  <div className="mt-4">
                    <div className="flex items-baseline justify-center">
                      <span className="text-4xl font-bold text-[#000000]">
                        ${price}
                      </span>
                      <span className="text-[#6d6d6d] ml-1">
                        /{billingCycle === 'annual' ? 'month' : 'month'}
                      </span>
                    </div>
                    
                    {billingCycle === 'annual' && (
                      <div className="mt-2">
                        <p className="text-sm text-green-600 font-medium">
                          Save ${savings} per year
                        </p>
                        <p className="text-xs text-[#6d6d6d]">
                          Billed annually (${plan.annualPrice * 12}/year)
                        </p>
                      </div>
                    )}
                  </div>
                </CardHeader>

                <CardContent className="px-6 pb-6">
                  {/* Features */}
                  <div className="mb-6">
                    <h4 className="font-semibold text-[#000000] mb-3 flex items-center">
                      <Check className="w-4 h-4 text-green-500 mr-2" />
                      What&apos;s included:
                    </h4>
                    <ul className="space-y-2">
                      {plan.features.map((feature, index) => (
                        <li key={index} className="flex items-start text-sm text-[#6d6d6d]">
                          <Check className="w-4 h-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                          {feature}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Limitations (only for Basic plan) */}
                  {plan.limitations.length > 0 && (
                    <div className="mb-6">
                      <h4 className="font-semibold text-[#000000] mb-3 flex items-center">
                        <Zap className="w-4 h-4 text-yellow-500 mr-2" />
                        Limitations:
                      </h4>
                      <ul className="space-y-2">
                        {plan.limitations.map((limitation, index) => (
                          <li key={index} className="flex items-start text-sm text-[#6d6d6d]">
                            <span className="w-4 h-4 text-yellow-500 mr-2 mt-0.5 flex-shrink-0">•</span>
                            {limitation}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* CTA Button */}
                  <Button
                    onClick={(e) => {
                      e.stopPropagation()
                      handleSelectPlan(plan.id)
                    }}
                    className={`w-full py-3 text-lg font-semibold ${
                      selectedPlan === plan.id
                        ? 'bg-[#8c1a10] hover:bg-[#6d1410] text-white'
                        : plan.popular
                        ? 'bg-[#8c1a10] hover:bg-[#6d1410] text-white'
                        : 'bg-white border-2 border-[#8c1a10] text-[#8c1a10] hover:bg-[#8c1a10] hover:text-white'
                    }`}
                  >
                    {selectedPlan === plan.id ? 'Selected' : `Choose ${plan.name}`}
                  </Button>
                </CardContent>
              </Card>
            )
          })}
        </div>

        {/* Continue to Payment Button */}
        {selectedPlan && (
          <div className="text-center mt-8 space-y-4">
            <Button
              onClick={handleSubscribe}
              className="bg-[#8c1a10] hover:bg-[#6d1410] text-white font-semibold px-8 py-3 rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl"
            >
              Continuar al pago - {plans.find(p => p.id === selectedPlan)?.name}
            </Button>
            <div>
              <Button
                variant="ghost"
                onClick={() => router.push('/login')}
                className="text-[#6d6d6d] hover:text-[#8c1a10]"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Iniciar sesión
              </Button>
            </div>
          </div>
        )}

        {/* Additional Info */}
        <div className="mt-12 text-center">
          <div className="bg-white rounded-lg p-6 border border-[#e7e7e7] max-w-2xl mx-auto">
            <h3 className="text-lg font-semibold text-[#000000] mb-3">
              Why Choose Scoutea?
            </h3>
            <div className="grid md:grid-cols-3 gap-4 text-sm text-[#6d6d6d]">
              <div className="flex items-center justify-center">
                <Shield className="w-5 h-5 text-green-500 mr-2" />
                Secure & Reliable
              </div>
              <div className="flex items-center justify-center">
                <Globe className="w-5 h-5 text-blue-500 mr-2" />
                Global Database
              </div>
              <div className="flex items-center justify-center">
                <Headphones className="w-5 h-5 text-purple-500 mr-2" />
                24/7 Support
              </div>
            </div>
          </div>
        </div>

        {/* FAQ or Additional Info */}
        <div className="mt-8 text-center">
          <p className="text-sm text-[#6d6d6d]">
            All plans include a 14-day free trial. Cancel anytime.
          </p>
          <p className="text-sm text-[#6d6d6d] mt-2">
            Need help choosing? <span className="text-[#8c1a10] cursor-pointer hover:underline">Contact our team</span>
          </p>
        </div>
      </main>
    </div>
  )
}
