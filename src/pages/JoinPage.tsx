import { useState, type FormEvent } from "react";
import { signup, RMIT_EMAIL_PATTERN } from "../api";
import AnimatedBorderTrail from "../components/animata/container/animated-border-trail";
import RippleButton from "../components/animata/button/ripple-button";

export interface JoinResult {
  participantId: string;
  pin: string;
  username: string;
}

interface JoinPageProps {
  onJoined: (result: JoinResult) => void;
  onBack: () => void;
}

export default function JoinPage({ onJoined, onBack }: JoinPageProps) {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();

    if (!username.trim()) {
      setError("Enter a username.");
      return;
    }
    if (!RMIT_EMAIL_PATTERN.test(email.trim())) {
      setError("Enter a valid *@rmit.edu.au email address.");
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      const { participantId, pin } = await signup(username.trim(), email.trim());
      onJoined({ participantId, pin, username: username.trim() });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong, try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AnimatedBorderTrail className="login-card w-full" contentClassName="p-6">
      <h2 className="section-title">Join the Challenge</h2>
      <p className="section-subtitle">
        Pick a username (this is what shows up on the leaderboard) and enter your RMIT email - we'll
        generate a PIN for you to log in with.
      </p>
      <form onSubmit={handleSubmit} className="login-form">
        <label className="field-label" htmlFor="join-username">
          Username
        </label>
        <input
          id="join-username"
          className="text-input"
          type="text"
          autoComplete="username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="e.g. jordan.lee"
          maxLength={40}
        />

        <label className="field-label" htmlFor="join-email">
          RMIT email
        </label>
        <input
          id="join-email"
          className="text-input"
          type="email"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="jordan.lee@rmit.edu.au"
        />

        {error && <p className="error-text">{error}</p>}

        <RippleButton type="submit" className="mt-4 w-full" disabled={submitting}>
          {submitting ? "Joining..." : "Join & get my PIN"}
        </RippleButton>
      </form>
      <p className="hint-text">
        <button type="button" className="link-button" onClick={onBack}>
          Back
        </button>
      </p>
    </AnimatedBorderTrail>
  );
}
