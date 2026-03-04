'use client'

import { useEffect, useState } from 'react'
import { Users, Search, X, ChevronRight, Phone, Mail, Hash, Calendar, ShoppingCart, Trash2, KeyRound, Eye, EyeOff } from 'lucide-react'
import { formatShortDate, formatDate, formatCurrency, getOrderStatusLabel, getPaymentStatusLabel } from '@/lib/utils'
import toast from 'react-hot-toast'

export default function AdminUsersPage() {
  const [users, setUsers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [selectedUser, setSelectedUser] = useState<any>(null)
  const [userDetail, setUserDetail] = useState<any>(null)
  const [loadingDetail, setLoadingDetail] = useState(false)

  // Reset password modal
  const [showResetModal, setShowResetModal] = useState(false)
  const [resetTarget, setResetTarget] = useState<any>(null)
  const [newPassword, setNewPassword] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [resetting, setResetting] = useState(false)

  // Delete confirmation
  const [deleteTarget, setDeleteTarget] = useState<any>(null)
  const [deleting, setDeleting] = useState(false)

  async function fetchUsers() {
    setLoading(true)
    fetch('/api/users').then(r => r.json()).then(setUsers).finally(() => setLoading(false))
  }

  useEffect(() => { fetchUsers() }, [])

  async function openDetail(user: any) {
    setSelectedUser(user)
    setUserDetail(null)
    setLoadingDetail(true)
    try {
      const res = await fetch(`/api/users/${user.id}`)
      if (res.ok) setUserDetail(await res.json())
    } finally { setLoadingDetail(false) }
  }

  async function handleResetPassword(e: React.FormEvent) {
    e.preventDefault()
    setResetting(true)
    try {
      const res = await fetch(`/api/users/${resetTarget.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newPassword }),
      })
      const data = await res.json()
      if (!res.ok) { toast.error(data.error); return }
      toast.success(`Password ${resetTarget.name} berhasil direset!`)
      setShowResetModal(false)
      setNewPassword('')
    } finally { setResetting(false) }
  }

  async function handleDelete() {
    setDeleting(true)
    try {
      const res = await fetch(`/api/users/${deleteTarget.id}`, { method: 'DELETE' })
      const data = await res.json()
      if (!res.ok) { toast.error(data.error); return }
      toast.success(`Akun ${deleteTarget.name} berhasil dihapus`)
      setDeleteTarget(null)
      setSelectedUser(null)
      setUserDetail(null)
      fetchUsers()
    } finally { setDeleting(false) }
  }

  const filtered = users.filter(u =>
    u.name.toLowerCase().includes(search.toLowerCase()) ||
    (u.nim || '').toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="p-6 space-y-6 fade-in">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: '#f1f5f9' }}>Data Santri</h1>
          <p className="text-sm mt-1" style={{ color: '#64748b' }}>{users.length} santri terdaftar</p>
        </div>
      </div>

      <div className="relative" style={{ maxWidth: '360px' }}>
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: '#64748b' }} />
        <input value={search} onChange={(e) => setSearch(e.target.value)} className="input-field pl-9" placeholder="Cari nama, NIM, atau email..." />
      </div>

      <div className="flex gap-6" style={{ alignItems: 'flex-start' }}>
        {/* Table */}
        <div className="stat-card overflow-x-auto flex-1" style={{ minWidth: 0 }}>
          {loading ? (
            <div className="flex items-center justify-center h-40"><div className="spinner" style={{ width: '2rem', height: '2rem', borderTopColor: '#6366f1' }} /></div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-16" style={{ color: '#64748b' }}>
              <Users size={48} className="mx-auto mb-3 opacity-30" />
              <p>Tidak ada santri ditemukan</p>
            </div>
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Nama</th>
                  <th>NIM</th>
                  <th>Email</th>
                  <th>No. WA</th>
                  <th>Total Order</th>
                  <th>Terdaftar</th>
                  <th>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((u, i) => (
                  <tr key={u.id}>
                    <td style={{ color: '#64748b' }}>{i + 1}</td>
                    <td>
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0" style={{ background: 'linear-gradient(135deg, #6366f1, #4f46e5)', color: 'white' }}>
                          {u.name.charAt(0).toUpperCase()}
                        </div>
                        <span className="font-medium" style={{ color: '#f1f5f9' }}>{u.name}</span>
                      </div>
                    </td>
                    <td style={{ color: '#94a3b8' }}>{u.nim || '—'}</td>
                    <td style={{ color: '#94a3b8' }}>{u.email}</td>
                    <td style={{ color: '#94a3b8' }}>{u.phone || '—'}</td>
                    <td><span className="badge badge-diproses">{u._count?.orders || 0} order</span></td>
                    <td className="text-xs" style={{ color: '#64748b' }}>{formatShortDate(u.createdAt)}</td>
                    <td>
                      <div className="flex gap-2">
                        <button onClick={() => openDetail(u)} className="text-xs font-medium flex items-center gap-1" style={{ color: '#6366f1' }}>
                          Detail <ChevronRight size={12} />
                        </button>
                        <button onClick={() => { setResetTarget(u); setShowResetModal(true) }} title="Reset Password" style={{ color: '#f59e0b' }}>
                          <KeyRound size={15} />
                        </button>
                        <button onClick={() => setDeleteTarget(u)} title="Hapus Akun" style={{ color: '#ef4444' }}>
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Detail panel */}
        {selectedUser && (
          <div className="stat-card fade-in" style={{ width: '380px', flexShrink: 0 }}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold" style={{ color: '#f1f5f9' }}>Detail Santri</h3>
              <div className="flex gap-2">
                <button onClick={() => { setResetTarget(selectedUser); setShowResetModal(true) }} title="Reset Password" style={{ color: '#f59e0b' }}><KeyRound size={16} /></button>
                <button onClick={() => setDeleteTarget(selectedUser)} title="Hapus" style={{ color: '#ef4444' }}><Trash2 size={16} /></button>
                <button onClick={() => { setSelectedUser(null); setUserDetail(null) }} style={{ color: '#64748b' }}><X size={18} /></button>
              </div>
            </div>

            {loadingDetail ? (
              <div className="flex items-center justify-center h-32"><div className="spinner" style={{ width: '1.5rem', height: '1.5rem', borderTopColor: '#6366f1' }} /></div>
            ) : userDetail && (
              <div className="space-y-4">
                <div className="flex items-center gap-3 p-3 rounded-xl" style={{ background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.15)' }}>
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center text-xl font-bold flex-shrink-0" style={{ background: 'linear-gradient(135deg, #6366f1, #4f46e5)', color: 'white' }}>
                    {userDetail.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="font-semibold" style={{ color: '#f1f5f9' }}>{userDetail.name}</p>
                    <span className="badge badge-diproses text-xs">SANTRI</span>
                  </div>
                </div>

                <div className="space-y-2">
                  {[
                    { icon: Mail, label: userDetail.email },
                    { icon: Hash, label: userDetail.nim ? `NIM: ${userDetail.nim}` : 'NIM: —' },
                    { icon: Phone, label: userDetail.phone || 'No. WA: —' },
                    { icon: Calendar, label: `Daftar: ${formatDate(userDetail.createdAt)}` },
                  ].map(({ icon: Icon, label }) => (
                    <div key={label} className="flex items-center gap-2 text-sm">
                      <Icon size={14} style={{ color: '#6366f1', flexShrink: 0 }} />
                      <span style={{ color: '#94a3b8' }}>{label}</span>
                    </div>
                  ))}
                </div>

                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <ShoppingCart size={14} style={{ color: '#6366f1' }} />
                    <p className="text-sm font-semibold" style={{ color: '#f1f5f9' }}>Riwayat Order ({userDetail.orders?.length || 0})</p>
                  </div>
                  <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                    {userDetail.orders?.length === 0 ? (
                      <p className="text-sm text-center py-4" style={{ color: '#64748b' }}>Belum ada order</p>
                    ) : userDetail.orders?.map((order: any) => (
                      <div key={order.id} className="p-2.5 rounded-xl" style={{ background: 'rgba(51,65,85,0.4)' }}>
                        <div className="flex justify-between items-start mb-1">
                          <p className="text-xs font-mono font-semibold" style={{ color: '#6366f1' }}>{order.orderNumber}</p>
                          <p className="text-xs font-bold" style={{ color: '#f1f5f9' }}>{formatCurrency(order.totalPrice)}</p>
                        </div>
                        <div className="flex gap-1.5 flex-wrap">
                          <span className={`badge text-xs ${order.orderStatus === 'SELESAI' ? 'badge-selesai' : order.orderStatus === 'PENDING' ? 'badge-pending' : order.orderStatus === 'DIPROSES' ? 'badge-diproses' : 'badge-dibatalkan'}`}>
                            {getOrderStatusLabel(order.orderStatus)}
                          </span>
                          <span className={`badge text-xs ${order.paymentStatus === 'LUNAS' ? 'badge-lunas' : order.paymentStatus === 'MENUNGGU_VERIFIKASI' ? 'badge-menunggu' : order.paymentStatus === 'DITOLAK' ? 'badge-ditolak' : 'badge-belum-bayar'}`}>
                            {getPaymentStatusLabel(order.paymentStatus)}
                          </span>
                        </div>
                        <p className="text-xs mt-1" style={{ color: '#64748b' }}>{formatShortDate(order.createdAt)}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Reset Password Modal */}
      {showResetModal && resetTarget && (
        <div className="modal-overlay" onClick={() => { setShowResetModal(false); setNewPassword('') }}>
          <div className="modal-content" style={{ maxWidth: '420px' }} onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <div>
                <h3 className="font-semibold" style={{ color: '#f1f5f9' }}>Reset Password</h3>
                <p className="text-sm mt-0.5" style={{ color: '#64748b' }}>untuk <strong style={{ color: '#6366f1' }}>{resetTarget.name}</strong></p>
              </div>
              <button onClick={() => { setShowResetModal(false); setNewPassword('') }} style={{ color: '#64748b' }}><X size={18} /></button>
            </div>
            <form onSubmit={handleResetPassword} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: '#94a3b8' }}>Password Baru</label>
                <div className="relative">
                  <input
                    type={showPw ? 'text' : 'password'}
                    value={newPassword}
                    onChange={e => setNewPassword(e.target.value)}
                    className="input-field pr-10"
                    placeholder="Minimal 6 karakter"
                    minLength={6}
                    required
                  />
                  <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3 top-1/2 -translate-y-1/2" style={{ color: '#64748b' }}>
                    {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>
              <div className="flex gap-3">
                <button type="button" onClick={() => { setShowResetModal(false); setNewPassword('') }} className="btn-secondary flex-1">Batal</button>
                <button type="submit" disabled={resetting} className="btn-primary flex-1 flex items-center justify-center gap-2">
                  {resetting ? <div className="spinner" /> : <KeyRound size={15} />}
                  {resetting ? 'Mereset...' : 'Reset Password'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteTarget && (
        <div className="modal-overlay" onClick={() => setDeleteTarget(null)}>
          <div className="modal-content" style={{ maxWidth: '400px' }} onClick={e => e.stopPropagation()}>
            <div className="text-center py-2">
              <div className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4" style={{ background: 'rgba(239,68,68,0.15)' }}>
                <Trash2 size={28} style={{ color: '#ef4444' }} />
              </div>
              <h3 className="font-semibold text-lg mb-2" style={{ color: '#f1f5f9' }}>Hapus Akun Santri?</h3>
              <p className="text-sm mb-1" style={{ color: '#94a3b8' }}>
                Akun <strong style={{ color: '#f1f5f9' }}>{deleteTarget.name}</strong> akan dihapus permanen.
              </p>
              <p className="text-xs mb-6" style={{ color: '#ef4444' }}>
                ⚠️ Semua data order santri ini juga akan terhapus!
              </p>
              <div className="flex gap-3">
                <button onClick={() => setDeleteTarget(null)} className="btn-secondary flex-1">Batal</button>
                <button onClick={handleDelete} disabled={deleting} className="btn-danger flex-1 flex items-center justify-center gap-2">
                  {deleting ? <div className="spinner" /> : <Trash2 size={15} />}
                  {deleting ? 'Menghapus...' : 'Ya, Hapus'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
