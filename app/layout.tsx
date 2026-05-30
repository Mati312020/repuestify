import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Repuestify — Buscador de repuestos vehiculares',
  description: 'Encontrá los mejores precios en repuestos para tu vehículo. Comparamos Mercado Libre, repuesteras y marketplaces en un solo lugar.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className="h-full">
      <body className="min-h-full flex flex-col bg-gray-50 text-gray-900 antialiased">
        {children}
      </body>
    </html>
  )
}
