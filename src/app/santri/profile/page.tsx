'use client'

import { useEffect, useState } from 'react'
import { UserCircle, Lock, Save, Eye, EyeOff } from 'lucide-react'
import toast from 'react-hot-toast'

export default function SantriProfilePage() {
  const [profile, setProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [changingPw, setChangingPw] = useState(false)
  const [showOld, setShowOld] = useState(false)
  const [showNew, setShowNew] = useState(false)
  const [pwForm, setPwForm] = useState({ oldPassword: '', newPassword: '', confirm: '' })

  useEffect(() => {
    fetch('/api/profile').then(r => r.json()).then(setProfile).finally(() => setLoading(false))
  }, [])

  async function handleSaveProfile(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    try {
      const res = await fetch('/api/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: profile.name, phone: profile.phone }),
      })
      const data = await res.json()
      if (!res.ok) { toast.error(data.error); return }
      setProfile(data)
      toast.success('Profil berhasil diperbarui!')
    } finally { setSaving(false) }
  }

  async function handleChangePw(e: React.FormEvent) {
    e.preventDefault()
    if (pwForm.newPassword !== pwForm.confirm) { toast.error('Konfirmasi password tidak cocok'); return }
    setChangingPw(true)
    try {
      const res = await fetch('/api/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ oldPassword: pwForm.oldPassword, newPassword: pwForm.newPassword }),
      })
      const data = await res.json()
      if (!res.ok) { toast.error(data.error); return }
      toast.success('Password berhasil diubah!')
      setPwForm({ oldPassword: '', newPassword: '', confirm: '' })
    } finally { setChangingPw(false) }
  }

  if (loading) return <div className="p-6 flex items-center justify-center h-64"><div className="spinner" style={{ width: '2rem', height: '2rem', borderTopColor: '#6366f1' }} /></div>

  return (
    <div className="p-6 space-y-6 fade-in">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2" style={{ color: '#f1f5f9' }}>
          <UserCircle size={24} style={{ color: '#6366f1' }} /> Profil Saya
        </h1>
        <p className="text-sm mt-1" style={{ color: '#64748b' }}>Kelola informasi akun dan keamanan</p>
      </div>

      <div className="grid gap-6" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))' }}>
        {/* Profile info */}
        <div className="stat-card">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl font-bold" style={{ background: 'linear-gradient(135deg, #6366f1, #4f46e5)', color: 'white' }}>
              {profile?.name?.charAt(0).toUpperCase()}
            </div>
            <div>
              <p className="font-semibold" style={{ color: '#f1f5f9' }}>{profile?.name}</p>
              <p className="text-sm" style={{ color: '#64748b' }}>{profile?.email}</p>
              {profile?.nim && <p className="text-xs" style={{ color: '#6366f1' }}>NIM: {profile?.nim}</p>}
            </div>
          </div>

          <form onSubmit={handleSaveProfile} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: '#94a3b8' }}>Nama Lengkap</label>
              <input value={profile?.name || ''} onChange={(e) => setProfile((p: any) => ({ ...p, name: e.target.value }))} className="input-field" required />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: '#94a3b8' }}>Email</label>
              <input value={profile?.email || ''} className="input-field" disabled style={{ opacity: 0.5, cursor: 'not-allowed' }} />
              <p className="text-xs mt-1" style={{ color: '#64748b' }}>Email tidak dapat diubah</p>
            </div>
            {profile?.nim && (
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: '#94a3b8' }}>NIM</label>
                <input value={profile.nim} className="input-field" disabled style={{ opacity: 0.5 }} />
              </div>
            )}
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: '#94a3b8' }}>No. WhatsApp</label>
              <input value={profile?.phone || ''} onChange={(e) => setProfile((p: any) => ({ ...p, phone: e.target.value }))} className="input-field" placeholder="08xxxxxxxxxx" />
            </div>
            <button type="submit" disabled={saving} className="btn-primary w-full flex items-center justify-center gap-2">
              {saving ? <div className="spinner" /> : <Save size={16} />}
              {saving ? 'Menyimpan...' : 'Simpan Perubahan'}
            </button>
          </form>
        </div>

        {/* Change Password */}
        <div className="stat-card">
          <div className="flex items-center gap-2 mb-5">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'rgba(99,102,241,0.15)' }}>
              <Lock size={16} style={{ color: '#6366f1' }} />
            </div>
            <h2 className="font-semibold" style={{ color: '#f1f5f9' }}>Ganti Password</h2>
          </div>

          <form onSubmit={handleChangePw} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: '#94a3b8' }}>Password Lama</label>
              <div className="relative">
                <input type={showOld ? 'text' : 'password'} value={pwForm.oldPassword} onChange={(e) => setPwForm(p => ({ ...p, oldPassword: e.target.value }))} className="input-field pr-10" placeholder="Password saat ini" required />
                <button type="button" onClick={() => setShowOld(!showOld)} className="absolute right-3 top-1/2 -translate-y-1/2" style={{ color: '#64748b' }}>{showOld ? <EyeOff size={15} /> : <Eye size={15} />}</button>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: '#94a3b8' }}>Password Baru</label>
              <div className="relative">
                <input type={showNew ? 'text' : 'password'} value={pwForm.newPassword} onChange={(e) => setPwForm(p => ({ ...p, newPassword: e.target.value }))} className="input-field pr-10" placeholder="Minimal 6 karakter" minLength={6} required />
                <button type="button" onClick={() => setShowNew(!showNew)} className="absolute right-3 top-1/2 -translate-y-1/2" style={{ color: '#64748b' }}>{showNew ? <EyeOff size={15} /> : <Eye size={15} />}</button>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: '#94a3b8' }}>Konfirmasi Password Baru</label>
              <input type={showNew ? 'text' : 'password'} value={pwForm.confirm} onChange={(e) => setPwForm(p => ({ ...p, confirm: e.target.value }))} className="input-field" placeholder="Ulangi password baru" required />
            </div>
            <button type="submit" disabled={changingPw} className="btn-primary w-full flex items-center justify-center gap-2">
              {changingPw ? <div className="spinner" /> : <Lock size={16} />}
              {changingPw ? 'Mengubah...' : 'Ubah Password'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
