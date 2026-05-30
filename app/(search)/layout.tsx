import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Repuestify',
}

export default function SearchLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col min-h-screen">
      <header className="bg-primary-700 text-white shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center gap-3">
          <span className="text-accent-400 text-2xl">🔧</span>
          <span className="text-xl font-bold tracking-tight">Repuestify</span>
          <span className="text-primary-300 text-sm ml-1 hidden sm:block">
            — Comparador de repuestos
          </span>
        </div>
      </header>
      <main className="flex-1">{children}</main>
      <footer className="bg-gray-800 text-gray-400 text-sm py-6 mt-auto">
        <div className="max-w-7xl mx-auto px-4 text-center">
          © {new Date().getFullYear()} Repuestify · Los precios son orientativos, verificar en cada plataforma.
        </div>
      </footer>
    </div>
  )
}
