import { supabase } from "./supabaseClient";

export interface BoardActivity {
  activity_id: number;
  position: number;
  title: string;
  completed: boolean;
}

export interface LeaderboardEntry {
  username: string;
  completed_count: number;
}

export const RMIT_EMAIL_PATTERN = /^[A-Za-z0-9._%+-]+@rmit\.edu\.au$/;

export interface SignupResult {
  participantId: string;
  pin: string;
}

export interface AppSettings {
  title: string;
  kicker: string;
  subtitle: string;
  footer_note: string;
  signups_open: string;
  /** "yyyy-mm-dd", or "" to hide the countdown banner. */
  challenge_end_date: string;
}

const DEFAULT_SETTINGS: AppSettings = {
  title: "QA Winter Wellness Challenge",
  kicker: "Pause Every Day",
  subtitle: "QA Winter Wellness Challenge",
  footer_note: "Complete all 25 challenges during Winter! (June to August)",
  signups_open: "true",
  challenge_end_date: "",
};

export async function getAppSettings(): Promise<AppSettings> {
  const { data, error } = await supabase.rpc("get_app_settings");
  if (error) throw new Error(error.message);
  const settings = { ...DEFAULT_SETTINGS };
  for (const row of (data ?? []) as { key: string; value: string }[]) {
    if (row.key in settings) {
      (settings as Record<string, string>)[row.key] = row.value;
    }
  }
  return settings;
}

export interface LoginResult {
  participantId: string;
  username: string;
}

export async function login(identifier: string, pin: string): Promise<LoginResult> {
  const { data, error } = await supabase.rpc("login", { p_identifier: identifier, p_pin: pin });
  if (error) {
    throw new Error(
      error.message.includes("Invalid")
        ? "Username/email or PIN not recognised - double check both."
        : error.message
    );
  }
  const row = (data ?? [])[0] as { participant_id: string; username: string } | undefined;
  if (!row) throw new Error("Login failed - try again.");
  return { participantId: row.participant_id, username: row.username };
}

export async function signup(username: string, email: string): Promise<SignupResult> {
  const { data, error } = await supabase.rpc("signup", { p_username: username, p_email: email });
  if (error) throw new Error(error.message);
  const row = (data ?? [])[0] as { participant_id: string; pin: string } | undefined;
  if (!row) throw new Error("Signup failed - try again.");
  return { participantId: row.participant_id, pin: row.pin };
}

export async function getMyBoard(participantId: string): Promise<BoardActivity[]> {
  const { data, error } = await supabase.rpc("get_my_board", { p_participant_id: participantId });
  if (error) throw new Error(error.message);
  return (data ?? []) as BoardActivity[];
}

export async function toggleActivity(
  participantId: string,
  pin: string,
  activityId: number
): Promise<boolean> {
  const { data, error } = await supabase.rpc("toggle_activity", {
    p_participant_id: participantId,
    p_pin: pin,
    p_activity_id: activityId,
  });
  if (error) throw new Error(error.message);
  return data as boolean;
}

export async function getLeaderboard(): Promise<LeaderboardEntry[]> {
  const { data, error } = await supabase.rpc("get_leaderboard");
  if (error) throw new Error(error.message);
  return (data ?? []) as LeaderboardEntry[];
}

export interface RecentActivityEntry {
  username: string;
  activity_title: string;
  completed_at: string;
}

export async function getRecentActivity(limit = 8): Promise<RecentActivityEntry[]> {
  const { data, error } = await supabase.rpc("get_recent_activity", { p_limit: limit });
  if (error) throw new Error(error.message);
  return (data ?? []) as RecentActivityEntry[];
}
