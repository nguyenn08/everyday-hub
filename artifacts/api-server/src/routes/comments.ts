import { Router } from "express";
import { db, commentsTable, postsTable } from "@workspace/db";
import { eq, asc } from "drizzle-orm";
import { CreateCommentBody } from "@workspace/api-zod";

const router = Router();

function formatComment(c: typeof commentsTable.$inferSelect) {
  return {
    id: c.id,
    postId: c.postId,
    authorName: c.authorName,
    body: c.body,
    createdAt: c.createdAt.toISOString(),
  };
}

router.get("/posts/:id/comments", async (req, res) => {
  const id = Number(req.params.id);
  if (isNaN(id)) return res.status(400).json({ error: "Invalid id" });

  const comments = await db
    .select()
    .from(commentsTable)
    .where(eq(commentsTable.postId, id))
    .orderBy(asc(commentsTable.createdAt));

  return res.json(comments.map(formatComment));
});

router.post("/posts/:id/comments", async (req, res) => {
  const id = Number(req.params.id);
  if (isNaN(id)) return res.status(400).json({ error: "Invalid id" });

  const parsed = CreateCommentBody.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error });

  const [post] = await db.select().from(postsTable).where(eq(postsTable.id, id));
  if (!post) return res.status(404).json({ error: "Post not found" });

  const [comment] = await db
    .insert(commentsTable)
    .values({
      postId: id,
      authorName: parsed.data.authorName || "You",
      body: parsed.data.body,
    })
    .returning();

  await db
    .update(postsTable)
    .set({ commentsCount: post.commentsCount + 1 })
    .where(eq(postsTable.id, id));

  return res.status(201).json(formatComment(comment));
});

export default router;
