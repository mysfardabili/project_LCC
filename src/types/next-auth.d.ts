import NextAuth from 'next-auth'
import { auth } from '@/lib/auth'

declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      name: string
      email: string
      role: string
      nim: string | null
    }
  }

  interface User {
    id: string
    name: string
    email: string
    role: string
    nim: string | null
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string
    role: string
    nim: string | null
  }
}
