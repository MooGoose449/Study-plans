# Discord Study Companion Bot

A production-quality Discord bot that helps users stay consistent with scripture and General Conference study through plans, progress tracking, streak tracking, reminders, and leaderboards.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — build and start the API server + Discord bot
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/db run push` — push DB schema changes to Neon (uses NEON_DATABASE_URL)
- `pnpm --filter @workspace/api-server run deploy-commands` — register slash commands with Discord (run after build)

## Required Environment Variables

| Variable | Where | Description |
|---|---|---|
| `DISCORD_TOKEN` | Secret | Bot token from Discord Developer Portal |
| `DISCORD_CLIENT_ID` | Secret | Application Client ID |
| `NEON_DATABASE_URL` | Secret | Neon PostgreSQL connection string |
| `DISCORD_GUILD_ID` | Optional env | Set for instant guild-scoped command deployment |
| `DATABASE_URL` | Render env | Set to your Neon URL on Render (bot uses DATABASE_URL or NEON_DATABASE_URL) |

## Discord Developer Portal Setup

1. Enable **Server Members Intent** under Bot → Privileged Gateway Intents (required for server leaderboards)
2. Enable **Message Content Intent** if adding message commands later
3. Invite the bot with scopes: `bot`, `applications.commands` and permissions: `Send Messages`, `Embed Links`, `Use Slash Commands`

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- API: Express 5 (health check endpoint for Render)
- Discord: discord.js v14
- DB: PostgreSQL (Neon) + Drizzle ORM
- Scheduler: cron v3 (reminder DMs)
- Date utils: date-fns + date-fns-tz
- Validation: Zod (`zod/v4`), `drizzle-zod`
- Build: esbuild (CJS bundle)

## Where Things Live

```
artifacts/api-server/src/
├── bot/
│   ├── index.ts              # Bot client setup + startup
│   ├── deploy-commands.ts    # Register slash commands with Discord API
│   ├── commands/             # /plan, /today, /read, /reminder, /streak, /stats, /leaderboard
│   ├── events/               # ready, interactionCreate, guildMemberRemove
│   ├── interactions/         # Button, SelectMenu, Modal handlers
│   ├── ui/
│   │   ├── embeds.ts         # All EmbedBuilder factories
│   │   ├── components.ts     # Buttons, SelectMenus, ActionRows
│   │   └── emojis.ts         # Emoji constants (swap for custom Discord emojis here)
│   ├── metadata/
│   │   ├── scriptures.ts     # Standard works chapter counts
│   │   └── conferences.ts    # General Conference talk metadata (update every 6 months)
│   ├── scheduler/index.ts    # cron-based reminder scheduler
│   └── services/             # planService, readService, statsService, reminderService, userService
│
lib/db/src/schema/
├── users.ts
├── study-plans.ts
├── reading-history.ts
├── reminder-settings.ts
└── statistics.ts
```

## Commands

| Command | Description |
|---|---|
| `/plan create` | Create a study plan (select scripture/conference → configure) |
| `/plan list` | List all plans with progress |
| `/plan view [id]` | View plan details |
| `/plan edit [id]` | Edit name, units/day, goal date, or pause |
| `/plan delete [id]` | Delete a plan |
| `/today` | Today's readings for all active plans + Mark as Read buttons |
| `/read [plan]` | Mark today's reading complete |
| `/streak [user]` | View current and longest streak |
| `/stats [user]` | Full statistics |
| `/leaderboard [type] [scope]` | Top 10 by current or longest streak, server or global |
| `/reminder set` | Set up daily DM reminders |
| `/reminder edit` | Edit reminder settings |
| `/reminder view` | View current reminder settings |
| `/reminder disable` | Disable reminders |

## Conference Metadata Updates (every 6 months)

Edit `artifacts/api-server/src/bot/metadata/conferences.ts`:
1. Remove the oldest conference entry
2. Add the newest conference with real talk titles/speakers
3. Rebuild and redeploy

Existing plans that referenced the removed conference will gracefully fall back to "Talk #N" display.

## Custom Emoji Integration

All emoji constants are in `artifacts/api-server/src/bot/ui/emojis.ts`. Replace any string emoji with `<:name:id>` format for custom Discord emojis without touching any other file.

## Deployment (Render)

1. Connect your GitHub repo to Render
2. Create a **Web Service** (keeps health checks alive)
3. Build command: `pnpm install && pnpm --filter @workspace/api-server run build`
4. Start command: `pnpm --filter @workspace/api-server run start`
5. Set env vars: `DATABASE_URL` (Neon URL), `DISCORD_TOKEN`, `DISCORD_CLIENT_ID`, `NODE_ENV=production`
6. Run `pnpm --filter @workspace/api-server run deploy-commands` once after first deploy

## Architecture Decisions

- **Bot runs alongside Express**: A minimal HTTP server satisfies Render's health check while the Discord client handles bot traffic. No separate service needed.
- **Neon PostgreSQL preferred over Replit's managed DB**: Uses `NEON_DATABASE_URL` first, falls back to `DATABASE_URL`. On Render, set `DATABASE_URL` to your Neon URL.
- **Reminders restored on restart**: All enabled cron jobs are reconstructed from the DB on bot `ready`. No state is lost across deployments.
- **Conference metadata is code, not DB**: Updated manually every 6 months in `conferences.ts`. Existing plans using removed conferences gracefully degrade without breaking.
- **Custom ID convention**: `prefix:action:param1:param2` — keeps interaction routing maintainable as the bot grows.

## User Preferences

_Populate as you build — explicit user instructions worth remembering across sessions._

## Gotchas

- Run `pnpm run typecheck:libs` before leaf artifact checks if you change any `lib/*` package.
- After adding or changing slash commands, run `deploy-commands` to push them to Discord.
- `DISCORD_GUILD_ID` env var enables instant (guild-scoped) command deployment instead of global (1-hour propagation).
- The `Server Members Intent` must be enabled in the Discord Developer Portal for server leaderboards to work.
