import { Router } from "express";
import { db, reviewsTable, postsTable } from "@workspace/db";
import { eq, desc, avg, count } from "drizzle-orm";
import { CreateReviewBody } from "@workspace/api-zod";

const router = Router();

function formatReview(r: typeof reviewsTable.$inferSelect) {
  return {
    id: r.id,
    postId: r.postId,
    authorName: r.authorName,
    rating: r.rating,
    body: r.body,
    createdAt: r.createdAt.toISOString(),
  };
}

router.get("/posts/:id/reviews", async (req, res) => {
  const id = Number(req.params.id);
  if (isNaN(id)) return res.status(400).json({ error: "Invalid id" });

  const reviews = await db
    .select()
    .from(reviewsTable)
    .where(eq(reviewsTable.postId, id))
    .orderBy(desc(reviewsTable.createdAt));

  return res.json(reviews.map(formatReview));
});

router.post("/posts/:id/reviews", async (req, res) => {
  const id = Number(req.params.id);
  if (isNaN(id)) return res.status(400).json({ error: "Invalid id" });

  const parsed = CreateReviewBody.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error });

  const [post] = await db.select().from(postsTable).where(eq(postsTable.id, id));
  if (!post) return res.status(404).json({ error: "Post not found" });

  const { rating, body, authorName } = parsed.data;

  if (rating < 1 || rating > 5) {
    return res.status(400).json({ error: "Rating must be 1-5" });
  }

  const [review] = await db
    .insert(reviewsTable)
    .values({ postId: id, rating, body, authorName: authorName || "You" })
    .returning();

  return res.status(201).json(formatReview(review));
});

export default router;
