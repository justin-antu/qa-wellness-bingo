import { useEffect, useState, type FormEvent } from "react";
import { adminLogin } from "../adminApi";
import { loadAdminPassword, saveAdminPassword, clearAdminPassword } from "../adminSession";
import SettingsTab from "./admin/SettingsTab";
import ActivitiesTab from "./admin/ActivitiesTab";
import ParticipantsTab from "./admin/ParticipantsTab";
import RoundsTab from "./admin/RoundsTab";

type Tab = "settings" | "activities" | "participants" | "rounds";

interface AdminPageProps {
  onBack: () => void;
}

export default function AdminPage({ onBack }: AdminPageProps) {
  const [password, setPassword] = useState<string | null>(null);
  const [checkingSaved, setCheckingSaved] = useState(true);
  const [tab, setTab] = useState<Tab>("settings");

  useEffect(() => {
    const saved = loadAdminPassword();
    if (!saved) {
      setCheckingSaved(false);
      return;
    }
    adminLogin(saved)
      .then(() => setPassword(saved))
      .catch(() => clearAdminPassword())
      .finally(() => setCheckingSaved(false));
  }, []);

  if (checkingSaved) return null;

  if (!password) {
    return <AdminLoginGate onSuccess={setPassword} onBack={onBack} />;
  }

  return (
    <div className="app-shell">
      <header className="app-header">
        <p className="app-kicker">Admin</p>
        <h1 className="app-title">Challenge Control Panel</h1>
      </header>

      <nav className="navbar">
        <div className="navbar-tabs">
          <button
            type="button"
            className={`navbar-tab ${tab === "settings" ? "navbar-tab-active" : ""}`}
            onClick={() => setTab("settings")}
          >
            Settings
          </button>
          <button
            type="button"
            className={`navbar-tab ${tab === "activities" ? "navbar-tab-active" : ""}`}
            onClick={() => setTab("activities")}
          >
            Activities
          </button>
          <button
            type="button"
            className={`navbar-tab ${tab === "participants" ? "navbar-tab-active" : ""}`}
            onClick={() => setTab("participants")}
          >
            Participants
          </button>
          <button
            type="button"
            className={`navbar-tab ${tab === "rounds" ? "navbar-tab-active" : ""}`}
            onClick={() => setTab("rounds")}
          >
            Rounds
          </button>
        </div>
        <div className="navbar-user">
          <button type="button" className="link-button" onClick={onBack}>
            Back to app
          </button>
          <button
            type="button"
            className="link-button"
            onClick={() => {
              clearAdminPassword();
              setPassword(null);
            }}
          >
            Log out
          </button>
        </div>
      </nav>

      <main className="app-main">
        {tab === "settings" && <SettingsTab password={password} />}
        {tab === "activities" && <ActivitiesTab password={password} />}
        {tab === "participants" && <ParticipantsTab password={password} />}
        {tab === "rounds" && <RoundsTab password={password} />}
      </main>
    </div>
  );
}

interface AdminLoginGateProps {
  onSuccess: (password: string) => void;
  onBack: () => void;
}

function AdminLoginGate({ onSuccess, onBack }: AdminLoginGateProps) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      await adminLogin(password);
      saveAdminPassword(password);
      onSuccess(password);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong, try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="app-shell">
      <header className="app-header">
        <p className="app-kicker">Admin</p>
        <h1 className="app-title">Challenge Control Panel</h1>
      </header>
      <div className="card login-card">
        <h2 className="section-title">Admin sign in</h2>
        <p className="section-subtitle">Enter the shared admin password to manage this challenge.</p>
        <form onSubmit={handleSubmit} className="login-form">
          <label className="field-label" htmlFor="admin-password">
            Password
          </label>
          <input
            id="admin-password"
            className="text-input"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoFocus
          />
          {error && <p className="error-text">{error}</p>}
          <button type="submit" className="primary-button" disabled={submitting}>
            {submitting ? "Checking..." : "Sign in"}
          </button>
        </form>
        <p className="hint-text">
          <button type="button" className="link-button" onClick={onBack}>
            Back to the challenge board
          </button>
        </p>
      </div>
    </div>
  );
}
