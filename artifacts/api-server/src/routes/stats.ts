import { Router } from "express";
import { db, postsTable, bookingsTable } from "@workspace/db";
import { gte, ne, count, sql } from "drizzle-orm";

const router = Router();

router.get("/stats", async (_req, res) => {
  const [{ value: totalPosts }] = await db
    .select({ value: count() })
    .from(postsTable);

  const [{ value: totalBookings }] = await db
    .select({ value: count() })
    .from(bookingsTable);

  const [{ value: upcomingBookings }] = await db
    .select({ value: count() })
    .from(bookingsTable)
    .where(
      sql`${bookingsTable.eventDate} > NOW() AND ${bookingsTable.status} != 'cancelled'`
    );

  const categoryRows = await db
    .select({
      category: postsTable.category,
      cnt: count(),
    })
    .from(postsTable)
    .groupBy(postsTable.category);

  const categoryCounts: Record<string, number> = {};
  for (const row of categoryRows) {
    categoryCounts[row.category] = Number(row.cnt);
  }

  return res.json({
    totalPosts: Number(totalPosts),
    totalBookings: Number(totalBookings),
    upcomingBookings: Number(upcomingBookings),
    categoryCounts,
  });
});

export default router;
