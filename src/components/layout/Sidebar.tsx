'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { signOut } from 'next-auth/react'
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Users,
  LogOut,
  ChevronRight,
  Settings,
  UserCircle,
} from 'lucide-react'

const adminLinks = [
  { href: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/admin/products', label: 'Produk & Paket', icon: Package },
  { href: '/admin/orders', label: 'Manajemen Order', icon: ShoppingCart },
  { href: '/admin/users', label: 'Data Santri', icon: Users },
  { href: '/admin/settings', label: 'Pengaturan', icon: Settings },
]

const santriLinks = [
  { href: '/santri/catalog', label: 'Katalog Produk', icon: Package },
  { href: '/santri/orders', label: 'Riwayat Order', icon: ShoppingCart },
  { href: '/santri/profile', label: 'Profil Saya', icon: UserCircle },
]

interface SidebarProps {
  role: 'ADMIN' | 'SANTRI'
  userName: string
}

export default function Sidebar({ role, userName }: SidebarProps) {
  const pathname = usePathname()
  const links = role === 'ADMIN' ? adminLinks : santriLinks

  return (
    <aside
      className="w-64 h-screen sticky top-0 flex flex-col"
      style={{
        background: 'rgba(15, 23, 42, 0.98)',
        borderRight: '1px solid rgba(51, 65, 85, 0.6)',
        flexShrink: 0,
        overflowY: 'auto',
      }}
    >
      {/* Logo */}
      <div className="p-6 border-b" style={{ borderColor: 'rgba(51, 65, 85, 0.6)' }}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl overflow-hidden flex-shrink-0" style={{ background: 'linear-gradient(135deg, #6366f1, #4f46e5)' }}>
            <img src="/logo.png" alt="LQ Center" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          </div>
          <div>
            <p className="font-bold text-sm" style={{ color: '#f1f5f9' }}>LCC</p>
            <p className="text-xs" style={{ color: '#64748b' }}>
              {role === 'ADMIN' ? 'Admin Panel' : 'Portal Santri'}
            </p>
          </div>
        </div>
      </div>

      {/* User info */}
      <div className="px-4 py-3 mx-3 mt-3 rounded-xl" style={{ background: 'rgba(99, 102, 241, 0.1)', border: '1px solid rgba(99, 102, 241, 0.2)' }}>
        <div className="flex items-center gap-2">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm flex-shrink-0"
            style={{ background: 'linear-gradient(135deg, #6366f1, #4f46e5)', color: 'white' }}
          >
            {userName.charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold truncate" style={{ color: '#f1f5f9' }}>{userName}</p>
            <p className="text-xs" style={{ color: '#6366f1' }}>
              {role === 'ADMIN' ? '👑 Administrator' : '📚 Santri'}
            </p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        <p className="text-xs font-semibold px-3 mb-2" style={{ color: '#475569', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
          Menu
        </p>
        {links.map(({ href, label, icon: Icon }) => {
          const isActive = pathname === href || pathname.startsWith(href + '/')
          return (
            <Link
              key={href}
              href={href}
              className={`sidebar-link ${isActive ? 'active' : ''}`}
            >
              <Icon size={18} />
              <span className="flex-1">{label}</span>
              {isActive && <ChevronRight size={14} style={{ color: '#6366f1' }} />}
            </Link>
          )
        })}
      </nav>

      {/* Logout — always at bottom */}
      <div className="p-3 border-t mt-auto" style={{ borderColor: 'rgba(51, 65, 85, 0.6)', flexShrink: 0 }}>
        <button
          onClick={() => signOut({ callbackUrl: '/login' })}
          className="sidebar-link w-full"
          style={{ color: '#ef4444' }}
        >
          <LogOut size={18} />
          <span>Keluar</span>
        </button>
      </div>
    </aside>
  )
}
