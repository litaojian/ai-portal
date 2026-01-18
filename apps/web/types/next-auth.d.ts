import 'next-auth';

declare module 'next-auth' {
  /**
   * Extends the built-in session.user type to include the user's ID.
   */
  interface Session {
    user: {
      id: string;
    } & DefaultSession['user'];
  }

  /**
   * Extends the built-in user type.
   */
  interface User {
    id: string;
  }
}
