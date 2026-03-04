import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  try {
    const session = await auth()
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Akses ditolak' }, { status: 403 })
    }

    const { searchParams } = new URL(req.url)
    const filter = searchParams.get('filter') || 'monthly' // daily | weekly | monthly | yearly

    const now = new Date()
    let startDate: Date

    switch (filter) {
      case 'daily':
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate())
        break
      case 'weekly':
        const dayOfWeek = now.getDay()
        startDate = new Date(now)
        startDate.setDate(now.getDate() - dayOfWeek)
        startDate.setHours(0, 0, 0, 0)
        break
      case 'yearly':
        startDate = new Date(now.getFullYear(), 0, 1)
        break
      case 'monthly':
      default:
        startDate = new Date(now.getFullYear(), now.getMonth(), 1)
        break
    }

    // Total revenue (LUNAS orders)
    const totalRevenue = await prisma.order.aggregate({
      _sum: { totalPrice: true },
      _count: { id: true },
      where: {
        paymentStatus: 'LUNAS',
        createdAt: { gte: startDate },
      },
    })

    // All-time total
    const allTimeRevenue = await prisma.order.aggregate({
      _sum: { totalPrice: true },
      _count: { id: true },
      where: { paymentStatus: 'LUNAS' },
    })

    // Pending orders count
    const pendingOrders = await prisma.order.count({
      where: { orderStatus: 'PENDING' },
    })

    // Waiting verification count
    const waitingVerification = await prisma.order.count({
      where: { paymentStatus: 'MENUNGGU_VERIFIKASI' },
    })

    // Total active products
    const totalProducts = await prisma.product.count({ where: { isActive: true } })

    // Total users
    const totalUsers = await prisma.user.count({ where: { role: 'SANTRI' } })

    // Recent transactions
    const recentTransactions = await prisma.order.findMany({
      where: { createdAt: { gte: startDate } },
      include: {
        user: { select: { name: true, nim: true } },
        items: { include: { product: { select: { name: true } } } },
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    })

    // Revenue by day (for chart - last 30 days)
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    const chartOrders = await prisma.order.findMany({
      where: {
        paymentStatus: 'LUNAS',
        createdAt: { gte: thirtyDaysAgo },
      },
      select: { totalPrice: true, createdAt: true },
    })

    // Group by date
    const revenueByDay: Record<string, number> = {}
    chartOrders.forEach((order) => {
      const dateKey = order.createdAt.toISOString().split('T')[0]
      revenueByDay[dateKey] = (revenueByDay[dateKey] || 0) + parseFloat(order.totalPrice.toString())
    })

    const chartData = Object.entries(revenueByDay)
      .map(([date, revenue]) => ({ date, revenue }))
      .sort((a, b) => a.date.localeCompare(b.date))

    // Payment method breakdown
    const paymentMethodStats = await prisma.order.groupBy({
      by: ['paymentMethod'],
      _count: { id: true },
      _sum: { totalPrice: true },
      where: {
        paymentStatus: 'LUNAS',
        createdAt: { gte: startDate },
      },
    })

    return NextResponse.json({
      filter,
      startDate,
      periodRevenue: {
        total: parseFloat(totalRevenue._sum.totalPrice?.toString() || '0'),
        count: totalRevenue._count.id,
      },
      allTime: {
        total: parseFloat(allTimeRevenue._sum.totalPrice?.toString() || '0'),
        count: allTimeRevenue._count.id,
      },
      pendingOrders,
      waitingVerification,
      totalProducts,
      totalUsers,
      recentTransactions,
      chartData,
      paymentMethodStats: paymentMethodStats.map((s) => ({
        method: s.paymentMethod,
        count: s._count.id,
        total: parseFloat(s._sum.totalPrice?.toString() || '0'),
      })),
    })
  } catch (error) {
    console.error('Dashboard stats error:', error)
    return NextResponse.json({ error: 'Gagal mengambil data dashboard' }, { status: 500 })
  }
}
