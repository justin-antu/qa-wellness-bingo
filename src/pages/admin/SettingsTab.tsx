import { useEffect, useState, type FormEvent } from "react";
import { getAppSettings, type AppSettings } from "../../api";
import {
  adminUpdateSettings,
  adminChangePassword,
  adminSetSignupsOpen,
  type AdminSettingsInput,
} from "../../adminApi";
import ToggleSwitch from "../../components/animata/button/toggle-switch";

interface SettingsTabProps {
  password: string;
}

export default function SettingsTab({ password }: SettingsTabProps) {
  const [form, setForm] = useState<AppSettings | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const [signupsSaving, setSignupsSaving] = useState(false);
  const [signupsError, setSignupsError] = useState<string | null>(null);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [pwStatus, setPwStatus] = useState<string | null>(null);
  const [pwError, setPwError] = useState<string | null>(null);
  const [pwSaving, setPwSaving] = useState(false);

  useEffect(() => {
    getAppSettings()
      .then(setForm)
      .catch((err) => setError(err instanceof Error ? err.message : "Failed to load settings."));
  }, []);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!form) return;
    setSaving(true);
    setError(null);
    setStatus(null);
    try {
      const input: AdminSettingsInput = {
        title: form.title,
        kicker: form.kicker,
        subtitle: form.subtitle,
        footer_note: form.footer_note,
        challenge_end_date: form.challenge_end_date,
      };
      await adminUpdateSettings(password, input);
      setStatus("Saved. Changes are live for everyone immediately.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save settings.");
    } finally {
      setSaving(false);
    }
  }

  async function handleToggleSignups(nextOpen: boolean) {
    if (!form) return;
    setSignupsSaving(true);
    setSignupsError(null);
    try {
      await adminSetSignupsOpen(password, nextOpen);
      setForm({ ...form, signups_open: nextOpen ? "true" : "false" });
    } catch (err) {
      setSignupsError(err instanceof Error ? err.message : "Failed to update signups.");
    } finally {
      setSignupsSaving(false);
    }
  }

  async function handlePasswordChange(e: FormEvent) {
    e.preventDefault();
    setPwSaving(true);
    setPwError(null);
    setPwStatus(null);
    try {
      await adminChangePassword(currentPassword, newPassword);
      setPwStatus("Admin password updated.");
      setCurrentPassword("");
      setNewPassword("");
    } catch (err) {
      setPwError(err instanceof Error ? err.message : "Failed to change password.");
    } finally {
      setPwSaving(false);
    }
  }

  if (!form) {
    return <p className="hint-text">{error ?? "Loading settings..."}</p>;
  }

  const signupsOpen = form.signups_open !== "false";

  return (
    <div className="admin-tab-content">
      <div className="card">
        <h3 className="section-title">Self-signup</h3>
        <p className="section-subtitle">
          When open, anyone can join at the homepage with a username + RMIT email. Close this once
          you've reached capacity, or between rounds while you sort out who's in.
        </p>
        <div className="admin-form-inline">
          <ToggleSwitch checked={signupsOpen} onChange={handleToggleSignups} disabled={signupsSaving} />
          <span>
            Signups are currently <strong>{signupsOpen ? "open" : "closed"}</strong>.
          </span>
        </div>
        {signupsError && <p className="error-text">{signupsError}</p>}
      </div>

      <div className="card">
        <h3 className="section-title">Challenge text</h3>
        <p className="section-subtitle">
          Edit the wording shown on the participant-facing app - handy for renaming the challenge each
          time you re-run it.
        </p>
        <form onSubmit={handleSubmit} className="admin-form">
          <label className="field-label" htmlFor="kicker">
            Kicker (small text above the title)
          </label>
          <input
            id="kicker"
            className="text-input"
            value={form.kicker}
            onChange={(e) => setForm({ ...form, kicker: e.target.value })}
          />

          <label className="field-label" htmlFor="title">
            Title
          </label>
          <input
            id="title"
            className="text-input"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
          />

          <label className="field-label" htmlFor="subtitle">
            Subtitle
          </label>
          <input
            id="subtitle"
            className="text-input"
            value={form.subtitle}
            onChange={(e) => setForm({ ...form, subtitle: e.target.value })}
          />

          <label className="field-label" htmlFor="footer_note">
            Footer note (e.g. challenge dates)
          </label>
          <input
            id="footer_note"
            className="text-input"
            value={form.footer_note}
            onChange={(e) => setForm({ ...form, footer_note: e.target.value })}
          />

          <label className="field-label" htmlFor="challenge_end_date">
            Challenge end date (shows an animated countdown banner - leave blank to hide it)
          </label>
          <input
            id="challenge_end_date"
            className="text-input"
            type="date"
            value={form.challenge_end_date}
            onChange={(e) => setForm({ ...form, challenge_end_date: e.target.value })}
          />

          {error && <p className="error-text">{error}</p>}
          {status && <p className="success-text">{status}</p>}

          <button type="submit" className="primary-button" disabled={saving}>
            {saving ? "Saving..." : "Save changes"}
          </button>
        </form>
      </div>

      <div className="card">
        <h3 className="section-title">Admin password</h3>
        <p className="section-subtitle">
          Change the shared admin password. Anyone with this password can edit the challenge, manage
          participants, and start new rounds.
        </p>
        <form onSubmit={handlePasswordChange} className="admin-form">
          <label className="field-label" htmlFor="current-password">
            Current password
          </label>
          <input
            id="current-password"
            className="text-input"
            type="password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
          />

          <label className="field-label" htmlFor="new-password">
            New password
          </label>
          <input
            id="new-password"
            className="text-input"
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
          />

          {pwError && <p className="error-text">{pwError}</p>}
          {pwStatus && <p className="success-text">{pwStatus}</p>}

          <button type="submit" className="primary-button" disabled={pwSaving}>
            {pwSaving ? "Updating..." : "Update password"}
          </button>
        </form>
      </div>
    </div>
  );
}
