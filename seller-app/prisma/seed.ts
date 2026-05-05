import { PrismaClient, OrderStatus } from '@prisma/client'
import { Pool } from 'pg'
import { PrismaPg } from '@prisma/adapter-pg'
import * as dotenv from 'dotenv'

dotenv.config()

const pool = new Pool({ connectionString: process.env.DATABASE_URL })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

async function main() {
    console.log('🧹 Limpiando base de datos...')
    await prisma.orderItem.deleteMany()
    await prisma.order.deleteMany()
    await prisma.product.deleteMany()
    await prisma.vendor.deleteMany()

    console.log('🏪 Creando vendedores...')
    const vendor1 = await prisma.vendor.create({
        data: {
            userId: 'user_seed_001',
            name: 'Agua Pura SA',
            description: 'Distribuidora de agua mineral y bidones',
            address: 'Av.ellan 512, Punta Alta',
            cuil: '20-12345678-9',
            cuit: '30-12345678-9',
            reputation: 4.5,
        },
    })

    const vendor2 = await prisma.vendor.create({
        data: {
            userId: 'user_seed_002',
            name: 'Bidones del Sur',
            description: 'Agua de manantial directo a tu puerta',
            address: 'Av. San Martín 567, Bahía Blanca',
            cuil: '20-87654321-0',
            cuit: '30-87654321-0',
            reputation: 3.8,
        },
    })

    console.log('📦 Creando productos...')
    const product1 = await prisma.product.create({
        data: {
            vendorId: vendor1.id,
            name: 'Bidón 20 litros',
            description: 'Bidón de agua mineral natural',
            price: 2500,
            stock: 50,
        },
    })

    const product2 = await prisma.product.create({
        data: {
            vendorId: vendor1.id,
            name: 'Bidón 12 litros',
            description: 'Bidón de agua mineral tamaño mediano',
            price: 1800,
            stock: 30,
        },
    })

    const product3 = await prisma.product.create({
        data: {
            vendorId: vendor2.id,
            name: 'Bidón 20 litros Premium',
            description: 'Agua de manantial con minerales naturales',
            price: 3200,
            stock: 20,
        },
    })

    console.log('🛒 Creando órdenes...')
    await prisma.order.create({
        data: {
            vendorId: vendor1.id,
            buyerId: 'buyer_seed_001',
            status: OrderStatus.DELIVERED,
            total: 7300,
            items: {
                create: [
                    {
                        productId: product1.id,
                        productName: product1.name,
                        productPrice: product1.price,
                        quantity: 2,
                    },
                    {
                        productId: product2.id,
                        productName: product2.name,
                        productPrice: product2.price,
                        quantity: 1,
                    },
                ],
            },
        },
    })

    await prisma.order.create({
        data: {
            vendorId: vendor1.id,
            buyerId: 'buyer_seed_002',
            status: OrderStatus.READY,
            total: 5000,
            items: {
                create: [
                    {
                        productId: product1.id,
                        productName: product1.name,
                        productPrice: product1.price,
                        quantity: 2,
                    },
                ],
            },
        },
    })

    await prisma.order.create({
        data: {
            vendorId: vendor2.id,
            buyerId: 'buyer_seed_001',
            status: OrderStatus.PENDING,
            total: 3200,
            items: {
                create: [
                    {
                        productId: product3.id,
                        productName: product3.name,
                        productPrice: product3.price,
                        quantity: 1,
                    },
                ],
            },
        },
    })

    console.log('✅ Seed completado')
}

main()
    .catch((e) => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect() // desconecto de la bd al finalizar
    })