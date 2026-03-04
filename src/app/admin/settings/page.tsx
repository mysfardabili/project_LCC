'use client'

import { useEffect, useState, useRef } from 'react'
import { Settings, Upload, Save, QrCode, CreditCard, RefreshCw } from 'lucide-react'
import toast from 'react-hot-toast'
import Image from 'next/image'

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState({ bank_name: '', account_number: '', account_holder: '', qris_image_url: '' })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    fetch('/api/settings').then(r => r.json()).then(data => {
      setSettings(prev => ({ ...prev, ...data }))
    }).finally(() => setLoading(false))
  }, [])

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    try {
      const res = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bank_name: settings.bank_name,
          account_number: settings.account_number,
          account_holder: settings.account_holder,
        }),
      })
      if (!res.ok) { toast.error('Gagal menyimpan'); return }
      toast.success('Pengaturan berhasil disimpan!')
    } finally {
      setSaving(false)
    }
  }

  async function handleQrisUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    try {
      const fd = new FormData()
      fd.append('file', file)
      const res = await fetch('/api/settings/upload-qris', { method: 'POST', body: fd })
      const data = await res.json()
      if (!res.ok) { toast.error(data.error); return }
      setSettings(prev => ({ ...prev, qris_image_url: data.url }))
      toast.success('QRIS berhasil diupload!')
    } finally {
      setUploading(false)
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  if (loading) {
    return <div className="p-6 flex items-center justify-center h-64"><div className="spinner" style={{ width: '2rem', height: '2rem', borderTopColor: '#6366f1' }} /></div>
  }

  return (
    <div className="p-6 space-y-6 fade-in">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2" style={{ color: '#f1f5f9' }}>
          <Settings size={24} style={{ color: '#6366f1' }} /> Pengaturan Sistem
        </h1>
        <p className="text-sm mt-1" style={{ color: '#64748b' }}>Kelola info rekening dan QRIS untuk pembayaran transfer</p>
      </div>

      <div className="grid gap-6" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))' }}>
        {/* Bank Info */}
        <div className="stat-card">
          <div className="flex items-center gap-2 mb-5">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'rgba(99,102,241,0.15)' }}>
              <CreditCard size={16} style={{ color: '#6366f1' }} />
            </div>
            <h2 className="font-semibold" style={{ color: '#f1f5f9' }}>Informasi Rekening</h2>
          </div>
          <form onSubmit={handleSave} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: '#94a3b8' }}>Nama Bank</label>
              <input
                value={settings.bank_name}
                onChange={(e) => setSettings(p => ({ ...p, bank_name: e.target.value }))}
                className="input-field"
                placeholder="Contoh: Bank Mandiri"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: '#94a3b8' }}>Nomor Rekening</label>
              <input
                value={settings.account_number}
                onChange={(e) => setSettings(p => ({ ...p, account_number: e.target.value }))}
                className="input-field"
                placeholder="Contoh: 1234567890"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: '#94a3b8' }}>Nama Pemilik Rekening</label>
              <input
                value={settings.account_holder}
                onChange={(e) => setSettings(p => ({ ...p, account_holder: e.target.value }))}
                className="input-field"
                placeholder="Contoh: Yayasan LQ Center"
              />
            </div>
            <button type="submit" disabled={saving} className="btn-primary w-full flex items-center justify-center gap-2">
              {saving ? <div className="spinner" /> : <Save size={16} />}
              {saving ? 'Menyimpan...' : 'Simpan Informasi'}
            </button>
          </form>
        </div>

        {/* QRIS */}
        <div className="stat-card">
          <div className="flex items-center gap-2 mb-5">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'rgba(14,165,233,0.15)' }}>
              <QrCode size={16} style={{ color: '#0ea5e9' }} />
            </div>
            <h2 className="font-semibold" style={{ color: '#f1f5f9' }}>Gambar QRIS</h2>
          </div>

          <div className="space-y-4">
            {settings.qris_image_url ? (
              <div className="rounded-xl overflow-hidden border" style={{ borderColor: 'rgba(51,65,85,0.6)' }}>
                <img src={settings.qris_image_url} alt="QRIS" className="w-full" style={{ maxHeight: '260px', objectFit: 'contain', background: 'white', padding: '12px' }} />
              </div>
            ) : (
              <div className="rounded-xl border-2 border-dashed flex items-center justify-center h-48" style={{ borderColor: 'rgba(51,65,85,0.6)' }}>
                <div className="text-center" style={{ color: '#64748b' }}>
                  <QrCode size={36} className="mx-auto mb-2 opacity-40" />
                  <p className="text-sm">Belum ada gambar QRIS</p>
                </div>
              </div>
            )}

            <input ref={fileRef} type="file" accept=".jpg,.jpeg,.png,.webp" onChange={handleQrisUpload} className="hidden" />
            <button onClick={() => fileRef.current?.click()} disabled={uploading} className="btn-primary w-full flex items-center justify-center gap-2">
              {uploading ? <div className="spinner" /> : <Upload size={16} />}
              {uploading ? 'Mengupload...' : settings.qris_image_url ? 'Ganti QRIS' : 'Upload QRIS'}
            </button>
            <p className="text-xs text-center" style={{ color: '#64748b' }}>Format: JPG, PNG, WebP | Maks 3MB</p>
          </div>
        </div>
      </div>

      {/* Preview */}
      {(settings.bank_name || settings.qris_image_url) && (
        <div className="stat-card">
          <h3 className="font-semibold mb-4 flex items-center gap-2" style={{ color: '#f1f5f9' }}>
            <RefreshCw size={16} style={{ color: '#6366f1' }} /> Preview — Tampilan di Halaman Pembayaran
          </h3>
          <div className="p-4 rounded-xl" style={{ background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.2)' }}>
            <p className="text-sm font-semibold mb-3" style={{ color: '#6366f1' }}>🏦 Informasi Transfer</p>
            <div className="grid gap-3" style={{ gridTemplateColumns: '1fr 1fr' }}>
              {settings.bank_name && (
                <div>
                  <p className="text-xs" style={{ color: '#64748b' }}>Bank</p>
                  <p className="font-semibold text-sm" style={{ color: '#f1f5f9' }}>{settings.bank_name}</p>
                </div>
              )}
              {settings.account_number && (
                <div>
                  <p className="text-xs" style={{ color: '#64748b' }}>No. Rekening</p>
                  <p className="font-semibold text-sm font-mono" style={{ color: '#f1f5f9' }}>{settings.account_number}</p>
                </div>
              )}
              {settings.account_holder && (
                <div className="col-span-2">
                  <p className="text-xs" style={{ color: '#64748b' }}>Atas Nama</p>
                  <p className="font-semibold text-sm" style={{ color: '#f1f5f9' }}>{settings.account_holder}</p>
                </div>
              )}
            </div>
            {settings.qris_image_url && (
              <div className="mt-3 pt-3 border-t" style={{ borderColor: 'rgba(51,65,85,0.4)' }}>
                <p className="text-xs mb-2" style={{ color: '#64748b' }}>atau bayar via QRIS:</p>
                <img src={settings.qris_image_url} alt="QRIS" style={{ width: '120px', borderRadius: '8px', background: 'white', padding: '4px' }} />
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
