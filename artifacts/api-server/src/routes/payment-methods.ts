import { Router } from "express";
import { db, paymentMethodsTable } from "@workspace/db";
import { eq, desc } from "drizzle-orm";
import { AddPaymentMethodBody } from "@workspace/api-zod";

const router = Router();

function format(p: typeof paymentMethodsTable.$inferSelect) {
  return {
    id: p.id,
    cardLabel: p.cardLabel,
    cardLast4: p.cardLast4,
    cardBrand: p.cardBrand,
    expiryMonth: p.expiryMonth,
    expiryYear: p.expiryYear,
    isDefault: p.isDefault,
    createdAt: p.createdAt.toISOString(),
  };
}

router.get("/payment-methods", async (_req, res) => {
  const methods = await db
    .select()
    .from(paymentMethodsTable)
    .orderBy(desc(paymentMethodsTable.isDefault), desc(paymentMethodsTable.createdAt));
  return res.json(methods.map(format));
});

router.post("/payment-methods", async (req, res) => {
  const parsed = AddPaymentMethodBody.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error });

  const { cardLabel, cardLast4, cardBrand, expiryMonth, expiryYear } = parsed.data;

  const existing = await db.select().from(paymentMethodsTable);
  const isFirst = existing.length === 0;

  const [method] = await db
    .insert(paymentMethodsTable)
    .values({ cardLabel, cardLast4, cardBrand, expiryMonth, expiryYear, isDefault: isFirst })
    .returning();

  return res.status(201).json(format(method));
});

router.delete("/payment-methods/:id", async (req, res) => {
  const id = Number(req.params.id);
  if (isNaN(id)) return res.status(400).json({ error: "Invalid id" });

  const [deleted] = await db
    .delete(paymentMethodsTable)
    .where(eq(paymentMethodsTable.id, id))
    .returning();

  if (deleted?.isDefault) {
    const remaining = await db
      .select()
      .from(paymentMethodsTable)
      .orderBy(desc(paymentMethodsTable.createdAt))
      .limit(1);
    if (remaining.length > 0) {
      await db
        .update(paymentMethodsTable)
        .set({ isDefault: true })
        .where(eq(paymentMethodsTable.id, remaining[0].id));
    }
  }

  return res.json({ ok: true });
});

router.patch("/payment-methods/:id/default", async (req, res) => {
  const id = Number(req.params.id);
  if (isNaN(id)) return res.status(400).json({ error: "Invalid id" });

  await db.update(paymentMethodsTable).set({ isDefault: false });
  const [method] = await db
    .update(paymentMethodsTable)
    .set({ isDefault: true })
    .where(eq(paymentMethodsTable.id, id))
    .returning();

  if (!method) return res.status(404).json({ error: "Not found" });
  return res.json(format(method));
});

export default router;
