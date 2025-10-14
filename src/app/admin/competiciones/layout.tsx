import DashboardHeader from '@/components/layout/dashboard-header'

export default function CompeticionesLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-[#080F17]">
      <DashboardHeader />
      {children}
    </div>
  )
}
