import { 
  BarChart3, 
  Target, 
  TrendingUp
} from 'lucide-react'
import type { Metadata } from 'next'

import PlanSelector from '@/components/homepage/PlanSelector'

export const metadata: Metadata = {
  title: 'Scoutea - Football Scouting Platform',
  description: 'The most advanced platform for scouts, analysts and football professionals. Access detailed data on thousands of players and make informed decisions.',
  keywords: 'scouting, football, analysis, players, statistics',
  openGraph: {
    title: 'Scoutea - Football Scouting Platform',
    description: 'The most advanced platform for scouts, analysts and football professionals.',
    type: 'website',
  },
}

export default function HomePage() {
  const plans = [
    {
      id: 'member',
      name: 'Member',
      price: { monthly: 9.9, yearly: 9.9 },
      description: 'Full access to the entire Scoutea platform',
      features: [
        'Wonderkids — Full access to the player database',
        'Tournaments — Browse all competitions and events',
        'On Demand — Custom reports on any player'
      ],
      popular: true,
      color: 'from-[#8c1a10] to-[#a01e12]'
    }
  ]



  return (
    <div className="min-h-screen bg-gradient-to-br from-[#f8f7f4] to-[#e8e6e0]">
      {/* Hero Section */}
      <main className="max-w-7xl mx-auto px-6 py-16">
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold text-[#000000] mb-6">
            Join the
            <span className="text-[#8c1a10]"> Scouting</span> Community
          </h1>
          <p className="text-xl text-[#6d6d6d] mb-8 max-w-3xl mx-auto">
            Access the most advanced platform for professional football analysis.
            One single plan unlocks everything: Wonderkids, Tournaments and On Demand reports.
          </p>
          
          <PlanSelector plans={plans} />
        </div>

        {/* Features Section */}
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold text-[#000000] mb-8">
            Why choose Scoutea?
          </h2>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-[#8c1a10] to-[#a01e12] rounded-full mb-4">
                <BarChart3 className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-[#000000] mb-2">Accurate Data</h3>
              <p className="text-[#6d6d6d]">
                Up-to-date, verified information on thousands of professional players
              </p>
            </div>

            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-[#8c1a10] to-[#a01e12] rounded-full mb-4">
                <Target className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-[#000000] mb-2">Advanced Analysis</h3>
              <p className="text-[#6d6d6d]">
                Analysis tools that help you make better decisions
              </p>
            </div>

            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-[#8c1a10] to-[#a01e12] rounded-full mb-4">
                <TrendingUp className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-[#000000] mb-2">Continuous Updates</h3>
              <p className="text-[#6d6d6d]">
                Database updated regularly with fresh information
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-200 mt-16" style={{ backgroundColor: '#edebe6' }}>
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="text-center text-[#6d6d6d]">
            <p>&copy; 2024 Scoutea. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}