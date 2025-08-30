import type React from "react"
import type { Metadata } from "next"
import { DashboardHeader } from "@/components/dashboard-header"
import "./dashboard.css"

export const metadata: Metadata = {
  title: "Scoutea Dashboard",
  description: "Football scouting dashboard",
  generator: "v0.app",
}

export default function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <div className="min-h-screen bg-[#080F17] text-[#D6DDE6]">
      <DashboardHeader />
      {children}
    </div>
  )
}
