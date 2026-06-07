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


const CATEGORY_IMAGES: Record<string, string[]> = {
  Food: ["https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&h=600&fit=crop&auto=format","https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=800&h=600&fit=crop&auto=format","https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800&h=600&fit=crop&auto=format","https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800&h=600&fit=crop&auto=format","https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=800&h=600&fit=crop&auto=format","https://images.unsplash.com/photo-1498579150354-977475b7ea0b?w=800&h=600&fit=crop&auto=format"],
  Nightlife: ["https://images.unsplash.com/photo-1470337458703-46ad1756a187?w=800&h=600&fit=crop&auto=format","https://images.unsplash.com/photo-1516997121675-4c2d1684aa3e?w=800&h=600&fit=crop&auto=format","https://images.unsplash.com/photo-1575444758702-4a6b9222336e?w=800&h=600&fit=crop&auto=format","https://images.unsplash.com/photo-1559818488-89c85b8b60bc?w=800&h=600&fit=crop&auto=format"],
  Barbershop: ["https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=800&h=600&fit=crop&auto=format","https://images.unsplash.com/photo-1622286342621-4bd78ef4da25?w=800&h=600&fit=crop&auto=format","https://images.unsplash.com/photo-1621605815971-fbc98d665033?w=800&h=600&fit=crop&auto=format","https://images.unsplash.com/photo-1599351431202-1a0f3267b0a9?w=800&h=600&fit=crop&auto=format"],
  Beauty: ["https://images.unsplash.com/photo-1560066984-138dadb4c035?w=800&h=600&fit=crop&auto=format","https://images.unsplash.com/photo-1522338242992-e1a54906a8da?w=800&h=600&fit=crop&auto=format","https://images.unsplash.com/photo-1487412947147-5cebf100d293?w=800&h=600&fit=crop&auto=format","https://images.unsplash.com/photo-1562322140-8baeececf3df?w=800&h=600&fit=crop&auto=format"],
  Fitness: ["https://images.unsplash.com/photo-1571902943202-507ec2618e8f?w=800&h=600&fit=crop&auto=format","https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=800&h=600&fit=crop&auto=format","https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=800&h=600&fit=crop&auto=format","https://images.unsplash.com/photo-1540497077202-7c8a3999166f?w=800&h=600&fit=crop&auto=format"],
  Wellness: ["https://images.unsplash.com/photo-1600334089648-b0d9d3028eb2?w=800&h=600&fit=crop&auto=format","https://images.unsplash.com/photo-1545205597-3d9d02c29597?w=800&h=600&fit=crop&auto=format","https://images.unsplash.com/photo-1519823551278-64ac92734fb1?w=800&h=600&fit=crop&auto=format","https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=800&h=600&fit=crop&auto=format"],
  Sports: ["https://images.unsplash.com/photo-1546519638-68e109498ffc?w=800&h=600&fit=crop&auto=format","https://images.unsplash.com/photo-1566577739112-5180d4bf9390?w=800&h=600&fit=crop&auto=format","https://images.unsplash.com/photo-1508098682722-e99c643e7f0b?w=800&h=600&fit=crop&auto=format","https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=800&h=600&fit=crop&auto=format"],
  Arts: ["https://images.unsplash.com/photo-1561214115-f2f134cc4912?w=800&h=600&fit=crop&auto=format","https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?w=800&h=600&fit=crop&auto=format","https://images.unsplash.com/photo-1531913764164-f85c52e6e654?w=800&h=600&fit=crop&auto=format"],
  Music: ["https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=800&h=600&fit=crop&auto=format","https://images.unsplash.com/photo-1429962714451-bb934ecdc4ec?w=800&h=600&fit=crop&auto=format","https://images.unsplash.com/photo-1501386761578-eac5c94b800a?w=800&h=600&fit=crop&auto=format","https://images.unsplash.com/photo-1524368535928-5b5e00ddc76b?w=800&h=600&fit=crop&auto=format"],
  Events: ["https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?w=800&h=600&fit=crop&auto=format","https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=800&h=600&fit=crop&auto=format","https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&h=600&fit=crop&auto=format"],
  News: ["https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=800&h=600&fit=crop&auto=format","https://images.unsplash.com/photo-1495020689067-958852a7765e?w=800&h=600&fit=crop&auto=format"],
};

function getCategoryImage(category: string, id: number): string | null {
  const imgs = CATEGORY_IMAGES[category];
  if (!imgs || imgs.length === 0) return null;
  return imgs[id % imgs.length];
}

function formatPost(p: typeof postsTable.$inferSelect) {
  return {
    id: p.id,
    title: p.title,
    body: p.body,
    category: p.category,
    imageUrl: (p.imageUrl && !p.imageUrl.includes('picsum.photos')) ? p.imageUrl : getCategoryImage(p.category, p.id),
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
