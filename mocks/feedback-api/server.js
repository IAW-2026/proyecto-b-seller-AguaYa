import { createServer } from 'http'

const VALID_API_KEY = process.env.X_API_KEY || 'buyer-secret-key-12345'
const PORT = process.env.PORT || 3001

const API_KEY_HEADER = 'x-api-key'.toLowerCase()

function parseUrl(url) {
  const [path, qs] = url.split('?')
  const params = Object.fromEntries(new URLSearchParams(qs))
  return { path, params }
}

function json(res, status, data) {
  res.writeHead(status, { 'Content-Type': 'application/json' })
  res.end(JSON.stringify(data))
}

function getApiKey(headers) {
  const entry = Object.entries(headers).find(
    ([k]) => k.toLowerCase() === API_KEY_HEADER
  )
  return entry ? entry[1] : null
}

// Hash determinístico simple (DJB2) para generar datos consistentes por userId
function hashStr(s) {
  let h = 5381
  for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) & 0xffffffff
  return Math.abs(h)
}

function seededRandom(seed) {
  let s = seed
  return () => {
    s = (s * 1664525 + 1013904223) & 0xffffffff
    return (s >>> 0) / 0xffffffff
  }
}

const DESCRIPTIONS = [
  'Excelente servicio, el bidón llegó en perfecto estado',
  'Muy bueno, llegó antes de lo esperado',
  'Buen producto, un poco tarde la entrega',
  'Siempre compro acá, muy recomendable',
  'El precio subió mucho comparado con otros vendedores',
  'Buena atención al cliente, resolvieron rápido un problema',
  'Rápido y seguro, todo perfecto',
  'El bidón llegó golpeado pero el agua estaba bien',
  'Podrían mejorar los horarios de entrega',
  'Muy conforme con la calidad del agua',
  'El mejor servicio de delivery de agua',
  'Tardaron mucho pero el producto es bueno',
  'Siempre llega a tiempo, excelente',
  'El conductor fue muy amable',
  'Buena relación precio-calidad',
  'Ya es la tercera vez que compro y siempre bien',
  'Me gusta que avisen antes de llegar',
  'El agua tiene un sabor extraño esta vez',
  'Todo bien, pero podrían tener más medios de pago',
  'Muy recomendable, compré para toda la semana',
]

function reviewsHandler(userId) {
  if (userId.includes('sin-resenas') || userId.includes('inexistente')) {
    return { promedio: 0, total: 0, ultimasResenas: [] }
  }

  const seed = hashStr(userId)
  const rand = seededRandom(seed)
  const prefix = userId.slice(0, 8)

  const total = 5 + (seed % 20) // 5 a 24 reseñas
  const promedioBase = 3 + ((seed % 20) / 10) // 3.0 a 5.0

  // Generar reseñas cuya distribución de estrellas aproxime el promedio
  const ultimasResenas = []
  let suma = 0
  for (let i = 0; i < total; i++) {
    // Distribución sesgada según promedioBase
    let estrellas
    const r = rand()
    if (promedioBase >= 4.5) {
      estrellas = r < 0.7 ? 5 : r < 0.9 ? 4 : r < 0.97 ? 3 : 2
    } else if (promedioBase >= 4.0) {
      estrellas = r < 0.5 ? 5 : r < 0.75 ? 4 : r < 0.9 ? 3 : r < 0.97 ? 2 : 1
    } else if (promedioBase >= 3.5) {
      estrellas = r < 0.3 ? 5 : r < 0.55 ? 4 : r < 0.75 ? 3 : r < 0.9 ? 2 : 1
    } else {
      estrellas = r < 0.15 ? 5 : r < 0.35 ? 4 : r < 0.55 ? 3 : r < 0.8 ? 2 : 1
    }
    suma += estrellas

    const descIdx = (seed + i * 7) % DESCRIPTIONS.length
    const diasAtras = i * 3 + Math.floor(rand() * 2)
    const fecha = new Date(Date.now() - diasAtras * 86400000).toISOString()

    ultimasResenas.push({
      id_pedido: `${prefix}_mock_${String(i + 1).padStart(3, '0')}`,
      estrellas,
      descripcion: DESCRIPTIONS[descIdx],
      fecha,
    })
  }

  const promedio = Math.round((suma / total) * 10) / 10

  // ultimasResenas siempre son las últimas 5 (las más recientes)
  const ultimas5 = ultimasResenas.slice(-5)

  return { promedio, total, ultimasResenas: ultimas5 }
}

const server = createServer((req, res) => {
  const { path } = parseUrl(req.url)
  const method = req.method.toUpperCase()

  if (method === 'GET' && path.startsWith('/api/reviews/')) {
    const apiKey = getApiKey(req.headers)
    if (!apiKey || apiKey !== VALID_API_KEY) {
      return json(res, 401, { error: 'Unauthorized' })
    }

    const userId = path.replace('/api/reviews/', '')
    if (!userId) {
      return json(res, 400, { error: 'Missing userId' })
    }

    return json(res, 200, reviewsHandler(userId))
  }

  if (method === 'POST' && path === '/api/feedback/reviews') {
    const apiKey = getApiKey(req.headers)
    if (!apiKey || apiKey !== VALID_API_KEY) {
      return json(res, 401, { error: 'Unauthorized' })
    }
    return json(res, 201, { success: true })
  }

  json(res, 404, { error: 'Not found' })
})

server.listen(PORT, () => {
  console.log(`[feedback-api-mock] running on http://0.0.0.0:${PORT}`)
})
