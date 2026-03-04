'use client'

import { useState } from 'react'
import { Mail, ArrowLeft, Send } from 'lucide-react'
import Link from 'next/link'
import toast from 'react-hot-toast'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await fetch('/api/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      const data = await res.json()
      if (!res.ok) {
        toast.error(data.error)
        return
      }
      setSent(true)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: 'var(--bg-primary)' }}>
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-4" style={{ background: 'linear-gradient(135deg, #6366f1, #0ea5e9)' }}>
            <Mail size={32} color="white" />
          </div>
          <h1 className="text-2xl font-bold" style={{ color: '#f1f5f9' }}>Lupa Password?</h1>
          <p className="text-sm mt-1" style={{ color: '#64748b' }}>SIM-LQC — Portal Pesantren</p>
        </div>

        <div className="stat-card">
          {sent ? (
            <div className="text-center py-4">
              <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4" style={{ background: 'rgba(16, 185, 129, 0.15)' }}>
                <Send size={28} style={{ color: '#10b981' }} />
              </div>
              <h2 className="text-lg font-semibold mb-2" style={{ color: '#f1f5f9' }}>Email Terkirim!</h2>
              <p className="text-sm mb-6" style={{ color: '#64748b' }}>
                Jika email <strong style={{ color: '#f1f5f9' }}>{email}</strong> terdaftar di sistem, link reset password akan dikirim dalam beberapa menit.
              </p>
              <p className="text-xs mb-6" style={{ color: '#64748b' }}>
                Cek folder <strong>Spam/Junk</strong> jika tidak ada di Inbox. Link berlaku selama <strong style={{ color: '#f59e0b' }}>1 jam</strong>.
              </p>
              <Link href="/login" className="btn-primary inline-flex items-center gap-2">
                <ArrowLeft size={16} /> Kembali ke Login
              </Link>
            </div>
          ) : (
            <>
              <p className="text-sm mb-6" style={{ color: '#94a3b8' }}>
                Masukkan email yang terdaftar. Kami akan mengirimkan link untuk mereset password Anda.
              </p>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: '#94a3b8' }}>Alamat Email</label>
                  <div className="relative">
                    <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: '#64748b' }} />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="input-field pl-10"
                      placeholder="email@contoh.com"
                      required
                    />
                  </div>
                </div>
                <button type="submit" disabled={loading} className="btn-primary w-full flex items-center justify-center gap-2">
                  {loading ? <div className="spinner" /> : <Send size={16} />}
                  {loading ? 'Mengirim...' : 'Kirim Link Reset'}
                </button>
              </form>
              <div className="mt-4 text-center">
                <Link href="/login" className="text-sm flex items-center justify-center gap-1" style={{ color: '#64748b' }}>
                  <ArrowLeft size={14} /> Kembali ke Login
                </Link>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
