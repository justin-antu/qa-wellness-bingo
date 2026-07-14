// Admin password is kept in sessionStorage (not localStorage) so it clears
// automatically when the tab/browser closes - appropriate for a single
// shared admin password used occasionally by an organiser, not a per-person
// login.
const STORAGE_KEY = "qa-bingo-admin-session";

export function loadAdminPassword(): string | null {
  return sessionStorage.getItem(STORAGE_KEY);
}

export function saveAdminPassword(password: string): void {
  sessionStorage.setItem(STORAGE_KEY, password);
}

export function clearAdminPassword(): void {
  sessionStorage.removeItem(STORAGE_KEY);
}
