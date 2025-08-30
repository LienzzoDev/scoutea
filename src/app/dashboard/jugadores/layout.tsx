import type React from "react"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Scoutea - Sports Management",
  description: "Professional sports scouting and player management platform",
  generator: "v0.app",
}

export default function JugadoresLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return <>{children}</>
}
