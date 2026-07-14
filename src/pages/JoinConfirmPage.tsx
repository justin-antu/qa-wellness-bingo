import { useState } from "react";
import type { JoinResult } from "./JoinPage";
import FlipCard from "../components/animata/card/flip-card";
import RippleButton from "../components/animata/button/ripple-button";

interface JoinConfirmPageProps {
  result: JoinResult;
  onContinue: () => void;
}

export default function JoinConfirmPage({ result, onContinue }: JoinConfirmPageProps) {
  const [revealed, setRevealed] = useState(false);

  return (
    <div className="card login-card">
      <h2 className="section-title">You're in, {result.username}!</h2>
      <p className="section-subtitle">Here's your PIN - you'll need it to log in and update your board.</p>

      <button
        type="button"
        className="mx-auto block h-32 w-full max-w-xs cursor-pointer"
        onClick={() => setRevealed(true)}
        aria-label="Tap to reveal your PIN"
      >
        <FlipCard
          flipped={revealed}
          className="h-32 w-full"
          front={
            <div className="flex h-full w-full items-center justify-center rounded-2xl border-2 border-teal bg-teal-light text-lg font-bold text-teal-dark">
              Tap to reveal your PIN
            </div>
          }
          back={
            <div className="flex h-full w-full items-center justify-center rounded-2xl border-2 border-teal bg-white text-4xl font-bold tracking-[0.3em] text-ink">
              {result.pin}
            </div>
          }
        />
      </button>

      <p className="error-text">
        Save this PIN now. If you lose it, you'll need to ask an admin to reset it for you.
      </p>

      <RippleButton className="w-full" onClick={onContinue}>
        Continue to my board
      </RippleButton>
    </div>
  );
}
