import type { NextAuthConfig } from "next-auth";

// Edge-safe subset of the auth config, used by middleware. No providers here:
// the Nodemailer provider pulls in Node core modules (`stream`, etc.) that
// can't run in the Edge runtime middleware executes in.
export const authConfig = {
  trustHost: true,
  providers: [],
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  callbacks: {
    authorized({ auth }) {
      return !!auth?.user;
    },
    async jwt({ token, user }) {
      if (user) token.sub = user.id;
      return token;
    },
    async session({ session, token }) {
      if (session.user && token.sub) session.user.id = token.sub;
      return session;
    },
  },
  pages: {
    signIn: "/login",
    verifyRequest: "/verify-request",
  },
} satisfies NextAuthConfig;
