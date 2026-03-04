'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { UserPlus } from 'lucide-react'
import toast from 'react-hot-toast'

export default function RegisterPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    name: '',
    email: '',
    nim: '',
    phone: '',
    password: '',
    confirmPassword: '',
  })

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (form.password !== form.confirmPassword) {
      toast.error('Password tidak cocok')
      return
    }
    if (form.password.length < 6) {
      toast.error('Password minimal 6 karakter')
      return
    }

    setLoading(true)
    try {
      const res = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name,
          email: form.email,
          password: form.password,
          nim: form.nim || undefined,
          phone: form.phone,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        toast.error(data.error || 'Registrasi gagal')
      } else {
        toast.success('Registrasi berhasil! Silakan login.')
        router.push('/login')
      }
    } catch {
      toast.error('Terjadi kesalahan')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden" style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #0f172a 100%)' }}>
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 right-1/4 w-96 h-96 rounded-full opacity-10 blur-3xl" style={{ background: 'radial-gradient(circle, #6366f1, transparent)' }}></div>
        <div className="absolute bottom-1/4 left-1/4 w-80 h-80 rounded-full opacity-10 blur-3xl" style={{ background: 'radial-gradient(circle, #0ea5e9, transparent)' }}></div>
      </div>

      <div className="w-full max-w-md fade-in">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl mb-4 overflow-hidden" style={{ background: 'linear-gradient(135deg, #6366f1, #4f46e5)' }}>
            <img src="/logo.png" alt="LQ Center" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          </div>
          <h1 className="text-3xl font-bold gradient-text">LCC</h1>
          <p className="text-sm mt-1" style={{ color: '#64748b' }}>Luqmaniyyah Copy Center</p>
        </div>

        <div className="glass-card p-8">
          <h2 className="text-xl font-semibold mb-6" style={{ color: '#f1f5f9' }}>Buat Akun</h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: '#94a3b8' }}>Nama Lengkap *</label>
              <input name="name" value={form.name} onChange={handleChange} className="input-field" placeholder="Nama lengkap" required />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: '#94a3b8' }}>Email *</label>
              <input name="email" type="email" value={form.email} onChange={handleChange} className="input-field" placeholder="Email aktif" required />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: '#94a3b8' }}>NIM (opsional)</label>
                <input name="nim" value={form.nim} onChange={handleChange} className="input-field" placeholder="NIM santri" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: '#94a3b8' }}>No. WA *</label>
                <input name="phone" value={form.phone} onChange={handleChange} className="input-field" placeholder="08xxxxxxxxxx" required />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: '#94a3b8' }}>Password *</label>
              <input name="password" type="password" value={form.password} onChange={handleChange} className="input-field" placeholder="Min. 6 karakter" required />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: '#94a3b8' }}>Konfirmasi Password *</label>
              <input name="confirmPassword" type="password" value={form.confirmPassword} onChange={handleChange} className="input-field" placeholder="Ulangi password" required />
            </div>

            <button type="submit" className="btn-primary w-full flex items-center justify-center gap-2 mt-2" disabled={loading}>
              {loading ? <div className="spinner" /> : <UserPlus size={18} />}
              {loading ? 'Mendaftarkan...' : 'Daftar Sekarang'}
            </button>
          </form>

          <div className="text-center mt-6" style={{ color: '#64748b' }}>
            <span className="text-sm">Sudah punya akun? </span>
            <Link href="/login" className="text-sm font-semibold" style={{ color: '#6366f1' }}>Masuk di sini</Link>
          </div>
        </div>
      </div>
    </div>
  )
}
