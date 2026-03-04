import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// PUT verify/reject payment (Admin only)
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ orderId: string }> }
) {
  try {
    const session = await auth()
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Akses ditolak' }, { status: 403 })
    }

    const { orderId } = await params
    const { action, notes } = await req.json() // action: 'verify' | 'reject'

    if (!action || !['verify', 'reject'].includes(action)) {
      return NextResponse.json({ error: 'action harus verify atau reject' }, { status: 400 })
    }

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { payment: true },
    })

    if (!order) {
      return NextResponse.json({ error: 'Order tidak ditemukan' }, { status: 404 })
    }

    if (!order.payment) {
      return NextResponse.json({ error: 'Belum ada bukti pembayaran' }, { status: 400 })
    }

    const newPaymentStatus = action === 'verify' ? 'LUNAS' : 'DITOLAK'
    const newOrderStatus = action === 'verify' ? 'SELESAI' : 'PENDING'

    // Update payment proof
    await prisma.paymentProof.update({
      where: { orderId },
      data: {
        status: newPaymentStatus as any,
        verifiedAt: new Date(),
        verifiedBy: session.user.id,
        notes: notes || null,
      },
    })

    // Update order
    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: {
        paymentStatus: newPaymentStatus as any,
        orderStatus: newOrderStatus as any,
      },
      include: {
        user: { select: { id: true, name: true, nim: true } },
        items: { include: { product: true } },
        payment: true,
      },
    })

    return NextResponse.json(updatedOrder)
  } catch (error) {
    console.error('Verify payment error:', error)
    return NextResponse.json({ error: 'Gagal memverifikasi pembayaran' }, { status: 500 })
  }
}
