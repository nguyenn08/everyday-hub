import { pgTable, serial, integer, varchar, text, timestamp } from "drizzle-orm/pg-core";
import { postsTable } from "./posts";

export const reviewsTable = pgTable("reviews", {
  id: serial("id").primaryKey(),
  postId: integer("post_id").notNull().references(() => postsTable.id, { onDelete: "cascade" }),
  authorName: varchar("author_name", { length: 100 }).notNull().default("You"),
  rating: integer("rating").notNull(),
  body: text("body").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});
