import NextAuth from 'next-auth'
import GoogleProvider from 'next-auth/providers/google'
import { PrismaAdapter } from '@auth/prisma-adapter'
import { prisma } from './prisma'

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  callbacks: {
    session: async ({ session, user }) => {
      console.log('Session callback triggered:', { 
        userId: user?.id, 
        sessionEmail: session?.user?.email,
        userImage: user?.image,
        sessionImage: session?.user?.image
      })
      if (session?.user && user?.id) {
        session.user.id = user.id
        // Ensure the image from the database is included in the session
        if (user.image) {
          session.user.image = user.image
        }
      }
      console.log('Session callback returning:', {
        hasImage: !!session?.user?.image,
        image: session?.user?.image
      })
      return session
    },
    signIn: async ({ user, account, profile }) => {
      console.log('SignIn callback triggered:', { 
        provider: account?.provider, 
        email: user.email, 
        profilePicture: profile?.picture 
      })
      
      // Let NextAuth handle user creation via adapter
      // Just ensure we have the profile image in the user object
      if (account?.provider === 'google' && profile?.picture) {
        user.image = profile.picture
        user.name = profile.name || user.name
      }
      
      return true
    },
  },
  session: {
    strategy: 'database',
  },
})

