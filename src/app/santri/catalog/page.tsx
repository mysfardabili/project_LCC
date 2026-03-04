'use client'

import { useEffect, useState } from 'react'
import { ShoppingCart, Plus, Minus, Trash2, Package, Search, CreditCard, QrCode, Upload, X, CheckCircle } from 'lucide-react'
import toast from 'react-hot-toast'
import { formatCurrency, getProductTypeLabel } from '@/lib/utils'

const TYPE_COLORS: Record<string, string> = { KITAB: '#6366f1', PAKET: '#0ea5e9', ALAT_TULIS: '#10b981', LAYANAN: '#f59e0b' }

export default function SantriCatalogPage() {
  const [products, setProducts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterType, setFilterType] = useState('')
  const [cart, setCart] = useState<{ product: any; quantity: number }[]>([])
  const [payMethod, setPayMethod] = useState('TRANSFER')
  const [notes, setNotes] = useState('')
  const [ordering, setOrdering] = useState(false)
  const [settings, setSettings] = useState<Record<string, string>>({})

  // Post-order TF payment modal
  const [successOrder, setSuccessOrder] = useState<any>(null)
  const [uploadFile, setUploadFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)

  useEffect(() => {
    Promise.all([
      fetch('/api/products?isActive=true').then(r => r.json()),
      fetch('/api/settings').then(r => r.json()),
    ]).then(([prods, cfg]) => {
      setProducts(prods)
      setSettings(cfg)
    }).finally(() => setLoading(false))
  }, [])

  function addToCart(product: any) {
    setCart((prev) => {
      const existing = prev.find((i) => i.product.id === product.id)
      return existing
        ? prev.map((i) => i.product.id === product.id ? { ...i, quantity: i.quantity + 1 } : i)
        : [...prev, { product, quantity: 1 }]
    })
    toast.success(`${product.name} ditambahkan`)
  }

  function updateQty(productId: string, delta: number) {
    setCart((prev) => prev.map(i => i.product.id === productId ? { ...i, quantity: Math.max(1, i.quantity + delta) } : i))
  }

  function removeItem(productId: string) {
    setCart((prev) => prev.filter(i => i.product.id !== productId))
  }

  const totalPrice = cart.reduce((sum, i) => sum + parseFloat(i.product.price) * i.quantity, 0)

  async function handleOrder() {
    if (cart.length === 0) { toast.error('Keranjang masih kosong'); return }
    setOrdering(true)
    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: cart.map(i => ({ productId: i.product.id, quantity: i.quantity })),
          paymentMethod: payMethod,
          notes,
        }),
      })
      const data = await res.json()
      if (!res.ok) { toast.error(data.error); return }
      setCart([])
      setNotes('')
      if (payMethod === 'TRANSFER') {
        // Show payment info modal immediately
        setSuccessOrder(data)
      } else {
        toast.success(`✅ Order ${data.orderNumber} berhasil! Bayar ke kasir.`)
      }
    } finally { setOrdering(false) }
  }

  async function handleUploadProof() {
    if (!uploadFile || !successOrder) { toast.error('Pilih file terlebih dahulu'); return }
    setUploading(true)
    try {
      const fd = new FormData()
      fd.append('file', uploadFile)
      const res = await fetch(`/api/payments/${successOrder.id}`, { method: 'POST', body: fd })
      const data = await res.json()
      if (!res.ok) { toast.error(data.error || 'Gagal upload'); return }
      toast.success('✅ Bukti transfer berhasil dikirim! Tunggu verifikasi admin.')
      setSuccessOrder(null)
      setUploadFile(null)
    } finally { setUploading(false) }
  }

  const filtered = products.filter(p => {
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase())
    const matchType = !filterType || p.type === filterType
    return matchSearch && matchType
  })

  const uniqueTypes = [...new Set(products.map(p => p.type))]

  return (
    <div className="p-6 space-y-6 fade-in">
      <div>
        <h1 className="text-2xl font-bold" style={{ color: '#f1f5f9' }}>Katalog Produk</h1>
        <p className="text-sm mt-1" style={{ color: '#64748b' }}>Pilih produk dan tambahkan ke keranjang belanja</p>
      </div>

      <div className="flex gap-6" style={{ alignItems: 'flex-start' }}>
        {/* Products */}
        <div className="flex-1 min-w-0 space-y-4">
          <div className="flex flex-wrap gap-3">
            <div className="relative flex-1" style={{ minWidth: '200px' }}>
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: '#64748b' }} />
              <input value={search} onChange={(e) => setSearch(e.target.value)} className="input-field pl-9" placeholder="Cari produk..." />
            </div>
            <div className="flex gap-2 flex-wrap">
              <button onClick={() => setFilterType('')} className={filterType === '' ? 'btn-primary' : 'btn-secondary'} style={{ padding: '0.4rem 1rem', fontSize: '0.85rem' }}>Semua</button>
              {uniqueTypes.map(t => (
                <button key={t} onClick={() => setFilterType(t === filterType ? '' : t)} style={{ padding: '0.4rem 1rem', fontSize: '0.85rem', borderRadius: '10px', fontWeight: 600, cursor: 'pointer', background: filterType === t ? `${TYPE_COLORS[t]}30` : 'var(--surface-2)', color: filterType === t ? TYPE_COLORS[t] : '#94a3b8', border: `1px solid ${filterType === t ? TYPE_COLORS[t] + '60' : 'var(--border)'}` }}>
                  {getProductTypeLabel(t)}
                </button>
              ))}
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center h-40"><div className="spinner" style={{ width: '2rem', height: '2rem', borderTopColor: '#6366f1' }} /></div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-16" style={{ color: '#64748b' }}>
              <Package size={48} className="mx-auto mb-3 opacity-30" />
              <p>Tidak ada produk ditemukan</p>
            </div>
          ) : (
            <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))' }}>
              {filtered.map(product => (
                <div key={product.id} className="stat-card" style={{ cursor: 'default' }}>
                  <div className="flex items-start justify-between mb-3">
                    <span className="badge text-xs" style={{ background: `${TYPE_COLORS[product.type]}20`, color: TYPE_COLORS[product.type] }}>
                      {getProductTypeLabel(product.type)}
                    </span>
                  </div>
                  <h3 className="font-semibold mb-1" style={{ color: '#f1f5f9' }}>{product.name}</h3>
                  {product.description && (
                    <p className="text-xs mb-3" style={{ color: '#64748b' }}>{product.description.slice(0, 80)}{product.description.length > 80 ? '...' : ''}</p>
                  )}
                  {product.packageDetails?.length > 0 && (
                    <div className="mb-3 p-2 rounded-lg text-xs" style={{ background: 'rgba(51,65,85,0.5)' }}>
                      <p className="font-medium mb-1" style={{ color: '#94a3b8' }}>Isi paket:</p>
                      {product.packageDetails.map((d: any) => (
                        <p key={d.id} style={{ color: '#64748b' }}>• {d.product.name} x{d.quantity}</p>
                      ))}
                    </div>
                  )}
                  <div className="flex items-center justify-between mt-auto">
                    <p className="font-bold" style={{ color: '#6366f1' }}>{formatCurrency(product.price)}</p>
                    <button onClick={() => addToCart(product)} className="btn-primary flex items-center gap-1" style={{ padding: '0.4rem 0.9rem', fontSize: '0.85rem' }}>
                      <Plus size={14} /> Tambah
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Cart */}
        <div className="stat-card" style={{ width: '320px', flexShrink: 0, position: 'sticky', top: '1.5rem' }}>
          <div className="flex items-center gap-2 mb-4">
            <ShoppingCart size={18} style={{ color: '#6366f1' }} />
            <h3 className="font-semibold" style={{ color: '#f1f5f9' }}>Keranjang</h3>
            {cart.length > 0 && <span className="badge badge-diproses ml-auto">{cart.length} item</span>}
          </div>

          {cart.length === 0 ? (
            <div className="text-center py-8" style={{ color: '#64748b' }}>
              <ShoppingCart size={36} className="mx-auto mb-2 opacity-30" />
              <p className="text-sm">Keranjang kosong</p>
              <p className="text-xs mt-1">Pilih produk dari katalog</p>
            </div>
          ) : (
            <>
              <div className="space-y-2 mb-4">
                {cart.map((item) => (
                  <div key={item.product.id} className="p-2.5 rounded-xl" style={{ background: 'rgba(51,65,85,0.5)' }}>
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm font-medium" style={{ color: '#f1f5f9' }}>{item.product.name}</p>
                      <button onClick={() => removeItem(item.product.id)} style={{ color: '#ef4444', flexShrink: 0 }}><Trash2 size={13} /></button>
                    </div>
                    <div className="flex items-center justify-between mt-1.5">
                      <p className="text-xs" style={{ color: '#6366f1' }}>{formatCurrency(parseFloat(item.product.price) * item.quantity)}</p>
                      <div className="flex items-center gap-1.5">
                        <button onClick={() => updateQty(item.product.id, -1)} className="w-6 h-6 rounded-lg flex items-center justify-center" style={{ background: 'rgba(99,102,241,0.2)', color: '#6366f1' }}><Minus size={11} /></button>
                        <span className="text-sm font-semibold w-5 text-center" style={{ color: '#f1f5f9' }}>{item.quantity}</span>
                        <button onClick={() => updateQty(item.product.id, 1)} className="w-6 h-6 rounded-lg flex items-center justify-center" style={{ background: 'rgba(99,102,241,0.2)', color: '#6366f1' }}><Plus size={11} /></button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="border-t pt-3 mb-4" style={{ borderColor: 'rgba(51,65,85,0.6)' }}>
                <div className="flex justify-between mb-1">
                  <span className="text-sm" style={{ color: '#64748b' }}>Total</span>
                  <span className="font-bold" style={{ color: '#6366f1' }}>{formatCurrency(totalPrice)}</span>
                </div>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="text-xs font-medium mb-1 block" style={{ color: '#94a3b8' }}>Metode Pembayaran</label>
                  <select value={payMethod} onChange={(e) => setPayMethod(e.target.value)} className="select-field">
                    <option value="TRANSFER">Transfer Bank / QRIS</option>
                    <option value="CASH">Cash (Langsung ke Kasir)</option>
                  </select>
                  {payMethod === 'TRANSFER' && (
                    <p className="text-xs mt-1.5 p-2 rounded-lg" style={{ color: '#f59e0b', background: 'rgba(245,158,11,0.08)' }}>
                      ⚠️ Setelah order, info rekening / QRIS akan muncul untuk langsung kirim bukti transfer.
                    </p>
                  )}
                </div>
                <div>
                  <label className="text-xs font-medium mb-1 block" style={{ color: '#94a3b8' }}>Catatan (opsional)</label>
                  <textarea value={notes} onChange={(e) => setNotes(e.target.value)} className="input-field" rows={2} placeholder="Catatan pemesanan..." />
                </div>
                <button onClick={handleOrder} className="btn-primary w-full flex items-center justify-center gap-2" disabled={ordering}>
                  {ordering ? <div className="spinner" /> : <ShoppingCart size={16} />}
                  {ordering ? 'Memproses...' : 'Buat Order'}
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* ✅ Post-Order TF Payment Modal */}
      {successOrder && (
        <div className="modal-overlay">
          <div className="modal-content fade-in" style={{ maxWidth: '480px', maxHeight: '90vh', overflowY: 'auto' }}>
            <div className="text-center mb-5">
              <CheckCircle size={48} style={{ color: '#10b981', margin: '0 auto 12px' }} />
              <h2 className="text-xl font-bold" style={{ color: '#f1f5f9' }}>Order Berhasil Dibuat!</h2>
              <p className="text-sm mt-1" style={{ color: '#64748b' }}>No. Order: <span className="font-mono font-semibold" style={{ color: '#6366f1' }}>{successOrder.orderNumber}</span></p>
              <p className="text-lg font-bold mt-1" style={{ color: '#f1f5f9' }}>{formatCurrency(successOrder.totalPrice)}</p>
            </div>

            {/* Bank Info */}
            {(settings.bank_name || settings.qris_image_url) && (
              <div className="p-4 rounded-xl mb-4" style={{ background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.2)' }}>
                <p className="text-sm font-semibold mb-3" style={{ color: '#6366f1' }}>💳 Informasi Pembayaran Transfer</p>
                <div className="flex gap-4 items-start flex-wrap">
                  <div className="space-y-1.5 flex-1">
                    {settings.bank_name && (
                      <div className="flex items-center gap-2">
                        <CreditCard size={14} style={{ color: '#6366f1' }} />
                        <span className="text-sm font-medium" style={{ color: '#f1f5f9' }}>{settings.bank_name}</span>
                      </div>
                    )}
                    {settings.account_number && (
                      <p className="text-xl font-bold font-mono" style={{ color: '#6366f1' }}>{settings.account_number}</p>
                    )}
                    {settings.account_holder && (
                      <p className="text-sm" style={{ color: '#94a3b8' }}>a.n. {settings.account_holder}</p>
                    )}
                    <p className="text-sm font-bold mt-2" style={{ color: '#f59e0b' }}>
                      Transfer tepat: {formatCurrency(successOrder.totalPrice)}
                    </p>
                  </div>
                  {settings.qris_image_url && (
                    <div className="text-center">
                      <div className="flex items-center gap-1 mb-1 justify-center">
                        <QrCode size={13} style={{ color: '#94a3b8' }} />
                        <span className="text-xs" style={{ color: '#94a3b8' }}>QRIS</span>
                      </div>
                      <img src={settings.qris_image_url} alt="QRIS" style={{ width: '110px', borderRadius: '8px', background: 'white', padding: '5px' }} />
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Upload bukti */}
            <div className="space-y-3">
              <p className="text-sm font-medium" style={{ color: '#94a3b8' }}>📤 Upload Bukti Transfer (sekarang atau nanti di Riwayat Order)</p>
              <div className="flex gap-2">
                <input
                  type="file"
                  accept=".jpg,.jpeg,.png,.pdf"
                  onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
                  className="input-field flex-1 text-sm"
                  style={{ padding: '0.5rem' }}
                />
                <button
                  onClick={handleUploadProof}
                  disabled={!uploadFile || uploading}
                  className="btn-primary flex items-center gap-1 flex-shrink-0"
                  style={{ fontSize: '0.85rem', padding: '0.5rem 0.9rem' }}
                >
                  {uploading ? <div className="spinner" style={{ width: '1rem', height: '1rem' }} /> : <Upload size={14} />}
                  Kirim
                </button>
              </div>
              <p className="text-xs" style={{ color: '#64748b' }}>Format: JPG, PNG, PDF · Maks 5MB</p>
            </div>

            <div className="flex gap-3 mt-5">
              <button
                onClick={() => { setSuccessOrder(null); setUploadFile(null) }}
                className="btn-secondary flex-1"
              >
                <X size={15} className="inline mr-1" /> Nanti di Riwayat Order
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
