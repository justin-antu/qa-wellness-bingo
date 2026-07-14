import { Camera } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { getMyBoard, toggleActivity, type BoardActivity } from "../api";
import type { Session } from "../session";
import FlipCard from "../components/animata/card/flip-card";
import Counter from "../components/animata/text/counter";
import BingoCelebration from "../components/animata/overlay/bingo-celebration";
import { getCompleteLineIds } from "../lib/bingoLines";
import { dateStamp, downloadElementAsImage } from "../lib/screenshot";

interface BoardPageProps {
  session: Session;
}

export default function BoardPage({ session }: BoardPageProps) {
  const [activities, setActivities] = useState<BoardActivity[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pendingId, setPendingId] = useState<number | null>(null);
  const [capturing, setCapturing] = useState(false);
  const [celebrationKey, setCelebrationKey] = useState(0);
  const [celebrationLabel, setCelebrationLabel] = useState("BINGO!");
  const captureRef = useRef<HTMLDivElement>(null);
  const celebratedLinesRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    let cancelled = false;
    getMyBoard(session.participantId)
      .then((data) => {
        if (cancelled) return;
        setActivities(data);
        // Don't celebrate lines/full-house that were already done before this visit.
        const completedPositions = new Set(data.filter((a) => a.completed).map((a) => a.position));
        celebratedLinesRef.current = new Set(getCompleteLineIds(completedPositions));
        if (data.length > 0 && data.every((a) => a.completed)) {
          celebratedLinesRef.current.add("full-house");
        }
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof Error ? err.message : "Failed to load your board.");
      });
    return () => {
      cancelled = true;
    };
  }, [session.participantId]);

  async function handleToggle(activityId: number) {
    if (!activities || pendingId !== null) return;
    setPendingId(activityId);
    setError(null);
    try {
      const completed = await toggleActivity(session.participantId, session.pin, activityId);
      const updated = activities.map((a) => (a.activity_id === activityId ? { ...a, completed } : a));
      setActivities(updated);

      if (completed) {
        const completedPositions = new Set(updated.filter((a) => a.completed).map((a) => a.position));
        const newLines = getCompleteLineIds(completedPositions).filter(
          (id) => !celebratedLinesRef.current.has(id)
        );
        const isFullHouse = updated.every((a) => a.completed) && !celebratedLinesRef.current.has("full-house");

        newLines.forEach((id) => celebratedLinesRef.current.add(id));
        if (isFullHouse) celebratedLinesRef.current.add("full-house");

        if (isFullHouse) {
          setCelebrationLabel("FULL HOUSE! 🌟");
          setCelebrationKey((k) => k + 1);
        } else if (newLines.length > 0) {
          setCelebrationLabel(newLines.length > 1 ? `BINGO! x${newLines.length}` : "BINGO!");
          setCelebrationKey((k) => k + 1);
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't update that challenge, try again.");
    } finally {
      setPendingId(null);
    }
  }

  async function handleDownload() {
    if (!captureRef.current || capturing) return;
    setCapturing(true);
    const node = captureRef.current;
    node.classList.add("is-capturing");
    try {
      await downloadElementAsImage(node, `${session.username}-board-${dateStamp()}.png`);
    } catch {
      setError("Couldn't create the image, try again.");
    } finally {
      node.classList.remove("is-capturing");
      setCapturing(false);
    }
  }

  if (error && !activities) {
    return <p className="error-text">{error}</p>;
  }

  if (!activities) {
    return <p className="hint-text">Loading your board...</p>;
  }

  const completedCount = activities.filter((a) => a.completed).length;
  const allDone = completedCount === activities.length;

  return (
    <div>
      <BingoCelebration celebrationKey={celebrationKey} label={celebrationLabel} />

      <div ref={captureRef} className="board-capture-area">
        <p className="board-capture-title">{session.username}'s board</p>
        <div className="progress-bar-wrap">
          <div className="progress-header">
            <span>
              <Counter targetValue={completedCount} className="text-base" /> / {activities.length} complete
            </span>
            {allDone && <span className="badge-complete">Bingo master! ⭐</span>}
          </div>
          <div className="progress-track">
            <div
              className="progress-fill"
              style={{ width: `${(completedCount / activities.length) * 100}%` }}
            />
          </div>
        </div>

        <div className="bingo-grid">
          {activities.map((activity) => (
            <button
              key={activity.activity_id}
              type="button"
              className="bingo-cell-slot"
              onClick={() => handleToggle(activity.activity_id)}
              disabled={pendingId === activity.activity_id}
            >
              <FlipCard
                flipped={activity.completed}
                className="h-full w-full"
                front={
                  <div className="bingo-cell">
                    <span className="bingo-cell-text">{activity.title}</span>
                  </div>
                }
                back={
                  <div className="bingo-cell bingo-cell-done">
                    <span className="bingo-check">✓</span>
                    <span className="bingo-cell-text">{activity.title}</span>
                  </div>
                }
              />
            </button>
          ))}
        </div>
      </div>

      {error && <p className="error-text">{error}</p>}

      <div className="board-actions">
        <button type="button" className="link-button" onClick={handleDownload} disabled={capturing}>
          <Camera size={14} className="mr-1 inline-block" />
          {capturing ? "Saving..." : "Save my board as an image"}
        </button>
      </div>
    </div>
  );
}
