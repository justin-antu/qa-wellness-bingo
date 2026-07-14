/**
 * Restores a JSON backup produced by scripts/backup.ts. Upserts every row
 * back into its table (parents before children) - existing rows with a
 * matching primary key are overwritten, everything else is left alone
 * (nothing is deleted), so it's safe to run against a database that already
 * has some data in it.
 *
 * Usage:
 *   npm run restore -- scripts/output/backups/backup-2026-07-14T00-00-00-000Z.json
 */
import "dotenv/config";
import fs from "node:fs";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error(
    "Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY. Set them in a local .env file (see .env.example)."
  );
  process.exit(1);
}

const filePath = process.argv[2];
if (!filePath) {
  console.error("Usage: npm run restore -- <path-to-backup.json>");
  process.exit(1);
}

const resolvedPath = path.resolve(filePath);
if (!fs.existsSync(resolvedPath)) {
  console.error(`File not found: ${resolvedPath}`);
  process.exit(1);
}

interface BackupFile {
  createdAt: string;
  tables: Record<string, Record<string, unknown>[]>;
}

// Parents before children, matching scripts/backup.ts's write order.
const TABLE_ORDER = ["participants", "activities", "rounds", "app_settings", "admin_settings", "completions"];

const PRIMARY_KEYS: Record<string, string> = {
  participants: "id",
  activities: "id",
  rounds: "id",
  app_settings: "key",
  admin_settings: "id",
  completions: "participant_id,activity_id,round_id",
};

async function main() {
  const backup: BackupFile = JSON.parse(fs.readFileSync(resolvedPath, "utf-8"));
  console.log(`Restoring backup created at ${backup.createdAt}\n`);

  const supabase = createClient(SUPABASE_URL as string, SERVICE_ROLE_KEY as string);

  for (const table of TABLE_ORDER) {
    const rows = backup.tables[table] ?? [];
    if (rows.length === 0) {
      console.log(`${table.padEnd(14)} 0 row(s) - skipped`);
      continue;
    }

    const { error } = await supabase.from(table).upsert(rows, { onConflict: PRIMARY_KEYS[table] });
    if (error) {
      console.error(`Failed to restore "${table}":`, error.message);
      process.exit(1);
    }
    console.log(`${table.padEnd(14)} ${rows.length} row(s) restored`);
  }

  console.log("\nDone. Existing rows with matching keys were overwritten; nothing was deleted.");
}

main();
