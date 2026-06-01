import 'dotenv/config'
import { PrismaClient } from '@prisma/client'
import { PrismaNeon } from '@prisma/adapter-neon'

const connectionString = process.env.DATABASE_URL
if (!connectionString) {
  throw new Error('DATABASE_URL no está definida')
}

const prisma = new PrismaClient({ adapter: new PrismaNeon({ connectionString }) })

const VENDOR_NAMES = [
  'Distribuidora Norte', 'Agua del Valle', 'Crystal Aqua',
  'PureWater SRL', 'AquaVida SA', 'FuenteClara',
  'Río de Agua', 'Manantial Azul', 'Oasis Distribuciones',
  'HydroPoint',
]

const PRODUCT_NAMES = [
  'Bidón 20L Premium', 'Bidón 12L', 'Bidón 10L',
  'Pack x6 Agua 2L', 'Pack x12 Agua 500ml',
  'Bidón 8L', 'Bidón 6L', 'Pack x3 Agua 1.5L',
  'Agua Alcalina 1L', 'Bidón 25L',
  'Pack x4 Agua 2L', 'Bidón 15L', 'Agua Mineral 1L',
  'Pack x6 Agua 1L', 'Bidón 30L',
  'Agua Saborizada 1.5L', 'Bidón 5L', 'Pack x12 Agua 1L',
  'Agua Con Gas 1L', 'Bidón 18L',
]

const BUYER_NAMES = Array.from({ length: 30 }, (_, i) => `buyer-seed-${i + 1}`)

async function main() {
  console.log('=== Limpiando datos de seed anteriores ===')

  await prisma.orderItem.deleteMany({ where: { order: { externalId: { startsWith: 'ext-seed-' } } } })
  await prisma.order.deleteMany({ where: { externalId: { startsWith: 'ext-seed-' } } })
  await prisma.product.deleteMany({ where: { name: { startsWith: '[Seed]' } } })
  await prisma.vendor.deleteMany({ where: { userId: { startsWith: 'seed-' } } })

  console.log('=== Creando 10 vendors ===')

  const vendors = await Promise.all(
    VENDOR_NAMES.map((name, i) =>
      prisma.vendor.create({
        data: {
          userId: `seed-vendor-${i + 1}`,
          name,
          address: `Av. Siempre Viva ${i + 1}00, Córdoba`,
          description: `Distribuidora de agua de mesa ${name}`,
        },
      })
    )
  )
  console.log(`  Creados ${vendors.length} vendors`)

  console.log('=== Creando productos (20/vendor) ===')

  let totalProducts = 0
  for (const vendor of vendors) {
    const products = []
    for (let i = 0; i < 20; i++) {
      const baseName = PRODUCT_NAMES[i % PRODUCT_NAMES.length]
      const price = Math.round((50 + Math.random() * 150) * 100) / 100
      const stock = Math.floor(5 + Math.random() * 45)
      products.push({
        vendorId: vendor.id,
        name: `[Seed] ${baseName} #${i + 1}`,
        price,
        stock,
        description: `Producto de ${vendor.name}`,
      })
    }
    await prisma.product.createMany({ data: products })
    totalProducts += products.length
  }
  console.log(`  Creados ${totalProducts} productos`)

  console.log('=== Creando órdenes (20 PAID + 10 READY por vendor) ===')

  const allProducts = await prisma.product.findMany({ where: { name: { startsWith: '[Seed]' } } })

  // Generate all order data first, then batch insert in parallel
  const orderDataList: { vendor: typeof vendors[0]; isPaid: boolean; orderIdx: number }[] = []
  for (const vendor of vendors) {
    for (let idx = 0; idx < 30; idx++) {
      orderDataList.push({ vendor, isPaid: idx < 20, orderIdx: idx })
    }
  }

  // Insert orders in batches of 20 to avoid overwhelming the DB
  let globalIdx = 0
  const BATCH = 20
  for (let batchStart = 0; batchStart < orderDataList.length; batchStart += BATCH) {
    const batch = orderDataList.slice(batchStart, batchStart + BATCH)
    await Promise.all(
      batch.map(async ({ vendor, isPaid, orderIdx }) => {
        const vendorProducts = allProducts.filter((p) => p.vendorId === vendor.id)
        const itemCount = 1 + Math.floor(Math.random() * 3)
        const itemsData = Array.from({ length: itemCount }, () => {
          const product = vendorProducts[Math.floor(Math.random() * vendorProducts.length)]
          const qty = 1 + Math.floor(Math.random() * 4)
          return {
            productId: product.id,
            productName: product.name,
            productPrice: product.price,
            quantity: qty,
          }
        })
        const total = Math.round(itemsData.reduce((sum, it) => sum + it.productPrice * it.quantity, 0) * 100) / 100
        const daysAgo = Math.floor(Math.random() * 14)
        const createdAt = new Date(Date.now() - daysAgo * 86400000)

        await prisma.order.create({
          data: {
            externalId: `ext-seed-${vendor.userId}-${orderIdx + 1}`,
            vendorId: vendor.id,
            buyerId: BUYER_NAMES[globalIdx % BUYER_NAMES.length],
            status: isPaid ? 'PAID' : 'READY',
            total,
            address: `Calle Falsa ${100 + globalIdx}, Córdoba`,
            createdAt,
            items: { create: itemsData },
          },
        })
        globalIdx++
      })
    )
  }
  console.log(`  Creadas ${globalIdx} órdenes`)
  console.log('=== Seed completado ===')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
