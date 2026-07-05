---
name: Discord bot architecture
description: Key decisions and gotchas for the Study Companion Discord bot living in artifacts/api-server alongside Express.
---

# Discord Bot Architecture

## Bot starts alongside Express
`artifacts/api-server/src/index.ts` starts the Express HTTP server first (required for Render health checks), then calls `startBot()`. Bot failure is caught and logged but does NOT exit the process so the health check endpoint stays alive.

## GuildMembers intent is opt-in
The `GuildMembers` privileged intent requires enabling in the Discord Developer Portal (Bot → Privileged Gateway Intents). Without it the bot still starts. Opt in by setting `DISCORD_MEMBERS_INTENT=true` as an env var. Server leaderboard gracefully degrades without it.

**Why:** Using `GuildMembers` without enabling it in the portal causes "Used disallowed intents" on connect and crashes the bot.

## Command routing convention
Custom IDs use `prefix:action:param1:param2` format:
- `btn:mark_read:planId`
- `sel:source_type`
- `mod:plan_create:scripture:BOOK_OF_MORMON:239`

## Mark-as-read atomicity
`markAsRead` uses a raw `pool.connect()` transaction with `SELECT … FOR UPDATE` to lock the plan row. The `reading_history` table has a DB-level `UNIQUE(plan_id, read_date)` constraint as a second safety net. Never use the Drizzle ORM query builder for this path — it doesn't support row-level locking.

**Why:** Two rapid button clicks would both pass a pre-check and insert duplicates, inflating streak/progress counts.

## Scheduler restore
`restoreAllReminders` wraps each user in a try/catch so a single bad cron config doesn't abort the entire restore loop.

## deploy-commands
After any command change: rebuild, then run `pnpm --filter @workspace/api-server run deploy-commands`. Set `DISCORD_GUILD_ID` for instant guild-scoped propagation vs. 1-hour global.

## Conference metadata
Maintained in `artifacts/api-server/src/bot/metadata/conferences.ts`. Updated manually every 6 months. Plans referencing removed conferences fall back to "Talk #N" display gracefully.

## Event name
Use `clientReady` not `ready` — discord.js v14 renamed the once-fire ready event and will remove the old name in v15.
