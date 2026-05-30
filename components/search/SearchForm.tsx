'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/Button'

// Catálogo básico — se puede extender desde DB en el futuro
const BRANDS: Record<string, string[]> = {
  // ── Marcas europeas/americanas/japonesas ──────────────────────────────
  Toyota:     ['Corolla', 'Hilux', 'Etios', 'Yaris', 'Land Cruiser', 'RAV4', 'SW4', 'Fortuner'],
  Ford:       ['Focus', 'Ranger', 'Fiesta', 'F-150', 'EcoSport', 'Explorer', 'Mondeo', 'Ka'],
  Chevrolet:  ['Cruze', 'S10', 'Onix', 'Tracker', 'Spin', 'Trailblazer', 'Captiva', 'Montana'],
  Volkswagen: ['Golf', 'Polo', 'Amarok', 'Tiguan', 'Vento', 'Saveiro', 'Suran', 'Gol', 'Taos'],
  Renault:    ['Kangoo', 'Sandero', 'Logan', 'Duster', 'Megane', 'Clio', 'Koleos', 'Captur'],
  Peugeot:    ['208', '308', '3008', '2008', '408', '508', 'Partner', 'Boxer', 'Expert'],
  Fiat:       ['Siena', 'Palio', 'Uno', 'Cronos', 'Toro', 'Ducato', 'Strada', 'Argo', 'Pulse'],
  Honda:      ['Civic', 'CR-V', 'Fit', 'HR-V', 'City', 'WR-V', 'Accord'],
  Nissan:     ['Frontier', 'March', 'Sentra', 'X-Trail', 'Kicks', 'Versa', 'Navara', 'Pathfinder'],
  Hyundai:    ['Accent', 'Tucson', 'Santa Fe', 'i30', 'Creta', 'Venue', 'Ioniq 5', 'Ioniq 6'],
  Mercedes:   ['Sprinter', 'Clase A', 'Clase C', 'GLA', 'GLC', 'Vito', 'Viano'],
  BMW:        ['Serie 1', 'Serie 3', 'Serie 5', 'X1', 'X3', 'X5'],
  Audi:       ['A3', 'A4', 'A6', 'Q3', 'Q5', 'Q7'],
  Citroen:    ['C3', 'C4', 'C5 Aircross', 'Berlingo', 'Jumpy', 'Jumper'],
  Kia:        ['Sportage', 'Sorento', 'Cerato', 'Picanto', 'Rio', 'Stonic', 'EV6'],
  Mitsubishi: ['L200', 'Outlander', 'Eclipse Cross', 'Montero', 'ASX'],
  Subaru:     ['Forester', 'Outback', 'Impreza', 'XV'],
  Jeep:       ['Grand Cherokee', 'Renegade', 'Compass', 'Wrangler', 'Commander'],
  Dodge:      ['Journey', 'RAM 1500', 'RAM 2500', 'Durango'],
  Suzuki:     ['Jimny', 'S-Cross', 'Vitara', 'Swift', 'Ignis'],

  // ── Marcas chinas ─────────────────────────────────────────────────────
  Chery: [
    // Tiggo (SUV) — gama actual
    'Tiggo 2 Pro',
    'Tiggo 4 Pro',
    'Tiggo 7 Pro',
    'Tiggo 8 Pro',
    'Tiggo 8 Pro Max',
    // Arrizo (sedán)
    'Arrizo 5 GT',
    'Arrizo 5',
    'Arrizo 6',
    // Modelos históricos (parque automotor antiguo)
    'Tiggo 3',
    'Tiggo 5',
    'QQ',
    'Face',
  ],

  BAIC: [
    'X35',
    'X55',
    'X7',
    'BJ40',
    'BJ40 Plus',
    'EU5 (eléctrico)',
  ],

  BYD: [
    'Atto 3',
    'Dolphin',
    'Seagull',
    'Tang DM-i',
    'Han EV',
    'Song Plus DM-i',
    'Shark (pickup)',
  ],

  JAC: [
    'S3',
    'S4',
    'J7',
    'Sei4',
    'Sei7',
    'T8 Pro (pickup)',
    'E-JS1 (eléctrico)',
  ],

  'Haval / GWM': [
    'H2',
    'H6',
    'H9',
    'Jolion',
    'Jolion HEV',
    'Poer (pickup)',
    'Ora 03 (eléctrico)',
    'Tank 300',
  ],

  MG: [
    'ZS',
    'ZS EV',
    'HS',
    'RX5',
    'MG5 GT',
    'MG4 EV',
    'Cyberster',
  ],

  Changan: [
    'CS35 Plus',
    'CS55 Plus',
    'CS75 Plus',
    'Lamore',
    'Hunter (pickup)',
    'Uni-K',
    'Uni-T',
    'Deepal SL03',
  ],

  Geely: [
    'Coolray',
    'Okavango',
    'Atlas',
    'Emgrand X7 Sport',
    'Monjaro',
  ],

  DFSK: [
    'Glory 560',
    'Glory 580',
    'Glory 580 Pro',
    'Rich 6 (pickup)',
    'AX7 Pro',
  ],

  Omoda: [
    'Omoda 5',
    'Omoda 5 EV',
    'Omoda C5',
  ],

  Jetour: [
    'Dashing',
    'X70 Plus',
    'X90 Plus',
    'T2',
  ],

  FAW: [
    'T77 Pro',
    'Bestune B70',
    'Bestune T99',
  ],
}

const CURRENT_YEAR = new Date().getFullYear()
const YEARS = Array.from({ length: 30 }, (_, i) => CURRENT_YEAR - i)

const COMMON_PARTS = [
  'Amortiguadores', 'Pastillas de freno', 'Discos de freno', 'Filtro de aceite',
  'Filtro de aire', 'Bujías', 'Correa de distribución', 'Batería', 'Alternador',
  'Bomba de agua', 'Radiador', 'Clutch', 'Embrague', 'Neumáticos',
]

interface SearchFormProps {
  initialBrand?: string
  initialModel?: string
  initialYear?: string
  initialPart?: string
}

export function SearchForm({ initialBrand, initialModel, initialYear, initialPart }: SearchFormProps) {
  const router = useRouter()
  const [brand, setBrand] = useState(initialBrand ?? '')
  const [model, setModel] = useState(initialModel ?? '')
  const [year, setYear] = useState(initialYear ?? '')
  const [part, setPart] = useState(initialPart ?? '')
  const [loading, setLoading] = useState(false)

  const models = brand ? BRANDS[brand] ?? [] : []

  function handleBrandChange(val: string) {
    setBrand(val)
    setModel('')
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!brand || !model || !year || !part.trim()) return
    setLoading(true)
    const params = new URLSearchParams({ brand, model, year, part: part.trim() })
    router.push(`/resultados?${params.toString()}`)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Marca */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Marca</label>
          <select
            value={brand}
            onChange={(e) => handleBrandChange(e.target.value)}
            required
            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          >
            <option value="">Seleccioná una marca</option>
            {Object.keys(BRANDS).sort().map((b) => (
              <option key={b} value={b}>{b}</option>
            ))}
          </select>
        </div>

        {/* Modelo */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Modelo</label>
          <select
            value={model}
            onChange={(e) => setModel(e.target.value)}
            required
            disabled={!brand}
            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
          >
            <option value="">Seleccioná un modelo</option>
            {models.map((m) => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>
        </div>

        {/* Año */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Año</label>
          <select
            value={year}
            onChange={(e) => setYear(e.target.value)}
            required
            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          >
            <option value="">Seleccioná el año</option>
            {YEARS.map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Repuesto */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Repuesto a buscar
        </label>
        <input
          type="text"
          value={part}
          onChange={(e) => setPart(e.target.value)}
          placeholder="Ej: amortiguadores, pastillas de freno, filtro de aceite..."
          required
          list="common-parts"
          className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
        />
        <datalist id="common-parts">
          {COMMON_PARTS.map((p) => <option key={p} value={p} />)}
        </datalist>
        <p className="text-xs text-gray-500 mt-1">
          Podés buscar múltiples repuestos separando con coma
        </p>
      </div>

      <Button type="submit" size="lg" loading={loading} className="w-full sm:w-auto">
        🔍 Buscar precios
      </Button>
    </form>
  )
}
