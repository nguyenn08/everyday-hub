import { Router } from "express";
import { db, profilesTable } from "@workspace/db";
import { UpdateProfileBody } from "@workspace/api-zod";

const router = Router();

function formatProfile(p: typeof profilesTable.$inferSelect) {
  return {
    id: p.id,
    username: p.username,
    displayName: p.displayName,
    bio: p.bio,
    avatarUrl: p.avatarUrl,
    coverUrl: p.coverUrl,
    followersCount: p.followersCount,
    followingCount: p.followingCount,
    postsCount: p.postsCount,
    location: p.location,
  };
}

async function ensureProfile() {
  const profiles = await db.select().from(profilesTable).limit(1);
  if (profiles.length > 0) return profiles[0];

  const [profile] = await db.insert(profilesTable).values({
    username: "localuser",
    displayName: "Local Explorer",
    bio: "Discovering what's happening in my city",
    avatarUrl: null,
    coverUrl: null,
    followersCount: 142,
    followingCount: 89,
    postsCount: 12,
    location: "San Francisco, CA",
  }).returning();
  return profile;
}

router.get("/profile", async (_req, res) => {
  const profile = await ensureProfile();
  return res.json(formatProfile(profile));
});

router.patch("/profile", async (req, res) => {
  const parsed = UpdateProfileBody.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error });

  const profile = await ensureProfile();

  const updates: Partial<typeof profilesTable.$inferSelect> = {};
  if (parsed.data.username !== undefined) updates.username = parsed.data.username;
  if (parsed.data.displayName !== undefined) updates.displayName = parsed.data.displayName;
  if (parsed.data.bio !== undefined) updates.bio = parsed.data.bio;
  if (parsed.data.avatarUrl !== undefined) updates.avatarUrl = parsed.data.avatarUrl;
  if (parsed.data.coverUrl !== undefined) updates.coverUrl = parsed.data.coverUrl;
  if (parsed.data.location !== undefined) updates.location = parsed.data.location;

  const { eq } = await import("drizzle-orm");
  const [updated] = await db
    .update(profilesTable)
    .set(updates)
    .where(eq(profilesTable.id, profile.id))
    .returning();
  return res.json(formatProfile(updated));
});

export default router;
