'use client'

import { useEffect, useState } from 'react'
import { Plus, Edit2, Trash2, Package, Search, X, Check } from 'lucide-react'
import toast from 'react-hot-toast'
import { formatCurrency, getProductTypeLabel } from '@/lib/utils'

const PRODUCT_TYPES = ['KITAB', 'PAKET', 'ALAT_TULIS', 'LAYANAN']

const TYPE_COLORS: Record<string, string> = {
  KITAB: 'rgba(99,102,241,0.15)',
  PAKET: 'rgba(14,165,233,0.15)',
  ALAT_TULIS: 'rgba(16,185,129,0.15)',
  LAYANAN: 'rgba(245,158,11,0.15)',
}
const TYPE_TEXT: Record<string, string> = {
  KITAB: '#6366f1', PAKET: '#0ea5e9', ALAT_TULIS: '#10b981', LAYANAN: '#f59e0b'
}

export default function AdminProductsPage() {
  const [products, setProducts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterType, setFilterType] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editProduct, setEditProduct] = useState<any>(null)
  const [submitting, setSubmitting] = useState(false)
  const [showPackageModal, setShowPackageModal] = useState(false)
  const [selectedPackage, setSelectedPackage] = useState<any>(null)
  const [packageDetails, setPackageDetails] = useState<any[]>([])
  const [newPackageItem, setNewPackageItem] = useState({ productId: '', quantity: 1 })

  const [form, setForm] = useState({
    name: '', type: 'KITAB', price: '', description: '', isActive: true, stock: ''
  })

  useEffect(() => { fetchProducts() }, [])

  async function fetchProducts() {
    setLoading(true)
    try {
      const res = await fetch('/api/products')
      if (res.ok) setProducts(await res.json())
    } finally { setLoading(false) }
  }

  function openCreate() {
    setEditProduct(null)
    setForm({ name: '', type: 'KITAB', price: '', description: '', isActive: true, stock: '' })
    setShowModal(true)
  }

  function openEdit(product: any) {
    setEditProduct(product)
    setForm({
      name: product.name,
      type: product.type,
      price: product.price.toString(),
      description: product.description || '',
      isActive: product.isActive,
      stock: product.stock?.toString() || '',
    })
    setShowModal(true)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.name || !form.price) { toast.error('Nama dan harga wajib diisi'); return }
    setSubmitting(true)
    try {
      const url = editProduct ? `/api/products/${editProduct.id}` : '/api/products'
      const method = editProduct ? 'PUT' : 'POST'
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (!res.ok) { toast.error(data.error); return }
      toast.success(editProduct ? 'Produk diperbarui!' : 'Produk dibuat!')
      setShowModal(false)
      fetchProducts()
    } finally { setSubmitting(false) }
  }

  async function handleDelete(id: string, name: string) {
    if (!confirm(`Hapus produk "${name}"?`)) return
    const res = await fetch(`/api/products/${id}`, { method: 'DELETE' })
    const data = await res.json()
    if (!res.ok) { toast.error(data.error); return }
    toast.success('Produk dihapus!')
    fetchProducts()
  }

  async function openPackageModal(product: any) {
    setSelectedPackage(product)
    const res = await fetch(`/api/packages/${product.id}/details`)
    if (res.ok) setPackageDetails(await res.json())
    setShowPackageModal(true)
  }

  async function addPackageItem() {
    if (!newPackageItem.productId) { toast.error('Pilih produk'); return }
    const res = await fetch(`/api/packages/${selectedPackage.id}/details`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newPackageItem),
    })
    const data = await res.json()
    if (!res.ok) { toast.error(data.error); return }
    toast.success('Item ditambahkan ke paket')
    setPackageDetails((prev) => [...prev, data])
    setNewPackageItem({ productId: '', quantity: 1 })
  }

  async function removePackageItem(detailId: string) {
    const res = await fetch(`/api/packages/${selectedPackage.id}/details?detailId=${detailId}`, { method: 'DELETE' })
    if (!res.ok) { toast.error('Gagal menghapus'); return }
    toast.success('Item dihapus dari paket')
    setPackageDetails((prev) => prev.filter((d) => d.id !== detailId))
  }

  const filtered = products.filter((p) => {
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase())
    const matchType = !filterType || p.type === filterType
    return matchSearch && matchType
  })

  const nonPackageProducts = products.filter((p) => p.type !== 'PAKET' && p.isActive)

  return (
    <div className="p-6 space-y-6 fade-in">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: '#f1f5f9' }}>Produk & Paket</h1>
          <p className="text-sm mt-1" style={{ color: '#64748b' }}>{products.length} produk terdaftar</p>
        </div>
        <button onClick={openCreate} className="btn-primary flex items-center gap-2">
          <Plus size={18} /> Tambah Produk
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1" style={{ minWidth: '200px', maxWidth: '360px' }}>
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: '#64748b' }} />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input-field pl-9"
            placeholder="Cari produk..."
          />
        </div>
        <select value={filterType} onChange={(e) => setFilterType(e.target.value)} className="select-field" style={{ width: 'auto', minWidth: '150px' }}>
          <option value="">Semua Tipe</option>
          {PRODUCT_TYPES.map((t) => <option key={t} value={t}>{getProductTypeLabel(t)}</option>)}
        </select>
      </div>

      {/* Table */}
      <div className="stat-card overflow-x-auto">
        {loading ? (
          <div className="flex items-center justify-center h-40"><div className="spinner" style={{ width: '2rem', height: '2rem', borderTopColor: '#6366f1' }} /></div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16" style={{ color: '#64748b' }}>
            <Package size={48} className="mx-auto mb-3 opacity-30" />
            <p>Tidak ada produk ditemukan</p>
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Nama Produk</th>
                <th>Tipe</th>
                <th>Harga</th>
                <th>Stok</th>
                <th>Status</th>
                <th>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((p, i) => (
                <tr key={p.id}>
                  <td style={{ color: '#64748b' }}>{i + 1}</td>
                  <td>
                    <div>
                      <p className="font-medium" style={{ color: '#f1f5f9' }}>{p.name}</p>
                      {p.description && <p className="text-xs mt-0.5" style={{ color: '#64748b' }}>{p.description.slice(0, 60)}{p.description.length > 60 ? '...' : ''}</p>}
                    </div>
                  </td>
                  <td>
                    <span className="badge" style={{ background: TYPE_COLORS[p.type], color: TYPE_TEXT[p.type] }}>
                      {getProductTypeLabel(p.type)}
                    </span>
                  </td>
                  <td className="font-semibold" style={{ color: '#f1f5f9' }}>{formatCurrency(p.price)}</td>
                  <td style={{ color: '#94a3b8' }}>{p.stock ?? '∞'}</td>
                  <td>
                    <span className={`badge ${p.isActive ? 'badge-selesai' : 'badge-dibatalkan'}`}>
                      {p.isActive ? 'Aktif' : 'Nonaktif'}
                    </span>
                  </td>
                  <td>
                    <div className="flex items-center gap-2">
                      {p.type === 'PAKET' && (
                        <button onClick={() => openPackageModal(p)} className="px-2 py-1 rounded-lg text-xs font-medium" style={{ background: 'rgba(14,165,233,0.1)', color: '#0ea5e9' }}>
                          Isi Paket
                        </button>
                      )}
                      <button onClick={() => openEdit(p)} className="p-1.5 rounded-lg hover:bg-indigo-500/10" style={{ color: '#6366f1' }}><Edit2 size={15} /></button>
                      <button onClick={() => handleDelete(p.id, p.name)} className="p-1.5 rounded-lg hover:bg-red-500/10" style={{ color: '#ef4444' }}><Trash2 size={15} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold" style={{ color: '#f1f5f9' }}>
                {editProduct ? 'Edit Produk' : 'Tambah Produk Baru'}
              </h2>
              <button onClick={() => setShowModal(false)} style={{ color: '#64748b' }}><X size={20} /></button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: '#94a3b8' }}>Nama Produk *</label>
                <input value={form.name} onChange={(e) => setForm(p => ({ ...p, name: e.target.value }))} className="input-field" placeholder="Nama produk" required />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: '#94a3b8' }}>Tipe *</label>
                  <select value={form.type} onChange={(e) => setForm(p => ({ ...p, type: e.target.value }))} className="select-field">
                    {PRODUCT_TYPES.map((t) => <option key={t} value={t}>{getProductTypeLabel(t)}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: '#94a3b8' }}>Harga (Rp) *</label>
                  <input type="number" value={form.price} onChange={(e) => setForm(p => ({ ...p, price: e.target.value }))} className="input-field" placeholder="25000" required />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: '#94a3b8' }}>Deskripsi</label>
                <textarea value={form.description} onChange={(e) => setForm(p => ({ ...p, description: e.target.value }))} className="input-field" rows={3} placeholder="Deskripsi produk (opsional)" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: '#94a3b8' }}>Stok (kosongkan = ∞)</label>
                  <input type="number" value={form.stock} onChange={(e) => setForm(p => ({ ...p, stock: e.target.value }))} className="input-field" placeholder="Opsional" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: '#94a3b8' }}>Status</label>
                  <select value={form.isActive ? 'true' : 'false'} onChange={(e) => setForm(p => ({ ...p, isActive: e.target.value === 'true' }))} className="select-field">
                    <option value="true">Aktif</option>
                    <option value="false">Nonaktif</option>
                  </select>
                </div>
              </div>
              <div className="flex gap-3 mt-2">
                <button type="button" onClick={() => setShowModal(false)} className="btn-secondary flex-1">Batal</button>
                <button type="submit" className="btn-primary flex-1 flex items-center justify-center gap-2" disabled={submitting}>
                  {submitting ? <div className="spinner" /> : <Check size={16} />}
                  {submitting ? 'Menyimpan...' : 'Simpan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Package Detail Modal */}
      {showPackageModal && selectedPackage && (
        <div className="modal-overlay" onClick={() => setShowPackageModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '600px' }}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold" style={{ color: '#f1f5f9' }}>
                Isi Paket: <span style={{ color: '#6366f1' }}>{selectedPackage.name}</span>
              </h2>
              <button onClick={() => setShowPackageModal(false)} style={{ color: '#64748b' }}><X size={20} /></button>
            </div>

            {/* Current items */}
            <div className="space-y-2 mb-4">
              {packageDetails.length === 0 ? (
                <p className="text-sm text-center py-4" style={{ color: '#64748b' }}>Paket masih kosong</p>
              ) : (
                packageDetails.map((d) => (
                  <div key={d.id} className="flex items-center justify-between p-3 rounded-xl" style={{ background: 'rgba(51,65,85,0.5)' }}>
                    <div>
                      <p className="font-medium text-sm" style={{ color: '#f1f5f9' }}>{d.product.name}</p>
                      <p className="text-xs" style={{ color: '#64748b' }}>Jumlah: {d.quantity} | {formatCurrency(d.product.price)}</p>
                    </div>
                    <button onClick={() => removePackageItem(d.id)} className="p-1.5 rounded-lg" style={{ color: '#ef4444' }}><Trash2 size={14} /></button>
                  </div>
                ))
              )}
            </div>

            {/* Add item */}
            <div className="p-4 rounded-xl" style={{ background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.15)' }}>
              <p className="text-sm font-medium mb-3" style={{ color: '#94a3b8' }}>Tambah Produk ke Paket</p>
              <div className="flex gap-3">
                <select
                  value={newPackageItem.productId}
                  onChange={(e) => setNewPackageItem(p => ({ ...p, productId: e.target.value }))}
                  className="select-field flex-1"
                >
                  <option value="">Pilih produk...</option>
                  {nonPackageProducts.map((p) => (
                    <option key={p.id} value={p.id}>{p.name} — {formatCurrency(p.price)}</option>
                  ))}
                </select>
                <input
                  type="number"
                  min={1}
                  value={newPackageItem.quantity}
                  onChange={(e) => setNewPackageItem(p => ({ ...p, quantity: parseInt(e.target.value) }))}
                  className="input-field"
                  style={{ width: '80px' }}
                />
                <button onClick={addPackageItem} className="btn-primary" style={{ padding: '0.6rem 1rem' }}>
                  <Plus size={16} />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
