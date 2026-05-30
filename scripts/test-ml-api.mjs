const TOKEN = 'APP_USR-8519475517146974-053010-09d50d6cc98fbbef4dc8f11b3b95f100-74958965'
const query  = 'amortiguadores Toyota Corolla 2020'
// Sin categoría primero — verificar que el token funciona
const url    = `https://api.mercadolibre.com/sites/MLA/search?q=${encodeURIComponent(query)}&limit=5`

console.log('Buscando:', query)
const res  = await fetch(url, { headers: { Authorization: `Bearer ${TOKEN}` } })
const data = await res.json()

if (!res.ok) { console.error('❌', data); process.exit(1) }

console.log(`✅ ${data.paging?.total ?? 0} resultados totales, mostrando ${data.results?.length}`)
console.log()
data.results.forEach((item, i) => {
  console.log(`[${i+1}] ${item.title}`)
  console.log(`    💰 $${item.price.toLocaleString('es-AR')} ${item.currency_id} | ${item.condition === 'new' ? 'Nuevo' : 'Usado'} | Stock: ${item.available_quantity}`)
  console.log(`    🔗 ${item.permalink.slice(0, 70)}...`)
  console.log()
})
