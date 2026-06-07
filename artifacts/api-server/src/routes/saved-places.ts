import { Router } from "express";
import { db, savedPlacesTable, postsTable } from "@workspace/db";
import { eq, desc } from "drizzle-orm";
import { SavePlaceBody } from "@workspace/api-zod";

const router = Router();

function formatPost(p: typeof postsTable.$inferSelect, savedPostIds: Set<number>) {
  return {
    id: p.id,
    title: p.title,
    body: p.body,
    category: p.category,
    imageUrl: p.imageUrl,
    authorName: p.authorName,
    authorAvatar: p.authorAvatar,
    likes: p.likes,
    commentsCount: p.commentsCount,
    createdAt: p.createdAt.toISOString(),
    location: p.location,
    isBookable: p.isBookable,
    liked: p.liked,
    saved: savedPostIds.has(p.id),
    price: p.price,
    eventDate: p.eventDate ? p.eventDate.toISOString() : null,
    isFeatured: p.isFeatured,
    isTrending: p.isTrending,
    avgRating: null,
    reviewsCount: 0,
  };
}

router.get("/saved-places", async (req, res) => {
  const saved = await db
    .select()
    .from(savedPlacesTable)
    .orderBy(desc(savedPlacesTable.createdAt));

  if (saved.length === 0) return res.json([]);

  const postIds = saved.map((s) => s.postId);
  const savedSet = new Set(postIds);

  const posts = await db.select().from(postsTable);
  const postMap = new Map(posts.map((p) => [p.id, p]));

  const result = saved
    .map((s) => {
      const post = postMap.get(s.postId);
      if (!post) return null;
      return {
        id: s.id,
        postId: s.postId,
        createdAt: s.createdAt.toISOString(),
        post: formatPost(post, savedSet),
      };
    })
    .filter(Boolean);

  return res.json(result);
});

router.post("/saved-places", async (req, res) => {
  const parsed = SavePlaceBody.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error });

  const { postId } = parsed.data;

  const [post] = await db.select().from(postsTable).where(eq(postsTable.id, postId));
  if (!post) return res.status(404).json({ error: "Post not found" });

  const existing = await db
    .select()
    .from(savedPlacesTable)
    .where(eq(savedPlacesTable.postId, postId));
  if (existing.length > 0) {
    return res.status(201).json({
      id: existing[0].id,
      postId: existing[0].postId,
      createdAt: existing[0].createdAt.toISOString(),
      post: formatPost(post, new Set([postId])),
    });
  }

  const [saved] = await db.insert(savedPlacesTable).values({ postId }).returning();

  return res.status(201).json({
    id: saved.id,
    postId: saved.postId,
    createdAt: saved.createdAt.toISOString(),
    post: formatPost(post, new Set([postId])),
  });
});

router.delete("/saved-places/:postId", async (req, res) => {
  const postId = Number(req.params.postId);
  if (isNaN(postId)) return res.status(400).json({ error: "Invalid postId" });

  await db.delete(savedPlacesTable).where(eq(savedPlacesTable.postId, postId));
  return res.json({ ok: true });
});

export default router;
