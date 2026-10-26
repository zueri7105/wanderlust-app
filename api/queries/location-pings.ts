import { and, desc, eq, lt, type SQL } from "drizzle-orm";
import { getDb } from "./connection";
import { locationPings, type InsertLocationPing, type LocationPing } from "@db/schema";

export async function insertLocationPing(
  values: InsertLocationPing,
): Promise<LocationPing | null> {
  const db = getDb();
  const [id] = await db.insert(locationPings).values(values).$returningId();
  if (!id) return null;
  const row = await db.query.locationPings.findFirst({
    where: eq(locationPings.id, id.id),
  });
  return row ?? null;
}

export async function findPingsByUser(
  userId: number,
  opts: { limit: number; before?: Date },
): Promise<LocationPing[]> {
  const db = getDb();
  const conds: SQL[] = [eq(locationPings.userId, userId)];
  if (opts.before) conds.push(lt(locationPings.recordedAt, opts.before));
  return db
    .select()
    .from(locationPings)
    .where(and(...conds))
    .orderBy(desc(locationPings.recordedAt))
    .limit(opts.limit);
}

export async function countPingsByUser(userId: number): Promise<number> {
  const db = getDb();
  const rows = await db
    .select({ id: locationPings.id })
    .from(locationPings)
    .where(eq(locationPings.userId, userId))
    .limit(100000);
  return rows.length;
}

export async function deletePingForUser(
  userId: number,
  pingId: number,
): Promise<boolean> {
  const db = getDb();
  const res = await db
    .delete(locationPings)
    .where(and(eq(locationPings.id, pingId), eq(locationPings.userId, userId)));
  return (res[0]?.affectedRows ?? 0) > 0;
}

export async function clearPingsForUser(userId: number): Promise<number> {
  const db = getDb();
  const res = await db
    .delete(locationPings)
    .where(eq(locationPings.userId, userId));
  return res[0]?.affectedRows ?? 0;
}
