import { decode, encode } from "next-auth/jwt";

export const MOBILE_JWT_SALT = "keeplink-mobile";

export async function getUserFromBearer(
  request: Request
): Promise<{ id: string } | null> {
  const authHeader = request.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) return null;
  const token = authHeader.slice(7);
  try {
    const decoded = await decode({
      token,
      secret: process.env.AUTH_SECRET!,
      salt: MOBILE_JWT_SALT,
    });
    if (!decoded?.sub) return null;
    return { id: decoded.sub };
  } catch {
    return null;
  }
}

export async function signMobileToken(userId: string): Promise<string> {
  return encode({
    token: { sub: userId },
    secret: process.env.AUTH_SECRET!,
    salt: MOBILE_JWT_SALT,
    maxAge: 30 * 24 * 60 * 60,
  });
}

export function mobileCorsHeaders() {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, PATCH, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
  };
}
