import { Request, Response, NextFunction } from "express";
import { verifyAuthToken, AuthTokenPayload } from "../utils/jwt";

// Every protected route runs this — authorization is NEVER inferred
// from the frontend alone.
declare global {
  namespace Express {
    interface Request {
      auth?: AuthTokenPayload;
    }
  }
}

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization;

  if (!header || !header.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Missing or malformed Authorization header" });
  }

  const token = header.slice("Bearer ".length);

  try {
    req.auth = verifyAuthToken(token);
    next();
  } catch {
    return res.status(401).json({ error: "Invalid or expired token" });
  }
}
