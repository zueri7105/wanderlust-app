import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { createRouter, authedQuery } from "./middleware";
import {
  insertLocationPing,
  findPingsByUser,
  countPingsByUser,
  deletePingForUser,
  clearPingsForUser,
} from "./queries/location-pings";

const submitInput = z.object({
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
  accuracyM: z.number().min(0).max(100000).optional(),
  source: z.enum(["gps", "network", "manual"]).default("gps"),
  recordedAt: z.date().optional(),
});

export const pingsRouter = createRouter({
  /** Record one location ping for the signed-in user. */
  submit: authedQuery.input(submitInput).mutation(({ ctx, input }) =>
    insertLocationPing({
      userId: ctx.user.id,
      lat: input.lat,
      lng: input.lng,
      accuracyM: input.accuracyM ?? null,
      source: input.source,
      recordedAt: input.recordedAt ?? new Date(),
    }),
  ),

  /** The signed-in user's pings, newest first (cursor-paginated by recordedAt). */
  list: authedQuery
    .input(
      z.object({
        limit: z.number().int().min(1).max(200).default(50),
        before: z.date().optional(),
      }),
    )
    .query(({ ctx, input }) => findPingsByUser(ctx.user.id, input)),

  /** Total ping count for the signed-in user. */
  count: authedQuery.query(({ ctx }) => countPingsByUser(ctx.user.id)),

  /** Delete one of the signed-in user's own pings. */
  remove: authedQuery
    .input(z.object({ id: z.number().int().positive() }))
    .mutation(async ({ ctx, input }) => {
      const ok = await deletePingForUser(ctx.user.id, input.id);
      if (!ok) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Ping not found" });
      }
      return { success: true };
    }),

  /** Wipe every ping belonging to the signed-in user. */
  clear: authedQuery.mutation(({ ctx }) => clearPingsForUser(ctx.user.id)),
});
