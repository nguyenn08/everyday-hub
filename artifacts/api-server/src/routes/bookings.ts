import { Router } from "express";
import { db, bookingsTable, postsTable } from "@workspace/db";
import { eq, desc } from "drizzle-orm";
import { CreateBookingBody, CancelBookingParams } from "@workspace/api-zod";

const router = Router();

function formatBooking(b: typeof bookingsTable.$inferSelect) {
  return {
    id: b.id,
    postId: b.postId,
    postTitle: b.postTitle,
    postImageUrl: b.postImageUrl,
    location: b.location,
    eventDate: b.eventDate.toISOString(),
    status: b.status,
    price: b.price,
    category: b.category,
    createdAt: b.createdAt.toISOString(),
  };
}

router.get("/bookings", async (_req, res) => {
  const bookings = await db
    .select()
    .from(bookingsTable)
    .orderBy(desc(bookingsTable.eventDate));
  return res.json(bookings.map(formatBooking));
});

router.post("/bookings", async (req, res) => {
  const parsed = CreateBookingBody.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error });

  const [post] = await db
    .select()
    .from(postsTable)
    .where(eq(postsTable.id, parsed.data.postId));
  if (!post) return res.status(404).json({ error: "Post not found" });
  if (!post.isBookable) return res.status(400).json({ error: "Post is not bookable" });

  const eventDate = post.eventDate ?? new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  const [booking] = await db.insert(bookingsTable).values({
    postId: post.id,
    postTitle: post.title,
    postImageUrl: post.imageUrl,
    location: post.location,
    eventDate,
    status: "confirmed",
    price: post.price,
    category: post.category,
  }).returning();

  return res.status(201).json(formatBooking(booking));
});

router.delete("/bookings/:id", async (req, res) => {
  const parsed = CancelBookingParams.safeParse({ id: Number(req.params.id) });
  if (!parsed.success) return res.status(400).json({ error: "Invalid id" });

  const [existing] = await db
    .select()
    .from(bookingsTable)
    .where(eq(bookingsTable.id, parsed.data.id));
  if (!existing) return res.status(404).json({ error: "Not found" });

  const [updated] = await db
    .update(bookingsTable)
    .set({ status: "cancelled" })
    .where(eq(bookingsTable.id, parsed.data.id))
    .returning();

  return res.json(formatBooking(updated));
});

export default router;
