'use client'

import { useEffect, useState } from 'react'
import { ShoppingCart, Search, Check, X, Eye, RefreshCw, PlusCircle } from 'lucide-react'
import toast from 'react-hot-toast'
import { formatCurrency, formatShortDate, getOrderStatusLabel, getPaymentStatusLabel } from '@/lib/utils'

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterOrderStatus, setFilterOrderStatus] = useState('')
  const [filterPayStatus, setFilterPayStatus] = useState('')
  const [selectedOrder, setSelectedOrder] = useState<any>(null)
  const [verifyNotes, setVerifyNotes] = useState('')
  const [processing, setProcessing] = useState(false)

  // Manual order modal
  const [showManualModal, setShowManualModal] = useState(false)
  const [users, setUsers] = useState<any[]>([])
  const [products, setProducts] = useState<any[]>([])
  const [userSearch, setUserSearch] = useState('')
  const [productSearches, setProductSearches] = useState<string[]>([''])
  const [manualForm, setManualForm] = useState({ userId: '', paymentMethod: 'CASH', notes: '', items: [{ productId: '', quantity: 1 }] })
  const [manualSubmitting, setManualSubmitting] = useState(false)

  useEffect(() => { fetchOrders() }, [])

  async function fetchOrders() {
    setLoading(true)
    try {
      const res = await fetch('/api/orders')
      if (res.ok) setOrders(await res.json())
    } finally { setLoading(false) }
  }

  async function openManualModal() {
    const [usersRes, productsRes] = await Promise.all([
      fetch('/api/users'),
      fetch('/api/products?isActive=true'),
    ])
    if (usersRes.ok) setUsers(await usersRes.json())
    if (productsRes.ok) setProducts(await productsRes.json())
    setManualForm({ userId: '', paymentMethod: 'CASH', notes: '', items: [{ productId: '', quantity: 1 }] })
    setUserSearch('')
    setProductSearches([''])
    setShowManualModal(true)
  }

  async function handleManualOrder(e: React.FormEvent) {
    e.preventDefault()
    if (!manualForm.userId) { toast.error('Pilih santri'); return }
    const validItems = manualForm.items.filter(i => i.productId)
    if (validItems.length === 0) { toast.error('Pilih minimal 1 produk'); return }
    setManualSubmitting(true)
    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        // isManual flag: server will auto-set SELESAI + LUNAS
        body: JSON.stringify({ ...manualForm, items: validItems, targetUserId: manualForm.userId, isManual: true }),
      })
      const data = await res.json()
      if (!res.ok) { toast.error(data.error); return }
      toast.success('✅ Order manual berhasil! Status: Selesai & Lunas')
      setShowManualModal(false)
      fetchOrders()
    } finally { setManualSubmitting(false) }
  }

  async function handleUpdateOrderStatus(orderId: string, orderStatus: string) {
    const res = await fetch(`/api/orders/${orderId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ orderStatus }),
    })
    const data = await res.json()
    if (!res.ok) { toast.error(data.error || 'Gagal'); return }
    toast.success('Status order diperbarui!')
    setSelectedOrder(data)
    fetchOrders()
  }

  async function handleCashPayment(orderId: string) {
    setProcessing(true)
    try {
      const res = await fetch(`/api/orders/${orderId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paymentStatus: 'LUNAS', orderStatus: 'SELESAI' }),
      })
      const data = await res.json()
      if (!res.ok) { toast.error(data.error); return }
      toast.success('✅ Pembayaran cash berhasil — Order Selesai!')
      setSelectedOrder(data)
      fetchOrders()
    } finally { setProcessing(false) }
  }

  async function handleVerify(orderId: string, action: 'verify' | 'reject') {
    setProcessing(true)
    try {
      const res = await fetch(`/api/payments/${orderId}/verify`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, notes: verifyNotes }),
      })
      const data = await res.json()
      if (!res.ok) { toast.error(data.error); return }
      toast.success(action === 'verify' ? '✅ Pembayaran diverifikasi — Order Selesai!' : 'Pembayaran ditolak!')
      setSelectedOrder(data)
      setVerifyNotes('')
      fetchOrders()
    } finally { setProcessing(false) }
  }

  const filtered = orders.filter((o) => {
    const matchSearch = o.user.name.toLowerCase().includes(search.toLowerCase()) ||
      o.orderNumber.toLowerCase().includes(search.toLowerCase())
    const matchOrder = !filterOrderStatus || o.orderStatus === filterOrderStatus
    const matchPay = !filterPayStatus || o.paymentStatus === filterPayStatus
    return matchSearch && matchOrder && matchPay
  })

  const statusBtnStyle = (color: string) => ({ padding: '0.3rem 0.8rem', borderRadius: '8px', fontSize: '0.8rem', fontWeight: 600, background: `${color}20`, color, border: `1px solid ${color}40`, cursor: 'pointer' })

  // Filtered users & products for search in modal
  const filteredUsers = users.filter(u =>
    u.name.toLowerCase().includes(userSearch.toLowerCase()) ||
    (u.nim || '').toLowerCase().includes(userSearch.toLowerCase())
  )

  function getFilteredProducts(idx: number) {
    const q = (productSearches[idx] || '').toLowerCase()
    return products.filter(p => p.name.toLowerCase().includes(q))
  }

  return (
    <div className="p-6 space-y-6 fade-in">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: '#f1f5f9' }}>Manajemen Order</h1>
          <p className="text-sm mt-1" style={{ color: '#64748b' }}>{orders.length} total order</p>
        </div>
        <div className="flex gap-3">
          <button onClick={fetchOrders} className="btn-secondary" style={{ padding: '0.5rem 0.75rem' }}><RefreshCw size={16} /></button>
          <button onClick={openManualModal} className="btn-primary flex items-center gap-2"><PlusCircle size={18} /> Order Manual</button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1" style={{ minWidth: '200px', maxWidth: '320px' }}>
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: '#64748b' }} />
          <input value={search} onChange={(e) => setSearch(e.target.value)} className="input-field pl-9" placeholder="Cari nama / no. order..." />
        </div>
        <select value={filterOrderStatus} onChange={(e) => setFilterOrderStatus(e.target.value)} className="select-field" style={{ width: 'auto', minWidth: '140px' }}>
          <option value="">Status Order</option>
          {['PENDING', 'DIPROSES', 'SELESAI', 'DIBATALKAN'].map(s => <option key={s} value={s}>{getOrderStatusLabel(s)}</option>)}
        </select>
        <select value={filterPayStatus} onChange={(e) => setFilterPayStatus(e.target.value)} className="select-field" style={{ width: 'auto', minWidth: '180px' }}>
          <option value="">Status Bayar</option>
          {['BELUM_BAYAR', 'MENUNGGU_VERIFIKASI', 'LUNAS', 'DITOLAK'].map(s => <option key={s} value={s}>{getPaymentStatusLabel(s)}</option>)}
        </select>
      </div>

      {/* Layout: Table + Detail Panel */}
      <div className="flex gap-6" style={{ alignItems: 'flex-start' }}>
        {/* Table */}
        <div className="stat-card overflow-x-auto flex-1" style={{ minWidth: 0 }}>
          {loading ? (
            <div className="flex items-center justify-center h-40"><div className="spinner" style={{ width: '2rem', height: '2rem', borderTopColor: '#6366f1' }} /></div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-16" style={{ color: '#64748b' }}>
              <ShoppingCart size={48} className="mx-auto mb-3 opacity-30" />
              <p>Tidak ada order</p>
            </div>
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th>No. Order</th>
                  <th>Santri</th>
                  <th>Total</th>
                  <th>Metode</th>
                  <th>Status Order</th>
                  <th>Status Bayar</th>
                  <th>Tanggal</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((o) => (
                  <tr key={o.id} style={{ cursor: 'pointer' }} onClick={() => setSelectedOrder(o)}>
                    <td className="font-mono text-xs" style={{ color: '#6366f1' }}>{o.orderNumber}</td>
                    <td>
                      <p className="font-medium text-sm" style={{ color: '#f1f5f9' }}>{o.user.name}</p>
                      {o.user.nim && <p className="text-xs" style={{ color: '#64748b' }}>{o.user.nim}</p>}
                    </td>
                    <td className="font-semibold" style={{ color: '#f1f5f9' }}>{formatCurrency(o.totalPrice)}</td>
                    <td>
                      <span className="badge" style={{ background: o.paymentMethod === 'TRANSFER' ? 'rgba(99,102,241,0.15)' : 'rgba(14,165,233,0.15)', color: o.paymentMethod === 'TRANSFER' ? '#6366f1' : '#0ea5e9' }}>
                        {o.paymentMethod}
                      </span>
                    </td>
                    <td><OrderStatusBadge status={o.orderStatus} /></td>
                    <td><PaymentStatusBadge status={o.paymentStatus} /></td>
                    <td className="text-xs" style={{ color: '#64748b' }}>{formatShortDate(o.createdAt)}</td>
                    <td>
                      <button onClick={(e) => { e.stopPropagation(); setSelectedOrder(o) }} style={{ color: '#6366f1' }}><Eye size={15} /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Detail Panel */}
        {selectedOrder && (
          <div className="stat-card fade-in" style={{ width: '340px', flexShrink: 0 }}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold" style={{ color: '#f1f5f9' }}>Detail Order</h3>
              <button onClick={() => setSelectedOrder(null)} style={{ color: '#64748b' }}><X size={18} /></button>
            </div>

            <div className="space-y-3">
              <div className="p-3 rounded-xl" style={{ background: 'rgba(51,65,85,0.5)' }}>
                <p className="text-xs mb-1" style={{ color: '#64748b' }}>No. Order</p>
                <p className="font-mono text-sm font-semibold" style={{ color: '#6366f1' }}>{selectedOrder.orderNumber}</p>
              </div>

              <div className="p-3 rounded-xl" style={{ background: 'rgba(51,65,85,0.5)' }}>
                <p className="text-xs mb-1" style={{ color: '#64748b' }}>Santri</p>
                <p className="font-medium text-sm" style={{ color: '#f1f5f9' }}>{selectedOrder.user.name}</p>
                {selectedOrder.user.nim && <p className="text-xs" style={{ color: '#64748b' }}>NIM: {selectedOrder.user.nim}</p>}
              </div>

              <div>
                <p className="text-xs mb-2 font-medium" style={{ color: '#64748b' }}>Produk Dipesan:</p>
                {selectedOrder.items?.map((item: any) => (
                  <div key={item.id} className="flex justify-between text-sm py-1.5 border-b" style={{ borderColor: 'rgba(51,65,85,0.5)' }}>
                    <span style={{ color: '#94a3b8' }}>{item.product.name} x{item.quantity}</span>
                    <span style={{ color: '#f1f5f9' }}>{formatCurrency(parseFloat(item.price) * item.quantity)}</span>
                  </div>
                ))}
                <div className="flex justify-between text-sm pt-2 font-bold">
                  <span style={{ color: '#64748b' }}>Total</span>
                  <span style={{ color: '#6366f1' }}>{formatCurrency(selectedOrder.totalPrice)}</span>
                </div>
              </div>

              <div className="flex gap-2">
                <div className="flex-1">
                  <p className="text-xs mb-1" style={{ color: '#64748b' }}>Status Order</p>
                  <OrderStatusBadge status={selectedOrder.orderStatus} />
                </div>
                <div className="flex-1">
                  <p className="text-xs mb-1" style={{ color: '#64748b' }}>Status Bayar</p>
                  <PaymentStatusBadge status={selectedOrder.paymentStatus} />
                </div>
              </div>

              {selectedOrder.payment?.fileUrl && (
                <div className="p-3 rounded-xl" style={{ background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.2)' }}>
                  <p className="text-xs mb-2 font-medium" style={{ color: '#6366f1' }}>Bukti Transfer</p>
                  <a href={selectedOrder.payment.fileUrl} target="_blank" rel="noopener noreferrer" className="text-sm underline" style={{ color: '#0ea5e9' }}>
                    Lihat bukti →
                  </a>
                </div>
              )}

              {/* Actions */}
              <div className="space-y-2 pt-1">
                {selectedOrder.paymentStatus === 'MENUNGGU_VERIFIKASI' && (
                  <>
                    <textarea value={verifyNotes} onChange={(e) => setVerifyNotes(e.target.value)} className="input-field" rows={2} placeholder="Catatan (opsional)" />
                    <div className="flex gap-2">
                      <button onClick={() => handleVerify(selectedOrder.id, 'verify')} disabled={processing} className="btn-success flex-1 flex items-center justify-center gap-1" style={{ fontSize: '0.85rem', padding: '0.5rem' }}>
                        <Check size={15} /> Verifikasi → Selesai
                      </button>
                      <button onClick={() => handleVerify(selectedOrder.id, 'reject')} disabled={processing} className="btn-danger flex-1 flex items-center justify-center gap-1" style={{ fontSize: '0.85rem', padding: '0.5rem' }}>
                        <X size={15} /> Tolak
                      </button>
                    </div>
                  </>
                )}
                {selectedOrder.paymentMethod === 'CASH' && selectedOrder.paymentStatus === 'BELUM_BAYAR' && selectedOrder.orderStatus !== 'DIBATALKAN' && (
                  <button onClick={() => handleCashPayment(selectedOrder.id)} disabled={processing} className="btn-success w-full flex items-center justify-center gap-2">
                    <Check size={16} /> Konfirmasi Cash → Selesai & Lunas
                  </button>
                )}
                {['PENDING', 'DIPROSES'].includes(selectedOrder.orderStatus) && (
                  <div>
                    <p className="text-xs mb-2" style={{ color: '#64748b' }}>Ubah Status Order:</p>
                    <div className="flex flex-wrap gap-2">
                      {selectedOrder.orderStatus === 'DIPROSES' && (
                        <button onClick={() => handleUpdateOrderStatus(selectedOrder.id, 'SELESAI')} style={statusBtnStyle('#10b981')}>Selesai</button>
                      )}
                      <button onClick={() => handleUpdateOrderStatus(selectedOrder.id, 'DIBATALKAN')} style={statusBtnStyle('#ef4444')}>Batalkan</button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Manual Order Modal */}
      {showManualModal && (
        <div className="modal-overlay" onClick={() => setShowManualModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxHeight: '90vh', overflowY: 'auto' }}>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-lg font-semibold" style={{ color: '#f1f5f9' }}>Order Manual</h2>
                <p className="text-xs mt-0.5" style={{ color: '#10b981' }}>✅ Order ini akan langsung SELESAI & LUNAS</p>
              </div>
              <button onClick={() => setShowManualModal(false)} style={{ color: '#64748b' }}><X size={20} /></button>
            </div>
            <form onSubmit={handleManualOrder} className="space-y-4">

              {/* SANTRI with search */}
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: '#94a3b8' }}>Santri *</label>
                <div className="relative mb-2">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: '#64748b' }} />
                  <input
                    value={userSearch}
                    onChange={(e) => setUserSearch(e.target.value)}
                    className="input-field pl-8"
                    placeholder="Cari nama / NIM santri..."
                    style={{ fontSize: '0.85rem', padding: '0.5rem 0.5rem 0.5rem 2rem' }}
                  />
                </div>
                <select
                  value={manualForm.userId}
                  onChange={(e) => setManualForm(p => ({ ...p, userId: e.target.value }))}
                  className="select-field"
                  required
                  size={Math.min(filteredUsers.length + 1, 6)}
                  style={{ height: 'auto' }}
                >
                  <option value="">— Pilih santri —</option>
                  {filteredUsers.map(u => (
                    <option key={u.id} value={u.id}>{u.name}{u.nim ? ` (${u.nim})` : ''}</option>
                  ))}
                </select>
                {manualForm.userId && (
                  <p className="text-xs mt-1" style={{ color: '#10b981' }}>
                    ✓ {users.find(u => u.id === manualForm.userId)?.name}
                  </p>
                )}
              </div>

              {/* PRODUK with search per row */}
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: '#94a3b8' }}>Produk yang Dipesan *</label>
                {manualForm.items.map((item, idx) => (
                  <div key={idx} className="mb-3 p-3 rounded-xl" style={{ background: 'rgba(51,65,85,0.3)' }}>
                    <div className="flex items-center gap-2 mb-2">
                      <p className="text-xs font-medium" style={{ color: '#94a3b8' }}>Produk {idx + 1}</p>
                      {manualForm.items.length > 1 && (
                        <button type="button" onClick={() => {
                          setManualForm(p => ({ ...p, items: p.items.filter((_, i) => i !== idx) }))
                          setProductSearches(ps => ps.filter((_, i) => i !== idx))
                        }} style={{ color: '#ef4444', marginLeft: 'auto' }}>
                          <X size={14} />
                        </button>
                      )}
                    </div>
                    {/* Product search */}
                    <div className="relative mb-2">
                      <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2" style={{ color: '#64748b' }} />
                      <input
                        value={productSearches[idx] || ''}
                        onChange={(e) => {
                          const ps = [...productSearches]
                          ps[idx] = e.target.value
                          setProductSearches(ps)
                        }}
                        className="input-field pl-7"
                        placeholder="Cari produk..."
                        style={{ fontSize: '0.82rem', padding: '0.4rem 0.4rem 0.4rem 1.8rem' }}
                      />
                    </div>
                    <div className="flex gap-2">
                      <select
                        value={item.productId}
                        onChange={(e) => {
                          const items = [...manualForm.items]
                          items[idx] = { ...item, productId: e.target.value }
                          setManualForm(p => ({ ...p, items }))
                        }}
                        className="select-field flex-1"
                        size={Math.min(getFilteredProducts(idx).length + 1, 5)}
                        style={{ height: 'auto', fontSize: '0.82rem' }}
                      >
                        <option value="">— Pilih produk —</option>
                        {getFilteredProducts(idx).map(p => (
                          <option key={p.id} value={p.id}>{p.name} — {formatCurrency(p.price)}</option>
                        ))}
                      </select>
                      <div className="flex flex-col gap-1">
                        <label className="text-xs" style={{ color: '#64748b' }}>Qty</label>
                        <input
                          type="number" min={1} value={item.quantity}
                          onChange={(e) => {
                            const items = [...manualForm.items]
                            items[idx] = { ...item, quantity: parseInt(e.target.value) || 1 }
                            setManualForm(p => ({ ...p, items }))
                          }}
                          className="input-field"
                          style={{ width: '64px', padding: '0.4rem', fontSize: '0.85rem' }}
                        />
                      </div>
                    </div>
                    {item.productId && (
                      <p className="text-xs mt-1" style={{ color: '#10b981' }}>
                        ✓ {products.find(p => p.id === item.productId)?.name}
                      </p>
                    )}
                  </div>
                ))}
                <button type="button" onClick={() => {
                  setManualForm(p => ({ ...p, items: [...p.items, { productId: '', quantity: 1 }] }))
                  setProductSearches(ps => [...ps, ''])
                }} className="text-sm" style={{ color: '#6366f1' }}>+ Tambah Produk</button>
              </div>

              {/* Payment method */}
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: '#94a3b8' }}>Metode Pembayaran</label>
                <select value={manualForm.paymentMethod} onChange={(e) => setManualForm(p => ({ ...p, paymentMethod: e.target.value }))} className="select-field">
                  <option value="CASH">Cash</option>
                  <option value="TRANSFER">Transfer / QRIS</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: '#94a3b8' }}>Catatan (opsional)</label>
                <textarea value={manualForm.notes} onChange={(e) => setManualForm(p => ({ ...p, notes: e.target.value }))} className="input-field" rows={2} placeholder="Catatan tambahan..." />
              </div>

              <div className="flex gap-3">
                <button type="button" onClick={() => setShowManualModal(false)} className="btn-secondary flex-1">Batal</button>
                <button type="submit" className="btn-primary flex-1 flex items-center justify-center gap-2" disabled={manualSubmitting}>
                  {manualSubmitting ? <div className="spinner" /> : <PlusCircle size={16} />}
                  {manualSubmitting ? 'Memproses...' : 'Buat Order → Selesai'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

function OrderStatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = { PENDING: 'badge-pending', DIPROSES: 'badge-diproses', SELESAI: 'badge-selesai', DIBATALKAN: 'badge-dibatalkan' }
  return <span className={`badge ${map[status] || ''}`}>{getOrderStatusLabel(status)}</span>
}

function PaymentStatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = { BELUM_BAYAR: 'badge-belum-bayar', MENUNGGU_VERIFIKASI: 'badge-menunggu', LUNAS: 'badge-lunas', DITOLAK: 'badge-ditolak' }
  return <span className={`badge ${map[status] || ''}`}>{getPaymentStatusLabel(status)}</span>
}
