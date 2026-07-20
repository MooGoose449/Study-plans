# 📖 Study Plans Discord Bot

A Discord bot that helps members of The Church of Jesus Christ of Latter-day Saints stay consistent with scripture and General Conference study. Users create study plans, track progress, build streaks, set daily reminders, and compete on leaderboards.

---

## Features

- **Study Plans** — Create up to 10 active plans per user for any standard work or General Conference session (October 2025 / April 2026). Set your own daily pace or a goal date.
- **Daily Reading Tracker** — `/today` shows every active plan and lets you mark each one complete with one button click. `/read` picks your plan from a list automatically.
- **Streak Tracking** — Consecutive-day streaks with automatic break detection if a day is missed.
- **DM Reminders** — Scheduled daily reminders sent directly to users' DMs with Mark as Read buttons included.
- **Stats and Leaderboards** — Per-user stats and server or global top-10 leaderboards by current or longest streak.

---

## Commands

> After changing slash command options, re-register with Discord by running the deploy-commands script.

| Command | Description |
|---|---|
| `/help` | Show all commands and tips |
| `/plan create` | Start a new study plan (max 10 active) |
| `/plan list` | List all your plans with progress bars |
| `/plan view` | View details for a specific plan |
| `/plan edit` | Edit name, daily pace, goal date, or pause |
| `/plan delete` | Delete a plan |
| `/today` | See today's reading for all active plans |
| `/read` | Mark today's reading complete. Choose from a list if you have multiple plans |
| `/reminder set` | Set up a daily DM reminder |
| `/reminder edit` | Edit reminder settings |
| `/reminder view` | View current reminder settings |
| `/reminder disable` | Turn off reminders |
| `/streak [user]` | View current and longest streak |
| `/stats [user]` | Full reading statistics |
| `/leaderboard` | Top 10 leaderboard. Requires `type` (`current` or `longest`) and `scope` (`server` or `global`) |

---

## Setup

### Environment Variables

| Variable | Required | Description |
|---|---|---|
| `DISCORD_TOKEN` | Yes | Bot token from Discord Developer Portal |
| `DISCORD_CLIENT_ID` | Yes | Application ID from Discord Developer Portal |
| `NEON_DATABASE_URL` | Yes | PostgreSQL connection string (Neon recommended) |
| `SESSION_SECRET` | Yes | Secret string for session signing |
| `RENDER_EXTERNAL_URL` | Render only | Set automatically by Render; used for keep-alive self-ping |
| `DISCORD_MEMBERS_INTENT` | Optional | Set to `true` to enable GuildMembers privileged intent (needed for server-scope leaderboard member lookups) |
| `LEADERBOARD_CACHE_TTL` | Optional | Leaderboard cache lifetime in seconds (default: 60) |
| `MEMBER_FETCH_TIMEOUT_MS` | Optional | Timeout for guild member fetches in ms (default: 3000) |

### Running Locally

```bash
pnpm install
pnpm --filter @workspace/api-server run dev
```

### Deploying to Render

1. Push to GitHub. Render auto-deploys from `main`.
2. Set all required environment variables in the Render dashboard.
3. Build command: `pnpm run build` (run inside `artifacts/api-server`).
4. After first deploy, run the deploy-commands script once to register slash commands with Discord.

---

## Architecture

- Single Node.js process: Discord.js v14 bot + minimal Express server (health check at `GET /api/healthz`)
- TypeScript, built with esbuild via `build.mjs`
- Database: Neon PostgreSQL via Drizzle ORM. `NEON_DATABASE_URL` takes priority over `DATABASE_URL`
- Keep-alive: HTTP self-ping + `SELECT 1` every 5 minutes using `RENDER_EXTERNAL_URL` on Render
- pnpm monorepo under `artifacts/api-server`
