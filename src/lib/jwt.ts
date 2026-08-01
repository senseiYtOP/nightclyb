import jwt from "jsonwebtoken";

const SECRET = process.env.JWT_SECRET || "development-secret-key";

interface JWTPayload {
  [key: string]: unknown;
}

export function jwtSign(payload: JWTPayload): string {
  return jwt.sign(payload, SECRET, { algorithm: "HS256" });
}

export function jwtVerify(token: string): JWTPayload {
  return jwt.verify(token, SECRET, { algorithms: ["HS256"] }) as JWTPayload;
}

export function jwtDecode(token: string): JWTPayload | null {
  try {
    return jwt.decode(token) as JWTPayload | null;
  } catch {
    return null;
  }
}
