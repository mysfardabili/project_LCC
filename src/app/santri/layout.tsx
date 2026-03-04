import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import Sidebar from '@/components/layout/Sidebar'

export default async function SantriLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth()

  if (!session) redirect('/login')
  if (session.user.role !== 'SANTRI') redirect('/admin/dashboard')

  return (
    <div className="flex min-h-screen">
      <Sidebar role="SANTRI" userName={session.user.name} />
      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  )
}
