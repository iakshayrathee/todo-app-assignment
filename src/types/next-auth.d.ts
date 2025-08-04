import { DefaultSession, DefaultUser } from 'next-auth'
import { DefaultJWT } from 'next-auth/jwt'

declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      email: string
      name: string | null
      role: string
      approved: boolean
    } & DefaultSession['user']
  }

  interface User extends DefaultUser {
    id: string
    email: string
    name: string | null
    role: string
    approved: boolean
  }
}

declare module 'next-auth/jwt' {
  interface JWT extends DefaultJWT {
    id: string
    name: string | null
    role: string
    approved: boolean
  }
}
