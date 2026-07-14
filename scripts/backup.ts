/**
 * One-off admin script: exports every row from every app table into a single
 * timestamped JSON file. This is a free, manual stand-in for Supabase's
 * automatic backups (Point-in-Time-Recovery is a paid-tier feature).
 *
 * The file this writes only lives on your machine (scripts/output/ is
 * gitignored) - for real disaster-recovery value, copy it somewhere durable
 * after each run (a cloud drive, a private git repo, etc).
 *
 * Usage:
 *   1. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in a local .env file
 *      (same as scripts/seed-participants.ts).
 *   2. Run: npm run backup
 *
 * Restore with: npm run restore -- scripts/output/backups/<file>.json
 * (see scripts/restore.ts).
 */
import "dotenv/config";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createClient } from "@supabase/supabase-js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const SUPABASE_URL = process.env.SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error(
    "Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY. Set them in a local .env file (see .env.example)."
  );
  process.exit(1);
}

// Parents before children, so scripts/restore.ts can insert in this same
// order without hitting foreign key errors.
const TABLES = ["participants", "activities", "rounds", "app_settings", "admin_settings", "completions"] as const;

async function main() {
  // Service role key bypasses RLS entirely, so this can read every table
  // directly instead of via an RPC function.
  const supabase = createClient(SUPABASE_URL as string, SERVICE_ROLE_KEY as string);

  const tables: Record<string, unknown[]> = {};

  for (const table of TABLES) {
    const { data, error } = await supabase.from(table).select("*");
    if (error) {
      console.error(`Failed to read "${table}":`, error.message);
      process.exit(1);
    }
    tables[table] = data ?? [];
    console.log(`${table.padEnd(14)} ${(data ?? []).length} row(s)`);
  }

  const outDir = path.join(__dirname, "output", "backups");
  fs.mkdirSync(outDir, { recursive: true });
  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  const outPath = path.join(outDir, `backup-${stamp}.json`);
  fs.writeFileSync(outPath, JSON.stringify({ createdAt: new Date().toISOString(), tables }, null, 2), "utf-8");

  console.log(`\nBackup written to ${outPath}`);
  console.log(
    "This file contains PIN/password hashes - keep it private. It's gitignored here, so for real safety, copy it " +
      "somewhere durable (cloud drive, private repo, etc)."
  );
}

main();
