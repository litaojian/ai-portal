import type { NextAuthConfig } from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import bcryptjs from 'bcryptjs';

// Pre-hashed password for "password123"
const hashedPassword =
  '$2a$10$wGr/O/a3.FwSUd3.c.hDve.aJ.8P.v.2s.3.j1f.S.x/U6w.g4j.K';

const demoUser = {
  id: '1',
  email: 'user@example.com',
  password: hashedPassword,
  name: 'Demo User',
};

export const authConfig = {
  providers: [
    Credentials({
      async authorize(credentials) {
        if (
          typeof credentials.email === 'string' &&
          typeof credentials.password === 'string' &&
          credentials.email === demoUser.email
        ) {
          const isPasswordCorrect = await bcryptjs.compare(
            credentials.password,
            demoUser.password
          );

          if (isPasswordCorrect) {
            const { password, ...userWithoutPassword } = demoUser;
            return userWithoutPassword;
          }
        }
        return null;
      },
    }),
  ],
  pages: {
    signIn: '/auth/login',
  },
  callbacks: {},
} satisfies NextAuthConfig;