# 📖 Study Companion — Discord Bot

A Discord bot that helps members of The Church of Jesus Christ of Latter-day Saints stay consistent with scripture and General Conference study. Users create study plans, track progress, build streaks, set daily reminders, and compete on leaderboards — all without the bot ever displaying scripture text or talk content.

---

## Features

- **Study Plans** — Create plans for any standard work or General Conference (October 2025 / April 2026). Set your own daily pace and optional goal date.
- **Daily Reading Tracker** — `/today` shows exactly what to read and lets you mark it complete with one button click.
- **Streak Tracking** — Consecutive-day streaks with automatic break detection if a day is missed.
- **DM Reminders** — Scheduled daily reminders sent directly to users' DMs with Mark as Read buttons included.
- **Stats & Leaderboards** — Per-user stats and server or global top-10 leaderboards by current or longest streak.
- **Multiple Active Plans** — Users can run several plans simultaneously (e.g. Book of Mormon + April 2026 conference).

---

## Commands

| Command | Description |
|---|---|
| `/help` | Show all commands and tips |
| `/plan create` | Start a new study plan |
| `/plan list` | List all your plans with progress |
| `/plan view` | View details for a specific plan |
| `/plan edit` | Edit name, daily pace, goal date, or pause |
| `/plan delete` | Delete a plan |
| `/today` | See today's reading for all active plans |
| `/read` | Mark today's reading complete |
| `/reminder set` | Set up a daily DM reminder |
| `/reminder edit` | Edit reminder settings |
| `/reminder view` | View current reminder settings |
| `/reminder disable` | Turn off reminders |
| `/streak [user]` | View current and longest streak |
| `/stats [user]` | Full reading statistics |
| `/leaderboard` | Top 10 leaderboard (streak type + scope) |

---

## Tech Stack

- **Runtime** — Node.js 24, TypeScript
- **Bot** — discord.js v14
- **Database** — PostgreSQL (Neon) via Drizzle ORM
- **Scheduler** — cron v3 (reminder DMs, per-user cron jobs)
- **Server** — Express 5 (health check endpoint for Render)
- **Package manager** — pnpm workspaces

---

## Setup

### Prerequisites

- [Node.js 20+](https://nodejs.org)
- [pnpm](https://pnpm.io) (`npm install -g pnpm`)
- A [Neon](https://neon.tech) PostgreSQL database
- A [Discord application](https://discord.com/developers/applications) with a bot token

### 1. Clone and install

```bash
git clone https://github.com/your-username/your-repo.git
cd your-repo
pnpm install
```

### 2. Environment variables

Create a `.env` file or set these in your environment:

```env
DISCORD_TOKEN=your_bot_token
DISCORD_CLIENT_ID=your_application_client_id
NEON_DATABASE_URL=postgresql://user:password@host/dbname?sslmode=require

# Optional — set for instant guild-scoped command registration during development
DISCORD_GUILD_ID=your_test_server_id

# Optional — enables server leaderboards (requires Server Members Intent in Discord portal)
DISCORD_MEMBERS_INTENT=true
```

### 3. Push the database schema

```bash
pnpm --filter @workspace/db run push
```

### 4. Register slash commands with Discord

```bash
pnpm --filter @workspace/api-server run build
pnpm --filter @workspace/api-server run deploy-commands
```

> With `DISCORD_GUILD_ID` set, commands appear instantly in that server.  
> Without it, commands are registered globally and take up to 1 hour to propagate.

### 5. Run locally

```bash
pnpm --filter @workspace/api-server run dev
```

---

## Discord Developer Portal

1. Go to [discord.com/developers/applications](https://discord.com/developers/applications)
2. Select your application → **Bot**
3. *(Optional)* Under **Privileged Gateway Intents**, enable **Server Members Intent** — required for server-scoped leaderboards. Also set `DISCORD_MEMBERS_INTENT=true` in your environment.
4. Generate an invite link under **OAuth2 → URL Generator**:
   - Scopes: `bot`, `applications.commands`
   - Permissions: `Send Messages`, `Embed Links`, `Use Slash Commands`

---

## Deployment (Render)

1. Push your code to GitHub
2. Create a new **Web Service** on [render.com](https://render.com) connected to your repo
3. Configure the service:

| Setting | Value |
|---|---|
| Build command | `pnpm install && pnpm --filter @workspace/api-server run build` |
| Start command | `pnpm --filter @workspace/api-server run start` |
| Root directory | *(leave empty)* |

4. Add environment variables in Render's dashboard:

| Variable | Value |
|---|---|
| `DATABASE_URL` | Your Neon connection string |
| `DISCORD_TOKEN` | Your bot token |
| `DISCORD_CLIENT_ID` | Your application client ID |
| `SESSION_SECRET` | Any long random string |
| `NODE_ENV` | `production` |
| `DISCORD_MEMBERS_INTENT` | `true` *(optional)* |

5. Deploy — the Express server provides the health check endpoint Render needs to keep the service alive, and the bot runs alongside it in the same process.

---

## Updating Conference Data

General Conference metadata lives in:

```
artifacts/api-server/src/bot/metadata/conferences.ts
```

After each conference (April and October):
1. Remove the oldest entry from the `CONFERENCES` array
2. Add the new conference with real talk titles and speakers
3. Rebuild: `pnpm --filter @workspace/api-server run build`
4. Redeploy

Existing plans that referenced a removed conference continue to work — they display "Talk #N" as a fallback.

---

## Project Structure

```
artifacts/api-server/src/bot/
├── commands/          # /plan, /today, /read, /reminder, /streak, /stats, /leaderboard, /help
├── events/            # Discord gateway events (ready, interactionCreate)
├── interactions/      # Button, select menu, and modal handlers
├── metadata/          # Scripture chapter counts + conference talk data
├── scheduler/         # cron-based DM reminder scheduling
├── services/          # Business logic (plans, reading, stats, reminders, users)
└── ui/
    ├── embeds.ts      # All EmbedBuilder factories
    ├── components.ts  # Buttons, select menus, modals
    └── emojis.ts      # Emoji constants (swap in custom server emojis here)

lib/db/src/schema/
├── users.ts
├── study-plans.ts
├── reading-history.ts
├── reminder-settings.ts
└── statistics.ts
```

---

## License

MIT
