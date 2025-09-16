import { GeistMono } from "geist/font/mono"
import { GeistSans } from "geist/font/sans"
import type { Metadata } from "next"
import type React from "react"
import "../../../../globals.css"

export const metadata: Metadata = {
  title: "Editar Jugador - Scoutea",
  description: "Editar información del jugador",
  generator: "v0.app",
}

export default function EditarJugadorLayout({
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
