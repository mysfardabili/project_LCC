import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

export async function POST(req: NextRequest) {
  try {
    const { name, email, password, nim, phone } = await req.json()

    if (!name || !email || !password || !phone) {
      return NextResponse.json(
        { error: 'Nama, email, password, dan No. WA wajib diisi' },
        { status: 400 }
      )
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: 'Password minimal 6 karakter' },
        { status: 400 }
      )
    }

    const existingUser = await prisma.user.findUnique({ where: { email } })
    if (existingUser) {
      return NextResponse.json(
        { error: 'Email sudah terdaftar' },
        { status: 409 }
      )
    }

    if (nim) {
      const existingNim = await prisma.user.findUnique({ where: { nim } })
      if (existingNim) {
        return NextResponse.json(
          { error: 'NIM sudah terdaftar' },
          { status: 409 }
        )
      }
    }

    const hashedPassword = await bcrypt.hash(password, 12)

    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        nim: nim || null,
        phone: phone || null,
        role: 'SANTRI',
      },
      select: {
        id: true,
        name: true,
        email: true,
        nim: true,
        role: true,
        createdAt: true,
      },
    })

    return NextResponse.json({ user, message: 'Registrasi berhasil' }, { status: 201 })
  } catch (error) {
    console.error('Register error:', error)
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 })
  }
}
