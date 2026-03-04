import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import * as XLSX from 'xlsx'

export async function GET(req: NextRequest) {
  try {
    const session = await auth()
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Akses ditolak' }, { status: 403 })
    }

    const { searchParams } = new URL(req.url)
    const filter = searchParams.get('filter') || 'monthly'

    const now = new Date()
    let startDate: Date
    switch (filter) {
      case 'daily': startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate()); break
      case 'weekly':
        startDate = new Date(now)
        startDate.setDate(now.getDate() - now.getDay())
        startDate.setHours(0, 0, 0, 0)
        break
      case 'yearly': startDate = new Date(now.getFullYear(), 0, 1); break
      default: startDate = new Date(now.getFullYear(), now.getMonth(), 1)
    }

    const orders = await prisma.order.findMany({
      where: { createdAt: { gte: startDate } },
      include: {
        user: { select: { name: true, nim: true, email: true, phone: true } },
        items: { include: { product: { select: { name: true, type: true } } } },
      },
      orderBy: { createdAt: 'desc' },
    })

    const rows = orders.flatMap(order =>
      order.items.map(item => ({
        'No. Order': order.orderNumber,
        'Nama Santri': order.user.name,
        'NIM': order.user.nim || '',
        'Email': order.user.email,
        'No. WA': order.user.phone || '',
        'Produk': item.product.name,
        'Tipe': item.product.type,
        'Qty': item.quantity,
        'Harga Satuan': parseFloat(item.price.toString()),
        'Subtotal': parseFloat(item.price.toString()) * item.quantity,
        'Total Order': parseFloat(order.totalPrice.toString()),
        'Metode': order.paymentMethod,
        'Status Order': order.orderStatus,
        'Status Bayar': order.paymentStatus,
        'Tanggal': new Date(order.createdAt).toLocaleDateString('id-ID'),
      }))
    )

    const wb = XLSX.utils.book_new()
    const ws = XLSX.utils.json_to_sheet(rows)

    // Column widths
    ws['!cols'] = [
      { wch: 22 }, { wch: 20 }, { wch: 12 }, { wch: 25 }, { wch: 15 },
      { wch: 25 }, { wch: 12 }, { wch: 6 }, { wch: 14 }, { wch: 14 },
      { wch: 14 }, { wch: 10 }, { wch: 12 }, { wch: 20 }, { wch: 14 },
    ]

    XLSX.utils.book_append_sheet(wb, ws, 'Laporan Transaksi')
    const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' })

    const fileName = `laporan-simlqc-${filter}-${new Date().toISOString().split('T')[0]}.xlsx`

    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${fileName}"`,
      },
    })
  } catch (error) {
    console.error('Export error:', error)
    return NextResponse.json({ error: 'Gagal export data' }, { status: 500 })
  }
}
