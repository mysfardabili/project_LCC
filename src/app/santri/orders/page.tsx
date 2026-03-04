'use client'

import { useEffect, useState } from 'react'
import { ShoppingCart, Upload, Eye, ChevronDown, ChevronUp, QrCode, CreditCard, Trash2 } from 'lucide-react'
import toast from 'react-hot-toast'
import { formatCurrency, formatDate, getOrderStatusLabel, getPaymentStatusLabel } from '@/lib/utils'

export default function SantriOrdersPage() {
  const [orders, setOrders] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [uploadingId, setUploadingId] = useState<string | null>(null)
  const [file, setFile] = useState<File | null>(null)
  const [settings, setSettings] = useState<Record<string, string>>({})
  const [cancellingId, setCancellingId] = useState<string | null>(null)
  const [confirmCancelId, setConfirmCancelId] = useState<string | null>(null)

  useEffect(() => {
    Promise.all([
      fetch('/api/orders').then(r => r.json()),
      fetch('/api/settings').then(r => r.json()),
    ]).then(([ordersData, settingsData]) => {
      setOrders(ordersData)
      setSettings(settingsData)
    }).finally(() => setLoading(false))
  }, [])


  function toggle(id: string) {
    setExpandedId(prev => prev === id ? null : id)
    setFile(null)
  }

  async function handleUpload(orderId: string) {
    if (!file) { toast.error('Pilih file terlebih dahulu'); return }
    setUploadingId(orderId)
    try {
      const fd = new FormData()
      fd.append('file', file)
      const res = await fetch(`/api/payments/${orderId}`, { method: 'POST', body: fd })
      const data = await res.json()
      if (!res.ok) { toast.error(data.error || 'Gagal upload'); return }
      toast.success('Bukti transfer berhasil diupload!')
      setFile(null)
      // Refresh orders
      const ordersRes = await fetch('/api/orders')
      if (ordersRes.ok) setOrders(await ordersRes.json())
    } finally { setUploadingId(null) }
  }

  async function handleCancel(orderId: string) {
    setCancellingId(orderId)
    try {
      const res = await fetch(`/api/orders/${orderId}`, { method: 'PATCH' })
      const data = await res.json()
      if (!res.ok) { toast.error(data.error || 'Gagal membatalkan order'); return }
      toast.success('Order berhasil dibatalkan')
      setConfirmCancelId(null)
      const ordersRes = await fetch('/api/orders')
      if (ordersRes.ok) setOrders(await ordersRes.json())
    } finally { setCancellingId(null) }
  }

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center h-64">
        <div className="spinner" style={{ width: '2.5rem', height: '2.5rem', borderTopColor: '#6366f1' }} />
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6 fade-in">
      <div>
        <h1 className="text-2xl font-bold" style={{ color: '#f1f5f9' }}>Riwayat Order</h1>
        <p className="text-sm mt-1" style={{ color: '#64748b' }}>{orders.length} order ditemukan</p>
      </div>

      {orders.length === 0 ? (
        <div className="stat-card text-center py-20" style={{ color: '#64748b' }}>
          <ShoppingCart size={56} className="mx-auto mb-4 opacity-20" />
          <p className="text-lg font-medium" style={{ color: '#94a3b8' }}>Belum ada order</p>
          <p className="text-sm mt-1">Kunjungi katalog untuk mulai berbelanja</p>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <div key={order.id} className="stat-card">
              {/* Order Header */}
              <div
                className="flex items-center justify-between cursor-pointer"
                onClick={() => toggle(order.id)}
              >
                <div className="flex items-center gap-4 flex-wrap">
                  <div>
                    <p className="text-sm font-mono font-semibold" style={{ color: '#6366f1' }}>{order.orderNumber}</p>
                    <p className="text-xs mt-0.5" style={{ color: '#64748b' }}>{formatDate(order.createdAt)}</p>
                  </div>
                  <div className="flex gap-2 flex-wrap">
                    <OrderStatusBadge status={order.orderStatus} />
                    <PaymentStatusBadge status={order.paymentStatus} />
                    <span className="badge" style={{ background: order.paymentMethod === 'TRANSFER' ? 'rgba(99,102,241,0.1)' : 'rgba(14,165,233,0.1)', color: order.paymentMethod === 'TRANSFER' ? '#6366f1' : '#0ea5e9' }}>
                      {order.paymentMethod}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-3" onClick={e => e.stopPropagation()}>
                  <span className="font-bold" style={{ color: '#f1f5f9' }}>{formatCurrency(order.totalPrice)}</span>

                  {/* Cancel button — only PENDING + BELUM_BAYAR */}
                  {order.orderStatus === 'PENDING' && order.paymentStatus === 'BELUM_BAYAR' && (
                    confirmCancelId === order.id ? (
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs" style={{ color: '#f59e0b' }}>Yakin batalkan?</span>
                        <button
                          onClick={() => handleCancel(order.id)}
                          disabled={cancellingId === order.id}
                          className="text-xs font-semibold px-2 py-0.5 rounded-lg"
                          style={{ background: 'rgba(239,68,68,0.15)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.3)' }}
                        >
                          {cancellingId === order.id ? '...' : 'Ya'}
                        </button>
                        <button
                          onClick={() => setConfirmCancelId(null)}
                          className="text-xs font-semibold px-2 py-0.5 rounded-lg"
                          style={{ background: 'rgba(51,65,85,0.5)', color: '#94a3b8' }}
                        >
                          Tidak
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setConfirmCancelId(order.id)}
                        title="Batalkan Order"
                        className="flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-lg"
                        style={{ background: 'rgba(239,68,68,0.1)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.2)' }}
                      >
                        <Trash2 size={12} /> Batalkan
                      </button>
                    )
                  )}

                  {expandedId === order.id ? <ChevronUp size={18} style={{ color: '#64748b' }} onClick={() => toggle(order.id)} /> : <ChevronDown size={18} style={{ color: '#64748b' }} onClick={() => toggle(order.id)} />}
                </div>
              </div>

              {/* Expanded Detail */}
              {expandedId === order.id && (
                <div className="mt-4 pt-4 border-t space-y-4 fade-in" style={{ borderColor: 'rgba(51,65,85,0.6)' }}>
                  {/* Items */}
                  <div>
                    <p className="text-xs font-semibold mb-2" style={{ color: '#64748b' }}>PRODUK DIPESAN</p>
                    <div className="space-y-2">
                      {order.items?.map((item: any) => (
                        <div key={item.id} className="flex justify-between items-center text-sm py-2 border-b" style={{ borderColor: 'rgba(51,65,85,0.4)' }}>
                          <div>
                            <span style={{ color: '#f1f5f9' }}>{item.product.name}</span>
                            <span className="ml-2 text-xs" style={{ color: '#64748b' }}>x{item.quantity}</span>
                          </div>
                          <span style={{ color: '#94a3b8' }}>{formatCurrency(parseFloat(item.price) * item.quantity)}</span>
                        </div>
                      ))}
                      <div className="flex justify-between pt-1 font-bold">
                        <span style={{ color: '#64748b' }}>Total</span>
                        <span style={{ color: '#6366f1' }}>{formatCurrency(order.totalPrice)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Notes */}
                  {order.notes && (
                    <div className="p-3 rounded-xl text-sm" style={{ background: 'rgba(51,65,85,0.4)' }}>
                      <span style={{ color: '#64748b' }}>Catatan: </span>
                      <span style={{ color: '#94a3b8' }}>{order.notes}</span>
                    </div>
                  )}

                  {/* Payment section */}
                  {order.paymentMethod === 'TRANSFER' && (
                    <div className="p-4 rounded-xl space-y-3" style={{ background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.15)' }}>
                      <p className="text-sm font-semibold" style={{ color: '#6366f1' }}>💳 Pembayaran Transfer</p>

                      {/* Bank info + QRIS */}
                      {(settings.bank_name || settings.qris_image_url) && order.paymentStatus !== 'LUNAS' && order.orderStatus !== 'DIBATALKAN' && (
                        <div className="p-3 rounded-xl space-y-2" style={{ background: 'rgba(51,65,85,0.4)' }}>
                          <p className="text-xs font-semibold" style={{ color: '#94a3b8' }}>📋 Transfer ke:</p>
                          <div className="flex gap-4 flex-wrap items-start">
                            <div className="space-y-1.5">
                              {settings.bank_name && (
                                <div className="flex items-center gap-2">
                                  <CreditCard size={13} style={{ color: '#6366f1' }} />
                                  <p className="text-sm font-medium" style={{ color: '#f1f5f9' }}>{settings.bank_name}</p>
                                </div>
                              )}
                              {settings.account_number && (
                                <p className="text-base font-bold font-mono" style={{ color: '#6366f1' }}>{settings.account_number}</p>
                              )}
                              {settings.account_holder && (
                                <p className="text-xs" style={{ color: '#94a3b8' }}>a.n. {settings.account_holder}</p>
                              )}
                              {settings.qris_image_url && (
                                <p className="text-xs pt-1" style={{ color: '#64748b' }}>atau scan QRIS di samping →</p>
                              )}
                            </div>
                            {settings.qris_image_url && (
                              <div>
                                <div className="flex items-center gap-1 mb-1">
                                  <QrCode size={12} style={{ color: '#94a3b8' }} />
                                  <p className="text-xs" style={{ color: '#94a3b8' }}>QRIS</p>
                                </div>
                                <img src={settings.qris_image_url} alt="QRIS" style={{ width: '100px', borderRadius: '8px', background: 'white', padding: '4px' }} />
                              </div>
                            )}
                          </div>
                          <p className="text-xs font-semibold mt-1" style={{ color: '#f59e0b' }}>
                            ⚠️ Transfer sejumlah tepat: {formatCurrency(order.totalPrice)}
                          </p>
                        </div>
                      )}

                      {order.payment?.fileUrl ? (
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm" style={{ color: '#94a3b8' }}>File: {order.payment.fileName}</p>
                            <PaymentStatusBadge status={order.payment.status} />
                            {order.payment.notes && <p className="text-xs mt-1" style={{ color: '#ef4444' }}>Catatan admin: {order.payment.notes}</p>}
                          </div>
                          <a href={order.payment.fileUrl} target="_blank" rel="noopener noreferrer" className="btn-secondary flex items-center gap-1" style={{ fontSize: '0.8rem', padding: '0.4rem 0.8rem' }}>
                            <Eye size={13} /> Lihat
                          </a>
                        </div>
                      ) : (
                        <p className="text-sm" style={{ color: '#64748b' }}>
                          Belum ada bukti transfer diunggah
                        </p>
                      )}

                      {/* Upload only if not yet verified/paid */}
                      {order.paymentStatus !== 'LUNAS' && order.paymentStatus !== 'DITOLAK' && order.orderStatus !== 'DIBATALKAN' && (
                        <div className="space-y-2">
                          <label className="block text-xs font-medium" style={{ color: '#94a3b8' }}>
                            {order.payment ? '🔄 Ganti Bukti Transfer' : '📤 Upload Bukti Transfer'}
                          </label>
                          <div className="flex gap-2">
                            <input
                              type="file"
                              accept=".jpg,.jpeg,.png,.pdf"
                              onChange={(e) => setFile(e.target.files?.[0] || null)}
                              className="input-field flex-1 text-sm"
                              style={{ padding: '0.5rem' }}
                            />
                            <button
                              onClick={() => handleUpload(order.id)}
                              disabled={!!uploadingId}
                              className="btn-primary flex items-center gap-1"
                              style={{ fontSize: '0.85rem', padding: '0.5rem 0.9rem', flexShrink: 0 }}
                            >
                              {uploadingId === order.id ? <div className="spinner" style={{ width: '1rem', height: '1rem' }} /> : <Upload size={14} />}
                              Upload
                            </button>
                          </div>
                          <p className="text-xs" style={{ color: '#64748b' }}>Format: JPG, PNG, PDF | Maks 5MB</p>
                        </div>
                      )}
                    </div>
                  )}

                </div>
              )}
            </div>
          ))}
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
