/**
 * One-off admin script: creates a participants row + random 4-digit PIN for
 * each {username, email} entry in `scripts/participants.json`, and writes
 * the plaintext PINs to `scripts/output/participant-pins.csv` for you to
 * privately distribute. This is the bulk alternative to the self-service
 * signup flow (`/` -> Join) or adding people one at a time from `/admin`.
 *
 * PINs are hashed with bcrypt before being stored - the plaintext PIN only
 * ever exists in memory and in the local (gitignored) CSV output.
 *
 * Usage:
 *   1. Copy scripts/participants.example.json -> scripts/participants.json
 *      and fill in your team's usernames + *@rmit.edu.au emails.
 *   2. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in a local .env file
 *      (service role key comes from Supabase project settings > API - never
 *      commit it, and never use it in the frontend).
 *   3. Run: npm run seed
 */
import "dotenv/config";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import bcrypt from "bcryptjs";
import { createClient } from "@supabase/supabase-js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const RMIT_EMAIL_PATTERN = /^[A-Za-z0-9._%+-]+@rmit\.edu\.au$/;

const SUPABASE_URL = process.env.SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error(
    "Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY. Set them in a local .env file (see .env.example)."
  );
  process.exit(1);
}

const participantsPath = path.join(__dirname, "participants.json");
if (!fs.existsSync(participantsPath)) {
  console.error(
    `Missing ${participantsPath}. Copy scripts/participants.example.json to scripts/participants.json and fill in usernames/emails first.`
  );
  process.exit(1);
}

interface ParticipantInput {
  username: string;
  email: string;
}

const entries: ParticipantInput[] = JSON.parse(fs.readFileSync(participantsPath, "utf-8"));

if (!Array.isArray(entries) || entries.length === 0) {
  console.error('scripts/participants.json must be a non-empty array of { "username", "email" } objects.');
  process.exit(1);
}

function generatePin(): string {
  return String(Math.floor(Math.random() * 10000)).padStart(4, "0");
}

async function main() {
  // Service role key bypasses RLS entirely, so this is the one place we talk
  // to the `participants` table directly instead of via an RPC function.
  const supabase = createClient(SUPABASE_URL as string, SERVICE_ROLE_KEY as string);

  const results: { username: string; pin: string }[] = [];

  for (const entry of entries) {
    const username = entry.username?.trim();
    const email = entry.email?.trim();

    if (!username || !email) {
      console.error(`Skipping invalid entry (missing username/email):`, entry);
      continue;
    }
    if (!RMIT_EMAIL_PATTERN.test(email)) {
      console.error(`Skipping ${username}: "${email}" is not a valid *@rmit.edu.au address.`);
      continue;
    }

    const pin = generatePin();
    const pinHash = bcrypt.hashSync(pin, 10);

    const { error } = await supabase
      .from("participants")
      .upsert({ username, email, pin_hash: pinHash }, { onConflict: "username" });

    if (error) {
      console.error(`Failed to seed "${username}":`, error.message);
      continue;
    }

    results.push({ username, pin });
    console.log(`Seeded ${username.padEnd(24)} PIN: ${pin}`);
  }

  const outDir = path.join(__dirname, "output");
  fs.mkdirSync(outDir, { recursive: true });
  const csvPath = path.join(outDir, "participant-pins.csv");
  const csv = ["username,pin", ...results.map((r) => `${r.username},${r.pin}`)].join("\n");
  fs.writeFileSync(csvPath, csv, "utf-8");

  console.log(`\nDone. ${results.length} participant(s) seeded.`);
  console.log(`PINs written to ${csvPath} - distribute privately, then delete the file.`);
}

main();
