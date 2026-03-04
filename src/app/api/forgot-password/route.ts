import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { sendResetPasswordEmail } from '@/lib/email'
import crypto from 'crypto'

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json()

    if (!email) {
      return NextResponse.json({ error: 'Email wajib diisi' }, { status: 400 })
    }

    const user = await prisma.user.findUnique({ where: { email } })

    // Always return success (don't reveal if email exists or not)
    if (!user) {
      return NextResponse.json({ message: 'Jika email terdaftar, link reset akan dikirim.' })
    }

    // Delete existing tokens for this user
    await prisma.passwordResetToken.deleteMany({ where: { userId: user.id } })

    // Generate token
    const token = crypto.randomBytes(32).toString('hex')
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000) // 1 hour

    await prisma.passwordResetToken.create({
      data: { userId: user.id, token, expiresAt },
    })

    const resetLink = `${process.env.NEXTAUTH_URL}/reset-password?token=${token}`

    await sendResetPasswordEmail(user.email, user.name, resetLink)

    return NextResponse.json({ message: 'Jika email terdaftar, link reset akan dikirim.' })
  } catch (error) {
    console.error('Forgot password error:', error)
    return NextResponse.json({ error: 'Terjadi kesalahan. Coba lagi nanti.' }, { status: 500 })
  }
}
