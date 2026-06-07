import { pgTable, serial, varchar, integer, boolean, timestamp } from "drizzle-orm/pg-core";

export const paymentMethodsTable = pgTable("payment_methods", {
  id: serial("id").primaryKey(),
  cardLabel: varchar("card_label", { length: 100 }),
  cardLast4: varchar("card_last4", { length: 4 }).notNull(),
  cardBrand: varchar("card_brand", { length: 20 }).notNull().default("Visa"),
  expiryMonth: integer("expiry_month").notNull(),
  expiryYear: integer("expiry_year").notNull(),
  isDefault: boolean("is_default").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});
