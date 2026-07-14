import { Camera } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { getLeaderboard, type LeaderboardEntry } from "../api";
import ActivityTicker from "../components/ActivityTicker";
import GlowingCard from "../components/animata/card/glowing-card";
import Counter from "../components/animata/text/counter";
import Reveal from "../components/animata/text/reveal";
import { dateStamp, downloadElementAsImage } from "../lib/screenshot";

const REFRESH_INTERVAL_MS = 20000;
const TOTAL_ACTIVITIES = 25;

export default function LeaderboardPage() {
  const [entries, setEntries] = useState<LeaderboardEntry[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [capturing, setCapturing] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  const refresh = useCallback(() => {
    getLeaderboard()
      .then(setEntries)
      .catch((err) => setError(err instanceof Error ? err.message : "Failed to load leaderboard."));
  }, []);

  useEffect(() => {
    refresh();
    const interval = setInterval(refresh, REFRESH_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [refresh]);

  async function handleDownload() {
    if (!cardRef.current || capturing) return;
    setCapturing(true);
    try {
      await downloadElementAsImage(cardRef.current, `leaderboard-${dateStamp()}.png`);
    } catch {
      setError("Couldn't create the image, try again.");
    } finally {
      setCapturing(false);
    }
  }

  if (error && !entries) {
    return <p className="error-text">{error}</p>;
  }

  if (!entries) {
    return <p className="hint-text">Loading leaderboard...</p>;
  }

  return (
    <div>
      <div className="card" ref={cardRef}>
        <div className="leaderboard-header">
          <h2 className="section-title">Leaderboard</h2>
          <div className="leaderboard-header-actions">
            <button type="button" className="link-button" onClick={handleDownload} disabled={capturing}>
              <Camera size={14} className="mr-1 inline-block" />
              {capturing ? "Saving..." : "Save image"}
            </button>
            <button type="button" className="link-button" onClick={refresh}>
              Refresh
            </button>
          </div>
        </div>
        {entries.length === 0 ? (
          <p className="hint-text">No one has joined yet - be the first!</p>
        ) : (
          <ol className="leaderboard-list">
            {entries.map((entry, index) => {
              const row = (
                <li className="leaderboard-row">
                  <span className="leaderboard-rank">{index + 1}</span>
                  <span className="leaderboard-name">{entry.username}</span>
                  <div className="leaderboard-track">
                    <div
                      className="leaderboard-fill"
                      style={{ width: `${(entry.completed_count / TOTAL_ACTIVITIES) * 100}%` }}
                    />
                  </div>
                  <span className="leaderboard-count">
                    <Counter targetValue={entry.completed_count} className="text-sm" delay={150 * index} />/
                    {TOTAL_ACTIVITIES}
                  </span>
                </li>
              );

              return (
                <Reveal key={entry.username} delayMs={60 * index}>
                  {index === 0 ? (
                    <GlowingCard className="rounded-xl" fromColor="#f5c451" viaColor="#5f9ea0" toColor="#f5c451">
                      <div className="p-1">{row}</div>
                    </GlowingCard>
                  ) : (
                    row
                  )}
                </Reveal>
              );
            })}
          </ol>
        )}
      </div>

      <ActivityTicker />
    </div>
  );
}
