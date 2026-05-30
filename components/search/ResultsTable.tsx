'use client'

import { useState } from 'react'
import type { SearchResult, SearchFilters } from '@/types'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { formatARS } from '@/lib/utils'
import { ExternalLink, CheckCircle, Clock, Star, ShoppingCart } from 'lucide-react'

const SOURCE_LABELS: Record<string, string> = {
  mercadolibre: 'Mercado Libre',
  repuestera:   'Repuestera',
  marketplace:  'Marketplace',
}

const SOURCE_COLORS: Record<string, string> = {
  mercadolibre: 'bg-yellow-50 border-yellow-200',
  repuestera:   'bg-blue-50 border-blue-200',
  marketplace:  'bg-purple-50 border-purple-200',
}

interface ResultsTableProps {
  results: SearchResult[]
  vehicleInfo: string
  partQuery: string
  onFiltersChange?: (filters: SearchFilters) => void
}

export function ResultsTable({ results, vehicleInfo, partQuery }: ResultsTableProps) {
  const [sortBy, setSortBy] = useState<SearchFilters['sortBy']>('relevance')
  const [onlyValidated, setOnlyValidated] = useState(false)

  const sorted = [...results].sort((a, b) => {
    if (onlyValidated) {
      if (a.isValidated !== b.isValidated) return a.isValidated ? -1 : 1
    }
    switch (sortBy) {
      case 'price_asc':  return a.priceARS - b.priceARS
      case 'price_desc': return b.priceARS - a.priceARS
      case 'validation_count': return b.validationCount - a.validationCount
      default:
        if (a.isValidated !== b.isValidated) return a.isValidated ? -1 : 1
        return a.priceARS - b.priceARS
    }
  })

  const displayed = onlyValidated ? sorted.filter((r) => r.isValidated) : sorted

  if (results.length === 0) {
    return (
      <div className="text-center py-16 text-gray-500">
        <div className="text-4xl mb-3">🔍</div>
        <p className="text-lg font-medium">No se encontraron resultados</p>
        <p className="text-sm mt-1">
          Intentá buscar con otro nombre de repuesto o revisá la marca/modelo
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Header y controles */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">
            {results.length} resultados para <span className="text-primary-600">"{partQuery}"</span>
          </h2>
          <p className="text-sm text-gray-500">{vehicleInfo}</p>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={onlyValidated}
              onChange={(e) => setOnlyValidated(e.target.checked)}
              className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
            />
            Solo validados
          </label>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as SearchFilters['sortBy'])}
            className="text-sm border border-gray-300 rounded-lg px-3 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="relevance">Relevancia</option>
            <option value="price_asc">Precio: menor a mayor</option>
            <option value="price_desc">Precio: mayor a menor</option>
            <option value="validation_count">Más validados</option>
          </select>
        </div>
      </div>

      {/* Tabla desktop / cards mobile */}
      <div className="hidden md:block overflow-x-auto rounded-xl border border-gray-200 shadow-sm">
        <table className="min-w-full divide-y divide-gray-200 bg-white">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Producto</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Fuente</th>
              <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Precio</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Estado</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Validación</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {displayed.map((result) => (
              <tr key={result.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-4 py-3">
                  <div className="flex items-start gap-3">
                    {result.thumbnail && (
                      <img src={result.thumbnail} alt="" className="w-12 h-12 object-contain rounded border border-gray-200 flex-shrink-0" />
                    )}
                    <div>
                      <p className="text-sm font-medium text-gray-900 line-clamp-2">{result.title}</p>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {result.condition === 'new' ? 'Nuevo' : result.condition === 'used' ? 'Usado' : 'Reacondicionado'}
                        {result.sellerName && ` · ${result.sellerName}`}
                      </p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <Badge variant="info">{SOURCE_LABELS[result.source] ?? result.source}</Badge>
                </td>
                <td className="px-4 py-3 text-right">
                  <span className="text-base font-bold text-gray-900">{formatARS(result.priceARS)}</span>
                  {result.currency === 'USD' && (
                    <p className="text-xs text-gray-400">USD {result.price.toFixed(2)}</p>
                  )}
                </td>
                <td className="px-4 py-3">
                  <Badge variant={result.availability === 'in_stock' ? 'success' : 'warning'}>
                    {result.availability === 'in_stock' ? 'Disponible' : 'Sin stock'}
                  </Badge>
                </td>
                <td className="px-4 py-3">
                  {result.isValidated ? (
                    <span className="inline-flex items-center gap-1 text-xs text-green-700 font-medium">
                      <CheckCircle className="w-3.5 h-3.5" />
                      {result.validationCount} confirmados
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-xs text-gray-400">
                      <Clock className="w-3.5 h-3.5" />
                      Sin validar
                    </span>
                  )}
                </td>
                <td className="px-4 py-3 text-right">
                  <a
                    href={result.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-sm font-medium text-primary-600 hover:text-primary-700"
                  >
                    Ver <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Cards mobile */}
      <div className="md:hidden space-y-3">
        {displayed.map((result) => (
          <div key={result.id} className={`rounded-xl border p-4 bg-white shadow-sm ${SOURCE_COLORS[result.source] ?? ''}`}>
            <div className="flex gap-3">
              {result.thumbnail && (
                <img src={result.thumbnail} alt="" className="w-16 h-16 object-contain rounded border border-gray-200 flex-shrink-0" />
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 line-clamp-2">{result.title}</p>
                <div className="flex items-center gap-2 mt-1 flex-wrap">
                  <Badge variant="info" size="sm">{SOURCE_LABELS[result.source] ?? result.source}</Badge>
                  <Badge variant={result.availability === 'in_stock' ? 'success' : 'warning'} size="sm">
                    {result.availability === 'in_stock' ? 'Disponible' : 'Sin stock'}
                  </Badge>
                </div>
              </div>
            </div>
            <div className="flex items-center justify-between mt-3">
              <div>
                <p className="text-lg font-bold text-gray-900">{formatARS(result.priceARS)}</p>
                {result.isValidated && (
                  <p className="text-xs text-green-700 flex items-center gap-1">
                    <CheckCircle className="w-3 h-3" />
                    {result.validationCount} confirmados
                  </p>
                )}
              </div>
              <a
                href={result.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 bg-primary-600 hover:bg-primary-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
              >
                <ShoppingCart className="w-4 h-4" />
                Ver oferta
              </a>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
