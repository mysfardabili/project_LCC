import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

// GET - user detail + all orders (Admin only)
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth()
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Akses ditolak' }, { status: 403 })
    }

    const { id } = await params

    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        email: true,
        nim: true,
        phone: true,
        role: true,
        createdAt: true,
        orders: {
          orderBy: { createdAt: 'desc' },
          include: {
            items: {
              include: { product: { select: { name: true, type: true } } },
            },
            payment: true,
          },
        },
      },
    })

    if (!user) {
      return NextResponse.json({ error: 'User tidak ditemukan' }, { status: 404 })
    }

    return NextResponse.json(user)
  } catch {
    return NextResponse.json({ error: 'Gagal mengambil data' }, { status: 500 })
  }
}

// POST - Admin reset password santri
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth()
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Akses ditolak' }, { status: 403 })
    }

    const { id } = await params
    const { newPassword } = await req.json()

    if (!newPassword || newPassword.length < 6) {
      return NextResponse.json({ error: 'Password minimal 6 karakter' }, { status: 400 })
    }

    const hashed = await bcrypt.hash(newPassword, 12)
    await prisma.user.update({ where: { id }, data: { password: hashed } })

    return NextResponse.json({ message: 'Password berhasil direset' })
  } catch {
    return NextResponse.json({ error: 'Gagal reset password' }, { status: 500 })
  }
}

// DELETE - Admin hapus akun santri
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth()
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Akses ditolak' }, { status: 403 })
    }

    const { id } = await params

    if (id === session.user.id) {
      return NextResponse.json({ error: 'Tidak dapat menghapus akun sendiri' }, { status: 400 })
    }

    const user = await prisma.user.findUnique({ where: { id } })
    if (!user) return NextResponse.json({ error: 'User tidak ditemukan' }, { status: 404 })
    if (user.role === 'ADMIN') {
      return NextResponse.json({ error: 'Tidak dapat menghapus admin lain' }, { status: 400 })
    }

    await prisma.user.delete({ where: { id } })
    return NextResponse.json({ message: 'Akun santri berhasil dihapus' })
  } catch {
    return NextResponse.json({ error: 'Gagal menghapus akun' }, { status: 500 })
  }
}
