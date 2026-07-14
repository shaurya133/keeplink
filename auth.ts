import NextAuth from "next-auth";
import Nodemailer from "next-auth/providers/nodemailer";
import Credentials from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import type { Adapter } from "next-auth/adapters";
import { prisma } from "@/lib/prisma";
import { sendMagicLinkEmail } from "@/lib/mailer";
import { authConfig } from "@/auth.config";
import { MAGIC_LINK_MAX_AGE_SECONDS } from "@/lib/magic-link";
import { verifyOtp } from "@/lib/otp";
import { z } from "zod";

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
      server: { host: "localhost", port: 25 },
      sendVerificationRequest: async ({ identifier, url }) => {
        await sendMagicLinkEmail(identifier, url);
      },
    }),
    Credentials({
      credentials: { email: {}, code: {} },
      async authorize(raw) {
        const parsed = z
          .object({ email: z.string().email(), code: z.string().length(6) })
          .safeParse(raw);
        if (!parsed.success) return null;

        const { email, code } = parsed.data;
        const valid = await verifyOtp(email, code);
        if (!valid) return null;

        let user = await prisma.user.findUnique({ where: { email } });
        if (!user) {
          user = await prisma.user.create({
            data: { email, emailVerified: new Date() },
          });
        } else if (!user.emailVerified) {
          await prisma.user.update({
            where: { id: user.id },
            data: { emailVerified: new Date() },
          });
        }

        return { id: user.id, email: user.email };
      },
    }),
  ],
});
