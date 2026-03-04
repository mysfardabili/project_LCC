import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET single product
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const product = await prisma.product.findUnique({
      where: { id },
      include: {
        packageDetails: {
          include: { product: true },
        },
      },
    })

    if (!product) {
      return NextResponse.json({ error: 'Produk tidak ditemukan' }, { status: 404 })
    }

    return NextResponse.json(product)
  } catch (error) {
    return NextResponse.json({ error: 'Gagal mengambil produk' }, { status: 500 })
  }
}

// PUT update product (Admin only)
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Akses ditolak' }, { status: 403 })
    }

    const { id } = await params
    const { name, type, price, description, isActive, stock } = await req.json()

    const existing = await prisma.product.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: 'Produk tidak ditemukan' }, { status: 404 })
    }

    const product = await prisma.product.update({
      where: { id },
      data: {
        name: name ?? existing.name,
        type: type ?? existing.type,
        price: price ? parseFloat(price) : existing.price,
        description: description !== undefined ? description : existing.description,
        isActive: isActive !== undefined ? isActive : existing.isActive,
        stock: stock !== undefined ? (stock ? parseInt(stock) : null) : existing.stock,
      },
    })

    return NextResponse.json(product)
  } catch (error) {
    return NextResponse.json({ error: 'Gagal memperbarui produk' }, { status: 500 })
  }
}

// DELETE product (Admin only)
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Akses ditolak' }, { status: 403 })
    }

    const { id } = await params

    const existing = await prisma.product.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: 'Produk tidak ditemukan' }, { status: 404 })
    }

    await prisma.product.delete({ where: { id } })

    return NextResponse.json({ message: 'Produk berhasil dihapus' })
  } catch (error) {
    return NextResponse.json({ error: 'Gagal menghapus produk' }, { status: 500 })
  }
}
