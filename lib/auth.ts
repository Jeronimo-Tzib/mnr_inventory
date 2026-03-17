import { SignJWT, jwtVerify } from "jose"

const getJwtSecretKey = () => {
  const secret = process.env.JWT_SECRET
  if (!secret || secret.length === 0) {
    // For development fallback if not set. In production this should throw!
    return "super-secret-fallback-key-for-development"
  }
  return secret
}

export const verifyAuth = async (token: string) => {
  try {
    const verified = await jwtVerify(token, new TextEncoder().encode(getJwtSecretKey()))
    return verified.payload as { id: string; username: string; role: string; exp: number }
  } catch (error) {
    throw new Error("Your token has expired or is invalid.")
  }
}

export const signToken = async (payload: { id: string; username: string; role: string }) => {
  return await new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("24h")
    .sign(new TextEncoder().encode(getJwtSecretKey()))
}
