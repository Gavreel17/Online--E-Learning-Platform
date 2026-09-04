import { getAuth } from "@clerk/express";
import type { NextFunction, Request, Response } from "express";
import { eq } from "drizzle-orm";
import { db } from "@workspace/db";
import {
  platformUsersTable,
  type PlatformUser,
} from "@workspace/db";

export type AuthenticatedRequest = Request & {
  userId: string;
  platformUser: PlatformUser;
};

async function upsertPlatformUser(req: Request): Promise<PlatformUser | null> {
  const auth = getAuth(req);
  const clerkUserId = auth.userId;
  if (!clerkUserId) return null;

  const existing = await db
    .select()
    .from(platformUsersTable)
    .where(eq(platformUsersTable.clerkUserId, clerkUserId))
    .limit(1);
  if (existing[0]) return existing[0];

  const claims = (auth.sessionClaims ?? {}) as Record<string, unknown>;
  const email =
    typeof claims.email === "string"
      ? claims.email
      : `${clerkUserId}@learnspace.local`;
  const fullName =
    typeof claims.name === "string" && claims.name.trim()
      ? claims.name
      : "New learner";

  const inserted = await db
    .insert(platformUsersTable)
    .values({
      clerkUserId,
      email,
      fullName,
      role: "student",
      status: "active",
    })
    .onConflictDoNothing({ target: platformUsersTable.clerkUserId })
    .returning();
  return inserted[0] ?? null;
}

export async function requireAuth(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const auth = getAuth(req);
    if (!auth.userId) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }
    const platformUser = await upsertPlatformUser(req);
    if (!platformUser) {
      res.status(401).json({ error: "Unable to establish account" });
      return;
    }
    const authenticated = req as AuthenticatedRequest;
    authenticated.userId = auth.userId;
    authenticated.platformUser = platformUser;
    next();
  } catch (error) {
    req.log.error({ err: error }, "Authentication lookup failed");
    res.status(500).json({ error: "Authentication service unavailable" });
  }
}

export async function requireAdmin(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  await requireAuth(req, res, () => {
    const authenticated = req as AuthenticatedRequest;
    if (authenticated.platformUser.role !== "admin") {
      res.status(403).json({ error: "Admin access required" });
      return;
    }
    next();
  });
}