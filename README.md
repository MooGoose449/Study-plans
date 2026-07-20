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
| `/leaderboard` | Top 10 leaderboard. Requires `type` (`current` or `longest`) and `scope` (`server` or `global`) 
