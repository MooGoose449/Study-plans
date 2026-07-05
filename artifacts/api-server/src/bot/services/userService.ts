import { db } from "@workspace/db";
import { usersTable, statisticsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import type { User } from "@workspace/db";

/** Ensure a user exists in the DB, creating them if necessary. */
export async function upsertUser(
  discordId: string,
  username: string,
): Promise<User> {
  await db
    .insert(usersTable)
    .values({ discordId, username })
    .onConflictDoUpdate({
      target: usersTable.discordId,
      set: { username, updatedAt: new Date() },
    });

  // Ensure statistics row exists
  await db
    .insert(statisticsTable)
    .values({ discordId })
    .onConflictDoNothing();

  const user = await db.query.usersTable.findFirst({
    where: eq(usersTable.discordId, discordId),
  });

  return user!;
}

/** Get a user by Discord ID. */
export async function getUser(discordId: string): Promise<User | undefined> {
  return db.query.usersTable.findFirst({
    where: eq(usersTable.discordId, discordId),
  });
}

/** Update a user's timezone. */
export async function updateUserTimezone(
  discordId: string,
  timezone: string,
): Promise<void> {
  await db
    .update(usersTable)
    .set({ timezone, updatedAt: new Date() })
    .where(eq(usersTable.discordId, discordId));
}
