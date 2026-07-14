import { useEffect, useState } from "react";
import Counter from "./animata/text/counter";

const RECHECK_INTERVAL_MS = 60 * 60 * 1000;

interface CountdownBannerProps {
  /** "yyyy-mm-dd", or "" to render nothing. */
  endDate: string;
}

function computeDaysLeft(endDate: string): number | null {
  if (!endDate) return null;
  const end = new Date(`${endDate}T23:59:59`);
  if (Number.isNaN(end.getTime())) return null;
  return Math.ceil((end.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
}

export default function CountdownBanner({ endDate }: CountdownBannerProps) {
  const [daysLeft, setDaysLeft] = useState<number | null>(() => computeDaysLeft(endDate));

  useEffect(() => {
    setDaysLeft(computeDaysLeft(endDate));
    const interval = setInterval(() => setDaysLeft(computeDaysLeft(endDate)), RECHECK_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [endDate]);

  if (daysLeft === null || daysLeft < 0) return null;

  if (daysLeft === 0) {
    return <p className="countdown-banner">Final hours - the challenge ends today! ⏳</p>;
  }

  return (
    <p className="countdown-banner">
      <Counter targetValue={daysLeft} className="countdown-banner-number" />
      <span>{daysLeft === 1 ? "day left in the challenge!" : "days left in the challenge!"}</span>
    </p>
  );
}
