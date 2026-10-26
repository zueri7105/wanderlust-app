import {
  mysqlTable,
  mysqlEnum,
  serial,
  varchar,
  text,
  timestamp,
  double,
  bigint,
  index,
} from "drizzle-orm/mysql-core";

export const users = mysqlTable("users", {
  id: serial("id").primaryKey(),
  unionId: varchar("unionId", { length: 255 }).notNull().unique(),
  name: varchar("name", { length: 255 }),
  email: varchar("email", { length: 320 }),
  avatar: text("avatar"),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt")
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date()),
  lastSignInAt: timestamp("lastSignInAt").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// ── Location pings ──────────────────────────────────────────────────────
// One row per GPS sample collected from a signed-in traveller's device,
// grouped under their account. Retention: user can delete rows any time;
// the clear procedure wipes all of their own pings.
export const locationPings = mysqlTable(
  "location_pings",
  {
    id: serial("id").primaryKey(),
    userId: bigint("userId", { mode: "number", unsigned: true })
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    lat: double("lat").notNull(),
    lng: double("lng").notNull(),
    accuracyM: double("accuracyM"),
    source: mysqlEnum("source", ["gps", "network", "manual"]).default("gps").notNull(),
    recordedAt: timestamp("recordedAt").notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  (table) => [
    index("location_pings_user_recorded_idx").on(table.userId, table.recordedAt),
  ],
);

export type LocationPing = typeof locationPings.$inferSelect;
export type InsertLocationPing = typeof locationPings.$inferInsert;
//
// Example:
// export const posts = mysqlTable("posts", {
//   id: serial("id").primaryKey(),
//   title: varchar("title", { length: 255 }).notNull(),
//   content: text("content"),
//   createdAt: timestamp("created_at").notNull().defaultNow(),
// });
//
// Note: FK columns referencing a serial() PK must use:
//   bigint("columnName", { mode: "number", unsigned: true }).notNull()
