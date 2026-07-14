import { Fragment, useEffect, useState, type FormEvent } from "react";
import {
  adminListRounds,
  adminStartNewRound,
  adminRenameCurrentRound,
  adminRoundLeaderboard,
  type AdminRound,
} from "../../adminApi";
import ListSkeleton from "../../components/animata/skeleton/list";
import Modal from "../../components/animata/overlay/modal";

interface RoundsTabProps {
  password: string;
}

export default function RoundsTab({ password }: RoundsTabProps) {
  const [rounds, setRounds] = useState<AdminRound[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [newLabel, setNewLabel] = useState("");
  const [starting, setStarting] = useState(false);
  const [confirmingStart, setConfirmingStart] = useState(false);

  const [renameLabel, setRenameLabel] = useState("");
  const [renaming, setRenaming] = useState(false);

  const [expandedRound, setExpandedRound] = useState<number | null>(null);
  const [roundLeaderboard, setRoundLeaderboard] = useState<
    { username: string; completed_count: number }[] | null
  >(null);

  function refresh() {
    adminListRounds(password)
      .then((data) => {
        setRounds(data);
        const active = data.find((r) => !r.ended_at);
        if (active) setRenameLabel(active.label);
      })
      .catch((err) => setError(err instanceof Error ? err.message : "Failed to load rounds."));
  }

  useEffect(refresh, [password]);

  const activeRound = rounds?.find((r) => !r.ended_at) ?? null;

  function handleStartNewRoundSubmit(e: FormEvent) {
    e.preventDefault();
    setConfirmingStart(true);
  }

  async function confirmStartNewRound() {
    setConfirmingStart(false);
    setStarting(true);
    setError(null);
    try {
      await adminStartNewRound(password, newLabel.trim() || "New round");
      setNewLabel("");
      refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to start new round.");
    } finally {
      setStarting(false);
    }
  }

  async function handleRename(e: FormEvent) {
    e.preventDefault();
    setRenaming(true);
    setError(null);
    try {
      await adminRenameCurrentRound(password, renameLabel.trim() || "Current round");
      refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to rename round.");
    } finally {
      setRenaming(false);
    }
  }

  async function toggleLeaderboard(roundId: number) {
    if (expandedRound === roundId) {
      setExpandedRound(null);
      setRoundLeaderboard(null);
      return;
    }
    setExpandedRound(roundId);
    try {
      const data = await adminRoundLeaderboard(password, roundId);
      setRoundLeaderboard(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load round leaderboard.");
    }
  }

  return (
    <div className="admin-tab-content">
      <div className="card">
        <h3 className="section-title">Current round</h3>
        {activeRound ? (
          <>
            <p className="section-subtitle">
              "{activeRound.label}" started {new Date(activeRound.started_at).toLocaleDateString()} -{" "}
              {activeRound.participant_count} participant(s), {activeRound.total_completions} completions
              so far.
            </p>
            <form onSubmit={handleRename} className="admin-form admin-form-inline">
              <input
                className="text-input"
                value={renameLabel}
                onChange={(e) => setRenameLabel(e.target.value)}
                placeholder="Round label"
              />
              <button type="submit" className="secondary-button" disabled={renaming}>
                {renaming ? "Renaming..." : "Rename"}
              </button>
            </form>
          </>
        ) : (
          <p className="section-subtitle">No active round right now.</p>
        )}
      </div>

      <div className="card">
        <h3 className="section-title">Start a new round</h3>
        <p className="section-subtitle">
          Use this when re-running the challenge (e.g. next season). This resets everyone's board to
          0/25 - past rounds and their results are kept, not deleted.
        </p>
        <form onSubmit={handleStartNewRoundSubmit} className="admin-form admin-form-inline">
          <input
            className="text-input"
            placeholder='e.g. "Round 4 - Spring 2027"'
            value={newLabel}
            onChange={(e) => setNewLabel(e.target.value)}
          />
          <button type="submit" className="primary-button" disabled={starting}>
            {starting ? "Starting..." : "Start new round"}
          </button>
        </form>
        {error && <p className="error-text">{error}</p>}
      </div>

      <div className="card">
        <h3 className="section-title">Round history</h3>
        {!rounds ? (
          <ListSkeleton />
        ) : (
          <table className="admin-table">
            <thead>
              <tr>
                <th>Round</th>
                <th>Started</th>
                <th>Status</th>
                <th>Participants</th>
                <th>Completions</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {rounds.map((r) => (
                <Fragment key={r.round_id}>
                  <tr>
                    <td>{r.label}</td>
                    <td>{new Date(r.started_at).toLocaleDateString()}</td>
                    <td>{r.ended_at ? "Ended" : "Active"}</td>
                    <td>{r.participant_count}</td>
                    <td>{r.total_completions}</td>
                    <td>
                      <button type="button" className="link-button" onClick={() => toggleLeaderboard(r.round_id)}>
                        {expandedRound === r.round_id ? "Hide" : "View"} results
                      </button>
                    </td>
                  </tr>
                  {expandedRound === r.round_id && (
                    <tr>
                      <td colSpan={6}>
                        {!roundLeaderboard ? (
                          <p className="hint-text">Loading...</p>
                        ) : roundLeaderboard.length === 0 ? (
                          <p className="hint-text">No participants in this round.</p>
                        ) : (
                          <ol className="round-detail-list">
                            {roundLeaderboard.map((entry) => (
                              <li key={entry.username}>
                                {entry.username} - {entry.completed_count}/25
                              </li>
                            ))}
                          </ol>
                        )}
                      </td>
                    </tr>
                  )}
                </Fragment>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <Modal
        open={confirmingStart}
        title="Start a new round?"
        description="Everyone's board will go back to 0/25. Past results are kept, not deleted."
        confirmText="Start new round"
        onConfirm={confirmStartNewRound}
        onCancel={() => setConfirmingStart(false)}
      />
    </div>
  );
}
