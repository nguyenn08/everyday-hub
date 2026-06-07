import { Router } from "express";
import { db, postsTable } from "@workspace/db";
import { eq, desc, sql } from "drizzle-orm";
import {
  ListPostsQueryParams,
  CreatePostBody,
  GetPostParams,
  TogglePostLikeParams,
} from "@workspace/api-zod";

const router = Router();

function formatPost(p: typeof postsTable.$inferSelect) {
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
    location: p.location,
    isBookable: p.isBookable,
    liked: p.liked,
    price: p.price,
    eventDate: p.eventDate?.toISOString() ?? null,
    isFeatured: p.isFeatured,
    isTrending: p.isTrending,
    createdAt: p.createdAt.toISOString(),
  };
}

router.get("/posts", async (req, res) => {
  const parsed = ListPostsQueryParams.safeParse(req.query);
  const category = parsed.success ? parsed.data.category : undefined;
  const limit = parsed.success ? (parsed.data.limit ?? 30) : 30;

  let query = db.select().from(postsTable).orderBy(desc(postsTable.createdAt)).limit(limit);

  if (category && category !== "All") {
    const posts = await db
      .select()
      .from(postsTable)
      .where(eq(postsTable.category, category))
      .orderBy(desc(postsTable.createdAt))
      .limit(limit);
    return res.json(posts.map(formatPost));
  }

  const posts = await query;
  return res.json(posts.map(formatPost));
});

router.get("/posts/trending", async (_req, res) => {
  const posts = await db
    .select()
    .from(postsTable)
    .where(eq(postsTable.isTrending, true))
    .orderBy(desc(postsTable.likes))
    .limit(10);
  return res.json(posts.map(formatPost));
});

router.get("/posts/featured", async (_req, res) => {
  const posts = await db
    .select()
    .from(postsTable)
    .where(eq(postsTable.isFeatured, true))
    .orderBy(desc(postsTable.createdAt))
    .limit(5);
  return res.json(posts.map(formatPost));
});

router.get("/posts/:id", async (req, res) => {
  const parsed = GetPostParams.safeParse({ id: Number(req.params.id) });
  if (!parsed.success) return res.status(400).json({ error: "Invalid id" });

  const [post] = await db
    .select()
    .from(postsTable)
    .where(eq(postsTable.id, parsed.data.id));
  if (!post) return res.status(404).json({ error: "Not found" });
  return res.json(formatPost(post));
});

router.patch("/posts/:id/like", async (req, res) => {
  const parsed = TogglePostLikeParams.safeParse({ id: Number(req.params.id) });
  if (!parsed.success) return res.status(400).json({ error: "Invalid id" });

  const [post] = await db
    .select()
    .from(postsTable)
    .where(eq(postsTable.id, parsed.data.id));
  if (!post) return res.status(404).json({ error: "Not found" });

  const [updated] = await db
    .update(postsTable)
    .set({
      liked: !post.liked,
      likes: post.liked ? post.likes - 1 : post.likes + 1,
    })
    .where(eq(postsTable.id, parsed.data.id))
    .returning();
  return res.json(formatPost(updated));
});

router.post("/posts", async (req, res) => {
  const parsed = CreatePostBody.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error });

  const [post] = await db.insert(postsTable).values({
    title: parsed.data.title,
    body: parsed.data.body,
    category: parsed.data.category,
    imageUrl: parsed.data.imageUrl,
    location: parsed.data.location,
    isBookable: parsed.data.isBookable,
    price: parsed.data.price,
    eventDate: parsed.data.eventDate ? new Date(parsed.data.eventDate) : undefined,
    authorName: "You",
    authorAvatar: null,
    likes: 0,
    commentsCount: 0,
    liked: false,
    isFeatured: false,
    isTrending: false,
  }).returning();
  return res.status(201).json(formatPost(post));
});

export default router;
