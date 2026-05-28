import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const { userId } = await auth()
  if (!userId) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  const vendor = await prisma.vendor.findUnique({ where: { userId } })
  if (!vendor) {
    return NextResponse.json({ count: 0 })
  }

  const count = await prisma.order.count({
    where: { vendorId: vendor.id, status: 'PAID', deletedAt: null },
  })

  return NextResponse.json({ count })
}
