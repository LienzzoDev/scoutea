import type { Metadata } from "next"
import type React from "react"

export const metadata: Metadata = {
  title: "Scoutea - Player Management",
  description: "Sports scouting and player management platform",
  generator: "v0.app",
}

export default function NuevoJugadorLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return <>{children}</>
}
