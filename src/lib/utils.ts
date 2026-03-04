import { type ClassValue, clsx } from 'clsx'

export function cn(...inputs: ClassValue[]) {
  return inputs.filter(Boolean).join(' ')
}

export function formatCurrency(amount: number | string): string {
  const num = typeof amount === 'string' ? parseFloat(amount) : amount
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(num)
}

export function formatDate(date: Date | string): string {
  return new Intl.DateTimeFormat('id-ID', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(date))
}

export function formatShortDate(date: Date | string): string {
  return new Intl.DateTimeFormat('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(date))
}

export function generateOrderNumber(): string {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  const rand = Math.floor(Math.random() * 9999).toString().padStart(4, '0')
  return `LQC-${year}${month}${day}-${rand}`
}

export function getOrderStatusColor(status: string): string {
  const colors: Record<string, string> = {
    PENDING: 'bg-yellow-100 text-yellow-800',
    DIPROSES: 'bg-blue-100 text-blue-800',
    SELESAI: 'bg-green-100 text-green-800',
    DIBATALKAN: 'bg-red-100 text-red-800',
  }
  return colors[status] || 'bg-gray-100 text-gray-800'
}

export function getPaymentStatusColor(status: string): string {
  const colors: Record<string, string> = {
    BELUM_BAYAR: 'bg-gray-100 text-gray-800',
    MENUNGGU_VERIFIKASI: 'bg-orange-100 text-orange-800',
    LUNAS: 'bg-green-100 text-green-800',
    DITOLAK: 'bg-red-100 text-red-800',
  }
  return colors[status] || 'bg-gray-100 text-gray-800'
}

export function getOrderStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    PENDING: 'Pending',
    DIPROSES: 'Diproses',
    SELESAI: 'Selesai',
    DIBATALKAN: 'Dibatalkan',
  }
  return labels[status] || status
}

export function getPaymentStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    BELUM_BAYAR: 'Belum Bayar',
    MENUNGGU_VERIFIKASI: 'Menunggu Verifikasi',
    LUNAS: 'Lunas',
    DITOLAK: 'Ditolak',
  }
  return labels[status] || status
}

export function getProductTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    KITAB: 'Kitab',
    PAKET: 'Paket',
    ALAT_TULIS: 'Alat Tulis',
    LAYANAN: 'Layanan',
  }
  return labels[type] || type
}
