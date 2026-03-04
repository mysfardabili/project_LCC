import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET all settings (public - for payment info display)
export async function GET() {
  try {
    const settings = await prisma.settings.findMany()
    const map: Record<string, string> = {}
    settings.forEach((s) => { map[s.key] = s.value })
    return NextResponse.json(map)
  } catch (error) {
    return NextResponse.json({ error: 'Gagal mengambil pengaturan' }, { status: 500 })
  }
}

// PUT update settings (Admin only)
export async function PUT(req: NextRequest) {
  try {
    const session = await auth()
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Akses ditolak' }, { status: 403 })
    }

    const data = await req.json()
    // data = { bank_name, account_number, account_holder, qris_image_url }

    const updates = Object.entries(data).map(([key, value]) =>
      prisma.settings.upsert({
        where: { key },
        update: { value: value as string },
        create: { key, value: value as string },
      })
    )

    await Promise.all(updates)

    const all = await prisma.settings.findMany()
    const map: Record<string, string> = {}
    all.forEach((s) => { map[s.key] = s.value })

    return NextResponse.json(map)
  } catch (error) {
    return NextResponse.json({ error: 'Gagal menyimpan pengaturan' }, { status: 500 })
  }
}
