import { useState, type FormEvent } from "react";
import { login } from "../api";
import type { Session } from "../session";
import AnimatedBorderTrail from "../components/animata/container/animated-border-trail";
import RippleButton from "../components/animata/button/ripple-button";

interface LoginPageProps {
  onLogin: (session: Session) => void;
  onBack?: () => void;
}

export default function LoginPage({ onLogin, onBack }: LoginPageProps) {
  const [identifier, setIdentifier] = useState("");
  const [pin, setPin] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!identifier.trim() || pin.trim().length !== 4) {
      setError("Enter your username/email and your 4-digit PIN.");
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      const { participantId, username } = await login(identifier.trim(), pin.trim());
      onLogin({ participantId, pin: pin.trim(), username });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong, try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AnimatedBorderTrail className="login-card w-full" contentClassName="p-6">
      <h2 className="section-title">Log in</h2>
      <p className="section-subtitle">
        Enter your username or RMIT email, and the PIN you were given, to check off your challenges.
      </p>
      <form onSubmit={handleSubmit} className="login-form">
        <label className="field-label" htmlFor="identifier">
          Username or RMIT email
        </label>
        <input
          id="identifier"
          className="text-input"
          type="text"
          autoComplete="username"
          value={identifier}
          onChange={(e) => setIdentifier(e.target.value)}
          placeholder="e.g. jordan.lee or jordan.lee@rmit.edu.au"
        />

        <label className="field-label" htmlFor="pin">
          4-digit PIN
        </label>
        <input
          id="pin"
          className="text-input"
          type="text"
          inputMode="numeric"
          maxLength={4}
          autoComplete="off"
          value={pin}
          onChange={(e) => setPin(e.target.value.replace(/\D/g, "").slice(0, 4))}
          placeholder="1234"
        />

        {error && <p className="error-text">{error}</p>}

        <RippleButton type="submit" className="mt-4 w-full" disabled={submitting}>
          {submitting ? "Checking..." : "Log in"}
        </RippleButton>
      </form>
      <p className="hint-text">Lost your PIN? Ask your challenge organiser to reset it.</p>
      {onBack && (
        <p className="hint-text">
          <button type="button" className="link-button" onClick={onBack}>
            Back
          </button>
        </p>
      )}
    </AnimatedBorderTrail>
  );
}
