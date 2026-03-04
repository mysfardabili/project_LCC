import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'
import { v4 as uuidv4 } from 'uuid'

// POST upload QRIS image (Admin only)
export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Akses ditolak' }, { status: 403 })
    }

    const formData = await req.formData()
    const file = formData.get('file') as File

    if (!file) {
      return NextResponse.json({ error: 'File QRIS diperlukan' }, { status: 400 })
    }

    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp']
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ error: 'Format harus JPG, PNG, atau WebP' }, { status: 400 })
    }

    if (file.size > 3 * 1024 * 1024) {
      return NextResponse.json({ error: 'Ukuran file maksimal 3MB' }, { status: 400 })
    }

    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    const uploadDir = join(process.cwd(), 'public', 'uploads', 'qris')
    await mkdir(uploadDir, { recursive: true })

    const ext = file.name.split('.').pop()
    const fileName = `qris-${uuidv4()}.${ext}`
    await writeFile(join(uploadDir, fileName), buffer)

    const fileUrl = `/uploads/qris/${fileName}`

    // Save to settings
    await prisma.settings.upsert({
      where: { key: 'qris_image_url' },
      update: { value: fileUrl },
      create: { key: 'qris_image_url', value: fileUrl },
    })

    return NextResponse.json({ url: fileUrl })
  } catch (error) {
    console.error('QRIS upload error:', error)
    return NextResponse.json({ error: 'Gagal upload QRIS' }, { status: 500 })
  }
}
