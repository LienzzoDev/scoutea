import type React from "react"
import type { Metadata } from "next"
import { GeistSans } from "geist/font/sans"
import { GeistMono } from "geist/font/mono"
import "../../../../globals.css"

export const metadata: Metadata = {
  title: "Editar Equipo - Scoutea",
  description: "Editar información del equipo",
  generator: "v0.app",
}

export default function EditarEquipoLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <div className={`${GeistSans.variable} ${GeistMono.variable}`}>
      {children}
    </div>
  )
}
