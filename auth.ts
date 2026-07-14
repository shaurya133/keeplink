import NextAuth from "next-auth";
import Nodemailer from "next-auth/providers/nodemailer";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/lib/prisma";
import { sendMagicLinkEmail } from "@/lib/mailer";
import { authConfig } from "@/auth.config";

export const { handlers, signIn, signOut, auth } = NextAuth({
  ...authConfig,
  adapter: PrismaAdapter(prisma),
  providers: [
    Nodemailer({
      from: process.env.EMAIL_FROM ?? "onboarding@resend.dev",
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
