export interface Session {
  participantId: string;
  pin: string;
  username: string;
}

const STORAGE_KEY = "qa-bingo-session";

export function loadSession(): Session | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed && parsed.participantId && parsed.pin && parsed.username) {
      return parsed as Session;
    }
    return null;
  } catch {
    return null;
  }
}

export function saveSession(session: Session): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
}

export function clearSession(): void {
  localStorage.removeItem(STORAGE_KEY);
}
