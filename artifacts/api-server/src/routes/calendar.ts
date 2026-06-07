import { Router } from "express";
import { db, bookingsTable } from "@workspace/db";
import { desc, gte, lte, and, ne } from "drizzle-orm";
import { GetCalendarEventsQueryParams } from "@workspace/api-zod";

const router = Router();

router.get("/calendar/events", async (req, res) => {
  const parsed = GetCalendarEventsQueryParams.safeParse(req.query);
  const from = parsed.success && parsed.data.from ? new Date(parsed.data.from) : undefined;
  const to = parsed.success && parsed.data.to ? new Date(parsed.data.to) : undefined;

  let query = db
    .select()
    .from(bookingsTable)
    .orderBy(desc(bookingsTable.eventDate));

  const conditions = [ne(bookingsTable.status, "cancelled")];
  if (from) conditions.push(gte(bookingsTable.eventDate, from));
  if (to) conditions.push(lte(bookingsTable.eventDate, to));

  const bookings = await db
    .select()
    .from(bookingsTable)
    .where(and(...conditions))
    .orderBy(bookingsTable.eventDate);

  const events = bookings.map((b) => ({
    id: b.id,
    title: b.postTitle,
    date: b.eventDate.toISOString(),
    type: "booking",
    location: b.location,
    category: b.category,
    bookingId: b.id,
    price: b.price,
  }));

  return res.json(events);
});

export default router;
