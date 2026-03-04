import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'
import { v4 as uuidv4 } from 'uuid'

// POST upload payment proof
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ orderId: string }> }
) {
  try {
    const session = await auth()
    if (!session) return NextResponse.json({ error: 'Tidak terautentikasi' }, { status: 401 })

    const { orderId } = await params

    // Verify order belongs to user (or admin)
    const order = await prisma.order.findUnique({ where: { id: orderId } })
    if (!order) return NextResponse.json({ error: 'Order tidak ditemukan' }, { status: 404 })

    if (session.user.role === 'SANTRI' && order.userId !== session.user.id) {
      return NextResponse.json({ error: 'Akses ditolak' }, { status: 403 })
    }

    if (order.paymentMethod !== 'TRANSFER') {
      return NextResponse.json({ error: 'Order ini bukan metode transfer' }, { status: 400 })
    }

    const formData = await req.formData()
    const file = formData.get('file') as File

    if (!file) {
      return NextResponse.json({ error: 'File bukti transfer diperlukan' }, { status: 400 })
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf']
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ error: 'Format file tidak didukung (JPG, PNG, PDF)' }, { status: 400 })
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: 'Ukuran file maksimal 5MB' }, { status: 400 })
    }

    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    // Create uploads directory if not exists
    const uploadDir = join(process.cwd(), 'public', 'uploads', 'payments')
    await mkdir(uploadDir, { recursive: true })

    const ext = file.name.split('.').pop()
    const fileName = `${uuidv4()}.${ext}`
    const filePath = join(uploadDir, fileName)

    await writeFile(filePath, buffer)

    const fileUrl = `/uploads/payments/${fileName}`

    // Upsert payment proof
    const payment = await prisma.paymentProof.upsert({
      where: { orderId },
      update: {
        fileUrl,
        fileName: file.name,
        uploadedAt: new Date(),
        verifiedAt: null,
        verifiedBy: null,
        status: 'MENUNGGU_VERIFIKASI',
      },
      create: {
        orderId,
        fileUrl,
        fileName: file.name,
        status: 'MENUNGGU_VERIFIKASI',
      },
    })

    // Update order payment status
    await prisma.order.update({
      where: { id: orderId },
      data: { paymentStatus: 'MENUNGGU_VERIFIKASI' },
    })

    return NextResponse.json(payment, { status: 201 })
  } catch (error) {
    console.error('Payment upload error:', error)
    return NextResponse.json({ error: 'Gagal mengupload bukti pembayaran' }, { status: 500 })
  }
}

// GET payment proof for an order
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ orderId: string }> }
) {
  try {
    const session = await auth()
    if (!session) return NextResponse.json({ error: 'Tidak terautentikasi' }, { status: 401 })

    const { orderId } = await params
    const payment = await prisma.paymentProof.findUnique({ where: { orderId } })

    if (!payment) return NextResponse.json(null)
    return NextResponse.json(payment)
  } catch (error) {
    return NextResponse.json({ error: 'Gagal mengambil bukti pembayaran' }, { status: 500 })
  }
}
