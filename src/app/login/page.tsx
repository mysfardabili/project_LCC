'use client'

import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { LogIn, Eye, EyeOff } from 'lucide-react'
import toast from 'react-hot-toast'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    if (!email || !password) {
      toast.error('Email dan password wajib diisi')
      return
    }

    setLoading(true)
    try {
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      })

      if (result?.error) {
        toast.error(result.error || 'Login gagal')
      } else {
        toast.success('Login berhasil!')
        router.push('/')
        router.refresh()
      }
    } catch {
      toast.error('Terjadi kesalahan')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden" style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #0f172a 100%)' }}>
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full opacity-10 blur-3xl" style={{ background: 'radial-gradient(circle, #6366f1, transparent)' }}></div>
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 rounded-full opacity-10 blur-3xl" style={{ background: 'radial-gradient(circle, #0ea5e9, transparent)' }}></div>
      </div>

      <div className="w-full max-w-md fade-in">
        {/* Logo & Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl mb-4 overflow-hidden" style={{ background: 'linear-gradient(135deg, #6366f1, #4f46e5)' }}>
            <img src="/logo.png" alt="LQ Center" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          </div>
          <h1 className="text-3xl font-bold gradient-text">LCC</h1>
          <p className="text-sm mt-1" style={{ color: '#64748b' }}>Luqmaniyyah Copy Center</p>
        </div>

        {/* Card */}
        <div className="glass-card p-8">
          <h2 className="text-xl font-semibold mb-6" style={{ color: '#f1f5f9' }}>Masuk ke Akun Anda</h2>

          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: '#94a3b8' }}>Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input-field"
                placeholder="Masukkan email"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: '#94a3b8' }}>Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input-field pr-12"
                  placeholder="Masukkan password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2"
                  style={{ color: '#64748b' }}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="btn-primary w-full flex items-center justify-center gap-2"
              disabled={loading}
            >
              {loading ? <div className="spinner" /> : <LogIn size={18} />}
              {loading ? 'Memproses...' : 'Masuk'}
            </button>
          </form>

          <div className="text-center mt-4">
            <Link href="/forgot-password" className="text-sm" style={{ color: '#6366f1' }}>
              Lupa sandi?
            </Link>
          </div>

          <div className="text-center mt-3" style={{ color: '#64748b' }}>
            <span className="text-sm">Belum punya akun? </span>
            <Link href="/register" className="text-sm font-semibold" style={{ color: '#6366f1' }}>
              Daftar sekarang
            </Link>
          </div>
        </div>

        {/* Demo credentials */}
        {/*
        <div className="mt-4 p-4 rounded-xl text-xs" style={{ background: 'rgba(99, 102, 241, 0.1)', border: '1px solid rgba(99, 102, 241, 0.2)' }}>
          <p className="font-semibold mb-2" style={{ color: '#6366f1' }}>Akun Demo:</p>
          <div className="space-y-1" style={{ color: '#94a3b8' }}>
            <p>Admin: <span style={{ color: '#f1f5f9' }}>admin@lqcenter.com</span> / <span style={{ color: '#f1f5f9' }}>admin123</span></p>
            <p>Santri: <span style={{ color: '#f1f5f9' }}>santri@lqcenter.com</span> / <span style={{ color: '#f1f5f9' }}>santri123</span></p>
          </div>
        </div>*/}
      </div>
    </div>
  )
}
