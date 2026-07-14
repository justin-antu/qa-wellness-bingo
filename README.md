# QA Winter Wellness Challenge - Bingo Tracker

A tiny, free web app that digitizes the "QA Winter Wellness Challenge" bingo
card: the homepage is a public leaderboard/landing page where teammates can
self-signup with a username + RMIT email to get a PIN, then log in to tap
activities off their own 5x5 board, and everyone can check the shared
leaderboard.

- **Frontend**: static React + TypeScript app (Vite), hosted free on GitHub Pages.
  Styled with Tailwind CSS plus a handful of animated components adapted from
  [animata.design](https://animata.design/components) (flip cards, ripple
  buttons, a blurry blob backdrop, etc.), re-themed to the app's cream/teal look.
- **Backend/data**: a free Supabase (Postgres) project. All reads/writes go
  through database functions (RPCs) - there's no separate server to run or pay for.

## How it works

```
Browser (GitHub Pages) --calls--> Supabase RPC functions --> Postgres
```

- The homepage (`/`) is a **landing page**: the shared leaderboard plus "Join
  the Challenge" / "Log in" buttons.
- `signup(username, email)` - self-service signup. Only `*@rmit.edu.au`
  emails are accepted (format-checked, not verified by email). Generates a
  random 4-digit PIN, shown once on a confirmation screen ("save this - if you
  lose it you'll need an admin to reset it").
- `login(identifier, pin)` - `identifier` can be either your username or your
  email (case-insensitive) - checks the PIN and returns your participant id
  + username.
- The app stores `{participantId, pin, username}` in `localStorage` as your
  "session" so you don't have to log in every visit.
- `get_my_board(participantId)` returns all 25 activities plus which ones
  you've completed.
- `toggle_activity(participantId, pin, activityId)` checks/unchecks an
  activity (re-checks the PIN server-side every time).
- `get_leaderboard()` returns everyone's **username** + completed count - no
  login needed. Email addresses are never shown publicly.
- Signups can be closed at any time from the admin Settings tab (e.g. once
  you've reached capacity) without touching code - `signup()` checks a
  `signups_open` app setting and rejects new joins while it's off. Existing
  participants can still log in as normal.

Direct table access is locked down with Row Level Security; only the
functions above can read/write participant data, so the public Supabase key
used by the frontend can't be used to peek at or tamper with anyone else's PIN,
email, or board.

There's also an **admin page** at `/admin` (password-protected) for running
the challenge day-to-day - see [Admin page](#admin-page) below.

## Fun extras

- **Real BINGO detection** - completing any full row, column, or diagonal (not
  just all 25) pops a confetti burst + a "BINGO!" banner; completing the whole
  board triggers a bigger "FULL HOUSE!" celebration. Each line/full-house only
  celebrates once per visit to avoid repeat confetti on reload.
- **Recent activity ticker** - a small "who just did what" feed under the
  leaderboard (e.g. "Jordan completed 'Take a walk'"), refreshing every 15s.
  Username + activity title only, same privacy posture as the leaderboard.
- **Countdown banner** - set a challenge end date in the admin Settings tab and
  an animated "N days left!" banner shows under the title everywhere in the
  app. Leave it blank to hide it.
- **Save as image** - both the leaderboard and your own board have a "Save
  image" button that downloads a PNG snapshot (handy for sharing to
  Slack/Teams).

## One-time setup

### 1. Create a free Supabase project

1. Go to [supabase.com](https://supabase.com), create a free account/project.
2. In the SQL editor, run [`supabase/schema.sql`](supabase/schema.sql), then
   [`supabase/seed.sql`](supabase/seed.sql) (loads the 25 challenges).
3. Under **Project Settings > API**, note down:
   - `Project URL`
   - `anon` `public` key
   - `service_role` `secret` key (only used locally for seeding participants - never share it)

> **Already have a project from before?** Both files are safe to re-run any
> time you pull in schema changes (tables use `create table if not exists`,
> functions use `create or replace function`) - just re-run `schema.sql` then
> `seed.sql` in the SQL editor to pick up new functions/settings (e.g. the
> recent-activity ticker, the countdown banner setting) without losing any
> existing data.
>
> If self-signup ever fails with `function gen_salt(unknown) does not exist`,
> it's because the SQL editor installed the `pgcrypto` extension into its own
> `extensions` schema instead of `public` - re-running `schema.sql` fixes this
> automatically now (it moves `pgcrypto` into `public` if needed).

### 2. (Optional) bulk-seed teammates + PINs

Most people can just self-signup from the homepage once the app is deployed
(see [Managing the challenge](#managing-the-challenge)). If you'd rather
pre-load everyone yourself instead:

```bash
npm install
cp .env.example .env
# fill in SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY in .env

cp scripts/participants.example.json scripts/participants.json
# edit scripts/participants.json with your team's usernames + *@rmit.edu.au emails

npm run seed
```

This creates a participant row + random 4-digit PIN for each entry, and
writes them to `scripts/output/participant-pins.csv`. Privately share each
person's PIN with them (Slack DM/email), then delete the CSV. Usernames,
emails, and PINs are never committed to the repo (`scripts/participants.json`
and `scripts/output/` are gitignored).

### 3. Run it locally

Also fill in `VITE_SUPABASE_URL` + `VITE_SUPABASE_ANON_KEY` in `.env` (the
`anon` key, not the service role key), then:

```bash
npm install   # picks up Tailwind CSS + the animation libraries automatically
npm run dev
```

No extra setup beyond `npm install` is needed for the styling - Tailwind,
`motion`, and `lucide-react` are all regular `package.json` dependencies.

### 4. Deploy for free on GitHub Pages

1. Push this repo to GitHub.
2. In the repo, go to **Settings > Pages** and set **Source** to **GitHub Actions**.
3. Go to **Settings > Secrets and variables > Actions** and add two repo secrets:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
4. Push to `main` (or run the "Deploy to GitHub Pages" workflow manually).
   The included workflow ([`.github/workflows/deploy.yml`](.github/workflows/deploy.yml))
   builds the app and publishes it automatically.
5. Your app will be live at `https://<your-org-or-user>.github.io/<repo-name>/`.

If you'd rather run this from a private repo, GitHub Pages on private repos
requires a paid GitHub plan (Pro/Team/Enterprise) - the code itself has no
secrets in it either way (the Supabase anon key is meant to be public), so a
public repo is the simplest free option.

## Admin page

Visit `/admin` (e.g. `https://<your-org>.github.io/<repo-name>/admin`) and sign
in with the shared admin password to manage the whole challenge without
touching SQL or re-deploying:

- **Settings** - toggle **self-signup on/off** (see below), edit the
  kicker/title/subtitle/footer text shown on the participant app (handy for
  renaming things each time you re-run the challenge), set/clear the
  **challenge end date** (drives the countdown banner - see
  [Fun extras](#fun-extras)), and change the admin password.
- **Activities** - edit the wording of any of the 25 challenge slots.
  Existing checkmarks aren't affected, since they're tied to the slot, not
  the wording.
- **Participants** - add a new participant with a username + RMIT email
  (their PIN is shown once, right after creation - copy it before
  dismissing), reset someone's forgotten PIN, or remove a participant. The
  table also shows each person's email (admin-only - never shown publicly).
- **Rounds** - this challenge gets re-run periodically (this is the 3rd time!),
  so progress is tracked per "round" instead of one global pool:
  - **Start new round** ends the current round and opens a fresh one -
    everyone's board goes back to 0/25, but nothing is deleted.
  - **Round history** lists every past round with participant/completion
    counts and a per-person results breakdown you can expand, so you can
    always look back at how a previous run went.
  - You can also just **rename** the current round (e.g. right after seeding,
    to label it "Round 3" instead of the generic default) without resetting
    anything.

**The default admin password is `changeme123`** (set in `seed.sql`) - sign in
and change it from the Settings tab immediately after your first deploy.

The admin page lives at a real path (`/admin`), which needs a small trick to
work on GitHub Pages (a static host with no server-side routing): a
[`public/404.html`](public/404.html) redirect + a restore script in
[`index.html`](index.html) ([pattern reference](https://github.com/rafgraph/spa-github-pages)).
This is already wired up - no extra setup needed.

## Managing the challenge

- **Self-signup** - once deployed, point people at the homepage: "Join the
  Challenge" asks for a username + `*@rmit.edu.au` email and hands back a PIN
  immediately - no admin action needed for most people to get started.
- **Day-to-day management** (settings text, activities, participants, resets) -
  use the [admin page](#admin-page), no SQL required.
- **Closing signups** - flip "Signups open" off in the admin Settings tab once
  you've reached capacity or between rounds while you sort out who's in;
  existing participants can still log in as normal.
- **Bulk-add participants from a list**: still supported via
  `scripts/participants.json` + `npm run seed` (existing usernames/PINs are
  left untouched) - handy for the initial batch of 20-30 people, or anyone
  who can't self-signup.
- **Lost PIN**: no email verification/reset flow is built in (by design, to
  keep this simple) - people who lose their PIN need an admin to reset it from
  the Participants tab.

## Backups

Supabase's free tier has no automatic backups (Point-in-Time-Recovery is a
paid-tier feature) - here are free ways to cover yourself, roughly in order
of effort:

- **Adhoc script backup (recommended)** - `npm run backup` exports every
  table (participants, activities, rounds, completions, settings, admin
  password hash) to a single timestamped JSON file in
  `scripts/output/backups/` (gitignored - contains PIN/password hashes, so
  copy it somewhere durable like a private repo or cloud drive rather than
  leaving it only on your machine). Restore it later with
  `npm run restore -- scripts/output/backups/<file>.json`, which upserts
  every row back (safe to run against a DB that already has data - nothing
  gets deleted, matching rows are just overwritten). Good habit: run it
  before "Start new round", bulk edits, or anything else risky.
- **No-code option** - in the Supabase dashboard's **Table Editor**, open a
  table and use the export button to download it as CSV. Quicker for a
  single table, but you'd need to do this once per table and there's no
  matching one-click restore.
- **Fully automatic (still free)** - if you want backups without having to
  remember to run anything, add a scheduled GitHub Actions workflow (free
  on public repos) that runs `npm run backup` on a cron and uploads the
  result as a workflow artifact or commits it to a private backups repo.
  Not set up here since it's easy to add later if you want it - ask if you'd
  like this wired up.

## Cost

Free: GitHub Pages (free for public repos) + Supabase free tier comfortably
covers 20-30 people x 25 activities indefinitely.

## Project structure

```
supabase/schema.sql        Tables, RLS policies, RPC functions (participant + admin)
supabase/seed.sql          The 25 challenge activities, default settings/round/admin password
scripts/seed-participants.ts   Bulk-seed script: creates participants + PINs from a list
scripts/backup.ts          Exports every table to a timestamped JSON file (see Backups)
scripts/restore.ts         Restores a JSON file produced by scripts/backup.ts
src/pages/LandingPage.tsx  Homepage: leaderboard + Join/Log in buttons
src/pages/JoinPage.tsx     Self-signup form (username + RMIT email)
src/pages/JoinConfirmPage.tsx  Shows the generated PIN once, with a save-it warning
src/pages/LoginPage.tsx    Username/email + PIN login
src/pages/BoardPage.tsx    5x5 board, tap to toggle
src/pages/LeaderboardPage.tsx  Shared progress leaderboard (by username)
src/pages/AdminPage.tsx    Admin password gate + tab switcher
src/pages/admin/           Settings / Activities / Participants / Rounds tabs
src/components/animata/    Animated UI components adapted from animata.design (buttons, cards, overlays...)
src/components/ActivityTicker.tsx   "Recent activity" feed shown under the leaderboard
src/components/CountdownBanner.tsx  Animated "N days left" banner (site header)
src/lib/utils.ts           cn() Tailwind class-merge helper used by the animata components
src/lib/bingoLines.ts      Row/column/diagonal detection for the BINGO! celebration
src/lib/screenshot.ts      html-to-image helper behind the "Save image" buttons
src/route.ts               Tiny client-side router for "/" vs "/admin"
public/404.html            GitHub Pages SPA redirect (so /admin works directly)
.github/workflows/deploy.yml   Build + deploy to GitHub Pages
```
