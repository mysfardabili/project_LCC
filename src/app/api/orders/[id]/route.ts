import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET single order
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session) return NextResponse.json({ error: 'Tidak terautentikasi' }, { status: 401 })

    const { id } = await params
    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        user: { select: { id: true, name: true, nim: true, email: true, phone: true } },
        admin: { select: { id: true, name: true } },
        items: { include: { product: true } },
        payment: true,
      },
    })

    if (!order) return NextResponse.json({ error: 'Order tidak ditemukan' }, { status: 404 })

    // Santri can only see their own orders
    if (session.user.role === 'SANTRI' && order.userId !== session.user.id) {
      return NextResponse.json({ error: 'Akses ditolak' }, { status: 403 })
    }

    return NextResponse.json(order)
  } catch (error) {
    return NextResponse.json({ error: 'Gagal mengambil order' }, { status: 500 })
  }
}

// PUT update order status (Admin only)
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
    const { orderStatus, paymentStatus, notes } = await req.json()

    const existing = await prisma.order.findUnique({ where: { id } })
    if (!existing) return NextResponse.json({ error: 'Order tidak ditemukan' }, { status: 404 })

    const updateData: any = {}
    if (orderStatus) updateData.orderStatus = orderStatus
    if (paymentStatus) updateData.paymentStatus = paymentStatus
    if (notes !== undefined) updateData.notes = notes

    const order = await prisma.order.update({
      where: { id },
      data: updateData,
      include: {
        user: { select: { id: true, name: true, nim: true } },
        items: { include: { product: true } },
        payment: true,
      },
    })

    return NextResponse.json(order)
  } catch (error) {
    return NextResponse.json({ error: 'Gagal memperbarui order' }, { status: 500 })
  }
}
// PATCH - Santri cancel their own order (only if PENDING + BELUM_BAYAR)
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session) return NextResponse.json({ error: 'Tidak terautentikasi' }, { status: 401 })

    const { id } = await params
    const order = await prisma.order.findUnique({ where: { id } })

    if (!order) return NextResponse.json({ error: 'Order tidak ditemukan' }, { status: 404 })

    // Only owner can cancel
    if (order.userId !== session.user.id) {
      return NextResponse.json({ error: 'Bukan order Anda' }, { status: 403 })
    }

    // Only cancel if still PENDING and not yet paid
    if (order.orderStatus !== 'PENDING' || order.paymentStatus !== 'BELUM_BAYAR') {
      return NextResponse.json(
        { error: 'Order tidak dapat dibatalkan. Sudah diproses atau sudah ada pembayaran.' },
        { status: 400 }
      )
    }

    const updated = await prisma.order.update({
      where: { id },
      data: { orderStatus: 'DIBATALKAN' },
    })

    return NextResponse.json(updated)
  } catch {
    return NextResponse.json({ error: 'Gagal membatalkan order' }, { status: 500 })
  }
}
