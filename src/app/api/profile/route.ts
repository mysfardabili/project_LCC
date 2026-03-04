import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

// GET profile
export async function GET() {
  try {
    const session = await auth()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { id: true, name: true, email: true, nim: true, phone: true, role: true, createdAt: true },
    })

    return NextResponse.json(user)
  } catch {
    return NextResponse.json({ error: 'Gagal mengambil profil' }, { status: 500 })
  }
}

// PUT update profile
export async function PUT(req: NextRequest) {
  try {
    const session = await auth()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { name, phone } = await req.json()

    if (!name?.trim()) {
      return NextResponse.json({ error: 'Nama tidak boleh kosong' }, { status: 400 })
    }

    const updated = await prisma.user.update({
      where: { id: session.user.id },
      data: { name: name.trim(), phone: phone?.trim() || null },
      select: { id: true, name: true, email: true, nim: true, phone: true },
    })

    return NextResponse.json(updated)
  } catch {
    return NextResponse.json({ error: 'Gagal update profil' }, { status: 500 })
  }
}

// PATCH change password
export async function PATCH(req: NextRequest) {
  try {
    const session = await auth()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { oldPassword, newPassword } = await req.json()

    if (!oldPassword || !newPassword) {
      return NextResponse.json({ error: 'Password lama dan baru harus diisi' }, { status: 400 })
    }

    if (newPassword.length < 6) {
      return NextResponse.json({ error: 'Password baru minimal 6 karakter' }, { status: 400 })
    }

    const user = await prisma.user.findUnique({ where: { id: session.user.id } })
    if (!user) return NextResponse.json({ error: 'User tidak ditemukan' }, { status: 404 })

    const valid = await bcrypt.compare(oldPassword, user.password)
    if (!valid) {
      return NextResponse.json({ error: 'Password lama tidak sesuai' }, { status: 400 })
    }

    const hashed = await bcrypt.hash(newPassword, 12)
    await prisma.user.update({ where: { id: session.user.id }, data: { password: hashed } })

    return NextResponse.json({ message: 'Password berhasil diubah' })
  } catch {
    return NextResponse.json({ error: 'Gagal mengubah password' }, { status: 500 })
  }
}
