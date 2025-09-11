import DashboardHeader from '@/components/dashboard-header'

export default function EquiposLayout({
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
