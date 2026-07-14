import { useCallback, useEffect, useState } from "react";
import { getRecentActivity, type RecentActivityEntry } from "../api";
import Reveal from "./animata/text/reveal";

const REFRESH_INTERVAL_MS = 15000;
const ENTRY_LIMIT = 6;

function timeAgo(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const minutes = Math.floor(diffMs / 60000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export default function ActivityTicker() {
  const [entries, setEntries] = useState<RecentActivityEntry[] | null>(null);

  const refresh = useCallback(() => {
    getRecentActivity(ENTRY_LIMIT)
      .then(setEntries)
      .catch(() => {
        // Nice-to-have widget - fail silently rather than showing an error banner.
      });
  }, []);

  useEffect(() => {
    refresh();
    const interval = setInterval(refresh, REFRESH_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [refresh]);

  if (!entries || entries.length === 0) return null;

  return (
    <div className="card activity-ticker">
      <h3 className="section-title">Recent activity</h3>
      <ul className="activity-ticker-list">
        {entries.map((entry, index) => (
          <Reveal key={`${entry.username}|${entry.activity_title}|${entry.completed_at}`} delayMs={40 * index}>
            <li className="activity-ticker-row">
              <span className="activity-ticker-text">
                <strong>{entry.username}</strong> completed &ldquo;{entry.activity_title}&rdquo;
              </span>
              <span className="activity-ticker-time">{timeAgo(entry.completed_at)}</span>
            </li>
          </Reveal>
        ))}
      </ul>
    </div>
  );
}
