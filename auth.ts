import NextAuth from "next-auth";
import Nodemailer from "next-auth/providers/nodemailer";
import { PrismaAdapter } from "@auth/prisma-adapter";
import type { Adapter } from "next-auth/adapters";
import { prisma } from "@/lib/prisma";
import { sendMagicLinkEmail } from "@/lib/mailer";
import { authConfig } from "@/auth.config";
import { MAGIC_LINK_MAX_AGE_SECONDS } from "@/lib/magic-link";

const prismaAdapter = PrismaAdapter(prisma);

// Some mail gateways (e.g. NYU's) pre-fetch links in email bodies to scan
// them for malware, which burns a single-use token before the real user ever
// clicks it. Instead of deleting the token on first read, only delete it once
// it's actually expired, so the user's own click still works within the
// 24h window.
const adapter: Adapter = {
  ...prismaAdapter,
  async useVerificationToken(params) {
    const token = await prisma.verificationToken.findUnique({
      where: { identifier_token: params },
    });
    if (!token) return null;

    if (token.expires < new Date()) {
      await prisma.verificationToken
        .delete({ where: { identifier_token: params } })
        .catch(() => {});
      return null;
    }

    return token;
  },
};

export const { handlers, signIn, signOut, auth } = NextAuth({
  ...authConfig,
  adapter,
  providers: [
    Nodemailer({
      from: process.env.EMAIL_FROM ?? "onboarding@resend.dev",
      maxAge: MAGIC_LINK_MAX_AGE_SECONDS,
      // Never actually used for sending: sendVerificationRequest below sends
      // via the Resend API instead, but the provider requires a `server`
      // value to be present at config time regardless.
      server: { host: "localhost", port: 25 },
      sendVerificationRequest: async ({ identifier, url }) => {
        await sendMagicLinkEmail(identifier, url);
      },
    }),
  ],
});
