import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET all products
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const type = searchParams.get('type')
    const isActive = searchParams.get('isActive')
    const search = searchParams.get('search')

    const where: any = {}
    if (type) where.type = type
    if (isActive !== null) where.isActive = isActive === 'true'
    if (search) where.name = { contains: search }

    const products = await prisma.product.findMany({
      where,
      include: {
        packageDetails: {
          include: { product: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json(products)
  } catch (error) {
    console.error('GET products error:', error)
    return NextResponse.json({ error: 'Gagal mengambil data produk' }, { status: 500 })
  }
}

// POST create product (Admin only)
export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Akses ditolak' }, { status: 403 })
    }

    const { name, type, price, description, isActive, stock } = await req.json()

    if (!name || !type || !price) {
      return NextResponse.json({ error: 'Nama, tipe, dan harga wajib diisi' }, { status: 400 })
    }

    const validTypes = ['KITAB', 'PAKET', 'ALAT_TULIS', 'LAYANAN']
    if (!validTypes.includes(type)) {
      return NextResponse.json({ error: 'Tipe produk tidak valid' }, { status: 400 })
    }

    const product = await prisma.product.create({
      data: {
        name,
        type,
        price: parseFloat(price),
        description: description || null,
        isActive: isActive !== undefined ? isActive : true,
        stock: stock ? parseInt(stock) : null,
      },
    })

    return NextResponse.json(product, { status: 201 })
  } catch (error) {
    console.error('POST product error:', error)
    return NextResponse.json({ error: 'Gagal membuat produk' }, { status: 500 })
  }
}
