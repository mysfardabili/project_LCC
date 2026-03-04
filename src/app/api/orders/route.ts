import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { generateOrderNumber } from '@/lib/utils'

// GET orders
export async function GET(req: NextRequest) {
  try {
    const session = await auth()
    if (!session) {
      return NextResponse.json({ error: 'Tidak terautentikasi' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const userId = searchParams.get('userId')
    const orderStatus = searchParams.get('orderStatus')
    const paymentStatus = searchParams.get('paymentStatus')

    const where: any = {}

    // Santri can only see their own orders
    if (session.user.role === 'SANTRI') {
      where.userId = session.user.id
    } else if (userId) {
      where.userId = userId
    }

    if (orderStatus) where.orderStatus = orderStatus
    if (paymentStatus) where.paymentStatus = paymentStatus

    const orders = await prisma.order.findMany({
      where,
      include: {
        user: { select: { id: true, name: true, nim: true, email: true } },
        admin: { select: { id: true, name: true } },
        items: {
          include: { product: true },
        },
        payment: true,
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json(orders)
  } catch (error) {
    console.error('GET orders error:', error)
    return NextResponse.json({ error: 'Gagal mengambil data order' }, { status: 500 })
  }
}

// POST create order
export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    if (!session) {
      return NextResponse.json({ error: 'Tidak terautentikasi' }, { status: 401 })
    }

    const { items, paymentMethod, notes, targetUserId, isManual } = await req.json()

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: 'Minimal satu produk harus dipilih' }, { status: 400 })
    }

    // Determine userId (Admin can create for specific santri)
    let userId = session.user.id
    if (session.user.role === 'ADMIN' && targetUserId) {
      userId = targetUserId
    }

    // Validate products and calculate total
    const productIds = items.map((item: any) => item.productId)
    const products = await prisma.product.findMany({
      where: { id: { in: productIds }, isActive: true },
    })

    if (products.length !== productIds.length) {
      return NextResponse.json({ error: 'Beberapa produk tidak ditemukan atau tidak aktif' }, { status: 400 })
    }

    let totalPrice = 0
    const orderItems = items.map((item: any) => {
      const product = products.find((p) => p.id === item.productId)!
      const price = parseFloat(product.price.toString())
      totalPrice += price * item.quantity
      return {
        productId: item.productId,
        quantity: item.quantity,
        price: price,
      }
    })

    const order = await prisma.order.create({
      data: {
        userId,
        adminId: session.user.role === 'ADMIN' ? session.user.id : null,
        orderNumber: generateOrderNumber(),
        totalPrice,
        paymentMethod: paymentMethod || 'TRANSFER',
        notes: notes || null,
        // Manual orders by admin are auto-completed and paid
        orderStatus: (isManual && session.user.role === 'ADMIN') ? 'SELESAI' : 'PENDING',
        paymentStatus: (isManual && session.user.role === 'ADMIN') ? 'LUNAS' : 'BELUM_BAYAR',
        items: {
          create: orderItems,
        },
      },
      include: {
        user: { select: { id: true, name: true, nim: true } },
        items: { include: { product: true } },
        payment: true,
      },
    })

    return NextResponse.json(order, { status: 201 })
  } catch (error) {
    console.error('POST order error:', error)
    return NextResponse.json({ error: 'Gagal membuat order' }, { status: 500 })
  }
}
