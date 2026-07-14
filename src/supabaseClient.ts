import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

if (!supabaseUrl || !supabaseAnonKey) {
  // Fails loudly at build/runtime rather than silently hitting an invalid
  // client - see README.md for how to set these for local dev and for the
  // GitHub Actions deploy.
  throw new Error(
    "Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY. Copy .env.example to .env.local and fill them in."
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
