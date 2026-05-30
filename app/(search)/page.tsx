import { SearchForm } from '@/components/search/SearchForm'

export default function HomePage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Hero */}
      <div className="text-center mb-10">
        <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-3">
          Encontrá el mejor precio en{' '}
          <span className="text-primary-600">repuestos para tu auto</span>
        </h1>
        <p className="text-gray-500 text-lg max-w-2xl mx-auto">
          Comparamos Mercado Libre, marketplaces y repuesteras en tiempo real.
          Un solo lugar para elegir el mejor precio.
        </p>
      </div>

      {/* Form Card */}
      <div className="bg-white rounded-2xl shadow-md border border-gray-200 p-6 sm:p-8">
        <h2 className="text-lg font-semibold text-gray-800 mb-5">¿Qué repuesto necesitás?</h2>
        <SearchForm />
      </div>

      {/* Info cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-10">
        {[
          {
            icon: '🔍',
            title: 'Búsqueda unificada',
            desc: 'Buscamos en Mercado Libre, repuesteras locales y marketplaces al mismo tiempo.',
          },
          {
            icon: '💰',
            title: 'Mejor precio',
            desc: 'Comparás todos los precios disponibles en una tabla clara y ordenada.',
          },
          {
            icon: '✅',
            title: 'Validación comunitaria',
            desc: 'Otros usuarios confirman si el repuesto es compatible con tu vehículo.',
          },
        ].map((card) => (
          <div key={card.title} className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
            <div className="text-2xl mb-2">{card.icon}</div>
            <h3 className="font-semibold text-gray-900 mb-1">{card.title}</h3>
            <p className="text-sm text-gray-500">{card.desc}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
