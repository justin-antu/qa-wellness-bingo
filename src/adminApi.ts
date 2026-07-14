import { supabase } from "./supabaseClient";

function friendlyError(error: { message: string }): Error {
  if (error.message.includes("Invalid admin password")) {
    return new Error("Incorrect admin password.");
  }
  return new Error(error.message);
}

export async function adminLogin(password: string): Promise<void> {
  const { error } = await supabase.rpc("admin_login", { p_password: password });
  if (error) throw friendlyError(error);
}

export async function adminSetSignupsOpen(password: string, open: boolean): Promise<void> {
  const { error } = await supabase.rpc("admin_set_signups_open", { p_password: password, p_open: open });
  if (error) throw friendlyError(error);
}

export async function adminChangePassword(currentPassword: string, newPassword: string): Promise<void> {
  const { error } = await supabase.rpc("admin_change_password", {
    p_current_password: currentPassword,
    p_new_password: newPassword,
  });
  if (error) throw friendlyError(error);
}

export interface AdminSettingsInput {
  title: string;
  kicker: string;
  subtitle: string;
  footer_note: string;
  challenge_end_date: string;
}

export async function adminUpdateSettings(password: string, settings: AdminSettingsInput): Promise<void> {
  const { error } = await supabase.rpc("admin_update_settings", {
    p_password: password,
    p_title: settings.title,
    p_kicker: settings.kicker,
    p_subtitle: settings.subtitle,
    p_footer_note: settings.footer_note,
    p_challenge_end_date: settings.challenge_end_date,
  });
  if (error) throw friendlyError(error);
}

export interface AdminActivity {
  activity_id: number;
  position: number;
  title: string;
}

export async function adminListActivities(password: string): Promise<AdminActivity[]> {
  const { data, error } = await supabase.rpc("admin_list_activities", { p_password: password });
  if (error) throw friendlyError(error);
  return (data ?? []) as AdminActivity[];
}

export async function adminUpdateActivity(password: string, position: number, title: string): Promise<void> {
  const { error } = await supabase.rpc("admin_update_activity", {
    p_password: password,
    p_position: position,
    p_title: title,
  });
  if (error) throw friendlyError(error);
}

export interface AdminParticipant {
  participant_id: string;
  username: string;
  email: string;
  created_at: string;
  completed_count: number;
}

export async function adminListParticipants(password: string): Promise<AdminParticipant[]> {
  const { data, error } = await supabase.rpc("admin_list_participants", { p_password: password });
  if (error) throw friendlyError(error);
  return (data ?? []) as AdminParticipant[];
}

export async function adminAddParticipant(
  password: string,
  username: string,
  email: string
): Promise<{ participant_id: string; pin: string }> {
  const { data, error } = await supabase.rpc("admin_add_participant", {
    p_password: password,
    p_username: username,
    p_email: email,
  });
  if (error) throw friendlyError(error);
  const row = (data ?? [])[0] as { participant_id: string; pin: string } | undefined;
  if (!row) throw new Error("Failed to create participant.");
  return row;
}

export async function adminRegeneratePin(password: string, participantId: string): Promise<string> {
  const { data, error } = await supabase.rpc("admin_regenerate_pin", {
    p_password: password,
    p_participant_id: participantId,
  });
  if (error) throw friendlyError(error);
  return data as string;
}

export async function adminRemoveParticipant(password: string, participantId: string): Promise<void> {
  const { error } = await supabase.rpc("admin_remove_participant", {
    p_password: password,
    p_participant_id: participantId,
  });
  if (error) throw friendlyError(error);
}

export interface AdminRound {
  round_id: number;
  label: string;
  started_at: string;
  ended_at: string | null;
  participant_count: number;
  total_completions: number;
}

export async function adminListRounds(password: string): Promise<AdminRound[]> {
  const { data, error } = await supabase.rpc("admin_list_rounds", { p_password: password });
  if (error) throw friendlyError(error);
  return (data ?? []) as AdminRound[];
}

export async function adminRoundLeaderboard(
  password: string,
  roundId: number
): Promise<{ username: string; completed_count: number }[]> {
  const { data, error } = await supabase.rpc("admin_round_leaderboard", {
    p_password: password,
    p_round_id: roundId,
  });
  if (error) throw friendlyError(error);
  return (data ?? []) as { username: string; completed_count: number }[];
}

export async function adminStartNewRound(password: string, label: string): Promise<number> {
  const { data, error } = await supabase.rpc("admin_start_new_round", { p_password: password, p_label: label });
  if (error) throw friendlyError(error);
  return data as number;
}

export async function adminRenameCurrentRound(password: string, label: string): Promise<void> {
  const { error } = await supabase.rpc("admin_rename_current_round", { p_password: password, p_label: label });
  if (error) throw friendlyError(error);
}
