import { userRoleEnum } from '@/db/schema';
import type { DefaultSession } from 'next-auth';

type UserRole = (typeof userRoleEnum.enumValues)[number];

declare module 'next-auth' {
  interface User {
    id: string;
    role: UserRole;
  }

  interface Session {
    user: {
      id: string;
      role: UserRole;
    } & DefaultSession['user'];
  }
}

// Augment @auth/core/jwt (re-exported by next-auth/jwt): the session callback's
// `token` is typed against this module, so augmenting `next-auth/jwt` alone does
// not reach it.
declare module '@auth/core/jwt' {
  interface JWT {
    id: string;
    role: UserRole;
  }
}
