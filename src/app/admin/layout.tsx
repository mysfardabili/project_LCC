import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import Sidebar from '@/components/layout/Sidebar'

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth()

  if (!session) redirect('/login')
  if (session.user.role !== 'ADMIN') redirect('/santri/catalog')

  return (
    <div className="flex min-h-screen">
      <Sidebar role="ADMIN" userName={session.user.name} />
      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  )
}
