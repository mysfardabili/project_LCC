'use client'

import { useState, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { Lock, Eye, EyeOff, CheckCircle } from 'lucide-react'
import toast from 'react-hot-toast'

function ResetForm() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const token = searchParams.get('token')

  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)

  if (!token) {
    return (
      <div className="text-center py-8">
        <p style={{ color: '#ef4444' }}>Link tidak valid. Silakan minta link reset baru.</p>
      </div>
    )
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (password !== confirm) {
      toast.error('Konfirmasi password tidak cocok')
      return
    }
    setLoading(true)
    try {
      const res = await fetch('/api/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      })
      const data = await res.json()
      if (!res.ok) {
        toast.error(data.error)
        return
      }
      setDone(true)
      setTimeout(() => router.push('/login'), 3000)
    } finally {
      setLoading(false)
    }
  }

  if (done) {
    return (
      <div className="text-center py-4">
        <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4" style={{ background: 'rgba(16, 185, 129, 0.15)' }}>
          <CheckCircle size={28} style={{ color: '#10b981' }} />
        </div>
        <h2 className="text-lg font-semibold mb-2" style={{ color: '#f1f5f9' }}>Password Berhasil Diubah!</h2>
        <p className="text-sm" style={{ color: '#64748b' }}>Anda akan diarahkan ke halaman login...</p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-2" style={{ color: '#94a3b8' }}>Password Baru</label>
        <div className="relative">
          <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: '#64748b' }} />
          <input
            type={showPw ? 'text' : 'password'}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="input-field pl-10 pr-10"
            placeholder="Minimal 6 karakter"
            minLength={6}
            required
          />
          <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3 top-1/2 -translate-y-1/2" style={{ color: '#64748b' }}>
            {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium mb-2" style={{ color: '#94a3b8' }}>Konfirmasi Password</label>
        <div className="relative">
          <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: '#64748b' }} />
          <input
            type={showPw ? 'text' : 'password'}
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            className="input-field pl-10"
            placeholder="Ulangi password baru"
            required
          />
        </div>
      </div>
      <button type="submit" disabled={loading} className="btn-primary w-full flex items-center justify-center gap-2">
        {loading ? <div className="spinner" /> : <Lock size={16} />}
        {loading ? 'Menyimpan...' : 'Simpan Password Baru'}
      </button>
    </form>
  )
}

export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: 'var(--bg-primary)' }}>
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-4" style={{ background: 'linear-gradient(135deg, #6366f1, #0ea5e9)' }}>
            <Lock size={32} color="white" />
          </div>
          <h1 className="text-2xl font-bold" style={{ color: '#f1f5f9' }}>Reset Password</h1>
          <p className="text-sm mt-1" style={{ color: '#64748b' }}>Buat password baru untuk akun Anda</p>
        </div>
        <div className="stat-card">
          <Suspense fallback={<div className="spinner mx-auto" />}>
            <ResetForm />
          </Suspense>
        </div>
      </div>
    </div>
  )
}
