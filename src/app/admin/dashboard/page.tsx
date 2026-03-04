'use client'

import { useEffect, useState } from 'react'
import {
  TrendingUp, ShoppingCart, Clock, Users, Package, CreditCard,
  BarChart3, RefreshCw, FileDown
} from 'lucide-react'
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend
} from 'recharts'
import { formatCurrency, formatShortDate, getOrderStatusLabel, getPaymentStatusLabel } from '@/lib/utils'

type FilterType = 'daily' | 'weekly' | 'monthly' | 'yearly'

const FILTER_LABELS: Record<FilterType, string> = {
  daily: 'Hari Ini',
  weekly: 'Minggu Ini',
  monthly: 'Bulan Ini',
  yearly: 'Tahun Ini',
}

const PAYMENT_COLORS = { TRANSFER: '#6366f1', CASH: '#0ea5e9' }

export default function AdminDashboard() {
  const [filter, setFilter] = useState<FilterType>('monthly')
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  async function fetchStats() {
    setLoading(true)
    try {
      const res = await fetch(`/api/dashboard/stats?filter=${filter}`)
      if (res.ok) setData(await res.json())
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchStats() }, [filter])

  const chartData = data?.chartData?.map((d: any) => ({
    date: formatShortDate(d.date),
    revenue: d.revenue,
  })) || []

  const pieData = data?.paymentMethodStats?.map((s: any) => ({
    name: s.method === 'TRANSFER' ? 'Transfer' : 'Cash',
    value: s.count,
  })) || []

  return (
    <div className="p-6 space-y-6 fade-in">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: '#f1f5f9' }}>Dashboard</h1>
          <p className="text-sm mt-1" style={{ color: '#64748b' }}>Overview penjualan & transaksi</p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          {(Object.keys(FILTER_LABELS) as FilterType[]).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={filter === f ? 'btn-primary' : 'btn-secondary'}
              style={{ padding: '0.4rem 1rem', fontSize: '0.85rem' }}
            >
              {FILTER_LABELS[f]}
            </button>
          ))}
          <button onClick={fetchStats} className="btn-secondary" style={{ padding: '0.4rem 0.75rem' }}>
            <RefreshCw size={16} />
          </button>
          <a
            href={`/api/dashboard/export?filter=${filter}`}
            download
            className="btn-secondary flex items-center gap-1.5"
            style={{ padding: '0.4rem 0.9rem', fontSize: '0.85rem', textDecoration: 'none' }}
          >
            <FileDown size={16} /> Export Excel
          </a>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="spinner" style={{ width: '2.5rem', height: '2.5rem' }} />
        </div>
      ) : (
        <>
          {/* Stats Cards */}
          <div className="grid grid-cols-2 gap-4" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
            <StatCard
              icon={<TrendingUp size={22} />}
              label={`Pendapatan ${FILTER_LABELS[filter]}`}
              value={formatCurrency(data?.periodRevenue?.total || 0)}
              sub={`${data?.periodRevenue?.count || 0} transaksi`}
              color="#6366f1"
            />
            <StatCard
              icon={<CreditCard size={22} />}
              label="Total Pendapatan"
              value={formatCurrency(data?.allTime?.total || 0)}
              sub={`${data?.allTime?.count || 0} all-time orders`}
              color="#0ea5e9"
            />
            <StatCard
              icon={<Clock size={22} />}
              label="Order Pending"
              value={data?.pendingOrders || 0}
              sub="Perlu ditangani"
              color="#f59e0b"
            />
            <StatCard
              icon={<ShoppingCart size={22} />}
              label="Menunggu Verifikasi"
              value={data?.waitingVerification || 0}
              sub="Bukti transfer masuk"
              color="#ef4444"
            />
            <StatCard
              icon={<Package size={22} />}
              label="Produk Aktif"
              value={data?.totalProducts || 0}
              sub="Tersedia di katalog"
              color="#10b981"
            />
            <StatCard
              icon={<Users size={22} />}
              label="Total Santri"
              value={data?.totalUsers || 0}
              sub="Terdaftar"
              color="#8b5cf6"
            />
          </div>

          {/* Charts */}
          <div className="grid gap-6" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))' }}>
            {/* Revenue Chart */}
            <div className="stat-card">
              <div className="flex items-center gap-2 mb-4">
                <BarChart3 size={18} style={{ color: '#6366f1' }} />
                <h3 className="font-semibold" style={{ color: '#f1f5f9' }}>Pendapatan 30 Hari Terakhir</h3>
              </div>
              {chartData.length > 0 ? (
                <ResponsiveContainer width="100%" height={220}>
                  <AreaChart data={chartData}>
                    <defs>
                      <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(51,65,85,0.5)" />
                    <XAxis dataKey="date" stroke="#64748b" tick={{ fontSize: 11 }} />
                    <YAxis stroke="#64748b" tick={{ fontSize: 11 }} tickFormatter={(v) => `${(v/1000).toFixed(0)}k`} />
                    <Tooltip
                      contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '10px' }}
                      labelStyle={{ color: '#94a3b8' }}
                      formatter={(v: any) => [formatCurrency(v), 'Pendapatan']}
                    />
                    <Area type="monotone" dataKey="revenue" stroke="#6366f1" fill="url(#colorRevenue)" strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-52" style={{ color: '#64748b' }}>Belum ada data pendapatan</div>
              )}
            </div>

            {/* Payment Method Pie */}
            <div className="stat-card">
              <div className="flex items-center gap-2 mb-4">
                <CreditCard size={18} style={{ color: '#0ea5e9' }} />
                <h3 className="font-semibold" style={{ color: '#f1f5f9' }}>Metode Pembayaran</h3>
              </div>
              {pieData.length > 0 ? (
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie data={pieData} cx="50%" cy="50%" innerRadius={60} outerRadius={90} paddingAngle={4} dataKey="value">
                      {pieData.map((_: any, index: number) => (
                        <Cell key={index} fill={index === 0 ? '#6366f1' : '#0ea5e9'} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '10px' }} />
                    <Legend wrapperStyle={{ color: '#94a3b8', fontSize: '13px' }} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-52" style={{ color: '#64748b' }}>Belum ada data transaksi</div>
              )}
            </div>
          </div>

          {/* Recent Transactions */}
          <div className="stat-card">
            <h3 className="font-semibold mb-4" style={{ color: '#f1f5f9' }}>Transaksi Terbaru — {FILTER_LABELS[filter]}</h3>
            {data?.recentTransactions?.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>No. Order</th>
                      <th>Santri</th>
                      <th>Produk</th>
                      <th>Metode</th>
                      <th>Total</th>
                      <th>Status Order</th>
                      <th>Status Bayar</th>
                      <th>Tanggal</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.recentTransactions.map((order: any) => (
                      <tr key={order.id}>
                        <td className="font-mono text-xs" style={{ color: '#6366f1' }}>{order.orderNumber}</td>
                        <td>
                          <div>
                            <p className="font-medium text-sm" style={{ color: '#f1f5f9' }}>{order.user.name}</p>
                            {order.user.nim && <p className="text-xs" style={{ color: '#64748b' }}>{order.user.nim}</p>}
                          </div>
                        </td>
                        <td style={{ color: '#94a3b8', fontSize: '0.8rem' }}>
                          {order.items.slice(0, 2).map((i: any) => i.product.name).join(', ')}
                          {order.items.length > 2 && ` +${order.items.length - 2}`}
                        </td>
                        <td>
                          <span className="badge" style={{ background: order.paymentMethod === 'TRANSFER' ? 'rgba(99,102,241,0.15)' : 'rgba(14,165,233,0.15)', color: order.paymentMethod === 'TRANSFER' ? '#6366f1' : '#0ea5e9' }}>
                            {order.paymentMethod}
                          </span>
                        </td>
                        <td className="font-semibold" style={{ color: '#f1f5f9' }}>{formatCurrency(order.totalPrice)}</td>
                        <td><OrderStatusBadge status={order.orderStatus} /></td>
                        <td><PaymentStatusBadge status={order.paymentStatus} /></td>
                        <td className="text-xs" style={{ color: '#64748b' }}>{formatShortDate(order.createdAt)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-12" style={{ color: '#64748b' }}>
                <ShoppingCart size={40} className="mx-auto mb-3 opacity-40" />
                <p>Tidak ada transaksi pada periode ini</p>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}

function StatCard({ icon, label, value, sub, color }: any) {
  return (
    <div className="stat-card">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm mb-1" style={{ color: '#64748b' }}>{label}</p>
          <p className="text-2xl font-bold" style={{ color: '#f1f5f9' }}>{value}</p>
          <p className="text-xs mt-1" style={{ color: '#64748b' }}>{sub}</p>
        </div>
        <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: `${color}20`, color }}>
          {icon}
        </div>
      </div>
    </div>
  )
}

function OrderStatusBadge({ status }: { status: string }) {
  const classMap: Record<string, string> = {
    PENDING: 'badge-pending',
    DIPROSES: 'badge-diproses',
    SELESAI: 'badge-selesai',
    DIBATALKAN: 'badge-dibatalkan',
  }
  return <span className={`badge ${classMap[status] || ''}`}>{getOrderStatusLabel(status)}</span>
}

function PaymentStatusBadge({ status }: { status: string }) {
  const classMap: Record<string, string> = {
    BELUM_BAYAR: 'badge-belum-bayar',
    MENUNGGU_VERIFIKASI: 'badge-menunggu',
    LUNAS: 'badge-lunas',
    DITOLAK: 'badge-ditolak',
  }
  return <span className={`badge ${classMap[status] || ''}`}>{getPaymentStatusLabel(status)}</span>
}
