import NextAuth from "next-auth";
import { authConfig } from "@/auth.config";

export const { auth: middleware } = NextAuth(authConfig);

export const config = {
  matcher: [
    "/((?!api/auth|api/links|api/tags|api/chat|api/account|login|verify-request|privacy|_next/static|_next/image|favicon.ico).*)",
  ],
};
