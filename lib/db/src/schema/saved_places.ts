import { pgTable, serial, integer, timestamp } from "drizzle-orm/pg-core";
import { postsTable } from "./posts";

export const savedPlacesTable = pgTable("saved_places", {
  id: serial("id").primaryKey(),
  postId: integer("post_id").notNull().references(() => postsTable.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});
