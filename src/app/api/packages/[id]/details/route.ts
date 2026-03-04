import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET package details
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const details = await prisma.packageDetail.findMany({
      where: { packageId: id },
      include: { product: true },
    })
    return NextResponse.json(details)
  } catch (error) {
    return NextResponse.json({ error: 'Gagal mengambil data paket' }, { status: 500 })
  }
}

// POST add item to package (Admin only)
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Akses ditolak' }, { status: 403 })
    }

    const { id } = await params
    const { productId, quantity } = await req.json()

    if (!productId || !quantity) {
      return NextResponse.json({ error: 'productId dan quantity wajib diisi' }, { status: 400 })
    }

    // Ensure package exists and is type PAKET
    const pkg = await prisma.product.findUnique({ where: { id } })
    if (!pkg || pkg.type !== 'PAKET') {
      return NextResponse.json({ error: 'Paket tidak ditemukan' }, { status: 404 })
    }

    const detail = await prisma.packageDetail.create({
      data: {
        packageId: id,
        productId,
        quantity: parseInt(quantity),
      },
      include: { product: true },
    })

    return NextResponse.json(detail, { status: 201 })
  } catch (error: any) {
    if (error.code === 'P2002') {
      return NextResponse.json({ error: 'Produk sudah ada di paket ini' }, { status: 409 })
    }
    return NextResponse.json({ error: 'Gagal menambah item paket' }, { status: 500 })
  }
}

// DELETE remove item from package (Admin only)
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
    const { searchParams } = new URL(req.url)
    const detailId = searchParams.get('detailId')

    if (!detailId) {
      return NextResponse.json({ error: 'detailId diperlukan' }, { status: 400 })
    }

    await prisma.packageDetail.delete({ where: { id: detailId } })
    return NextResponse.json({ message: 'Item berhasil dihapus dari paket' })
  } catch (error) {
    return NextResponse.json({ error: 'Gagal menghapus item paket' }, { status: 500 })
  }
}
