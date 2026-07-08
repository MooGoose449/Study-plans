# 📖 Study Helps Discord Bot

A Discord bot that helps members of The Church of Jesus Christ of Latter-day Saints stay consistent with scripture and General Conference study. Users create study plans, track progress, build streaks, set daily reminders, and compete on leaderboards!

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

> Note: If you change slash command options you must re-register the commands with Discord. Run `artifacts/api-server/src/bot/deploy-commands.ts` (or your deploy script) after pulling changes.

| Command | Description |
|---|---|
| `/help` | Show all commands and tips |
| `/plan create` | Start a new study plan |
| `/plan list` | List all your plans with progress bars |
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
| `/leaderboard type scope` | Top 10 leaderboard by streak type and scope (type: `current` or `longest`, scope: `server` or `global`) |
