import { useEffect, useState, type FormEvent } from "react";
import {
  adminListParticipants,
  adminAddParticipant,
  adminRegeneratePin,
  adminRemoveParticipant,
  type AdminParticipant,
} from "../../adminApi";
import { RMIT_EMAIL_PATTERN } from "../../api";
import ListSkeleton from "../../components/animata/skeleton/list";
import Modal from "../../components/animata/overlay/modal";

interface ParticipantsTabProps {
  password: string;
}

export default function ParticipantsTab({ password }: ParticipantsTabProps) {
  const [participants, setParticipants] = useState<AdminParticipant[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [newUsername, setNewUsername] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [adding, setAdding] = useState(false);
  const [revealedPin, setRevealedPin] = useState<{ username: string; pin: string } | null>(null);

  const [busyId, setBusyId] = useState<string | null>(null);
  const [pendingRemoval, setPendingRemoval] = useState<AdminParticipant | null>(null);

  function refresh() {
    adminListParticipants(password)
      .then(setParticipants)
      .catch((err) => setError(err instanceof Error ? err.message : "Failed to load participants."));
  }

  useEffect(refresh, [password]);

  async function handleAdd(e: FormEvent) {
    e.preventDefault();
    if (!newUsername.trim()) return;
    if (!RMIT_EMAIL_PATTERN.test(newEmail.trim())) {
      setError("Enter a valid *@rmit.edu.au email address.");
      return;
    }
    setAdding(true);
    setError(null);
    try {
      const { pin } = await adminAddParticipant(password, newUsername.trim(), newEmail.trim());
      setRevealedPin({ username: newUsername.trim(), pin });
      setNewUsername("");
      setNewEmail("");
      refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add participant.");
    } finally {
      setAdding(false);
    }
  }

  async function handleRegenerate(participant: AdminParticipant) {
    setBusyId(participant.participant_id);
    setError(null);
    try {
      const pin = await adminRegeneratePin(password, participant.participant_id);
      setRevealedPin({ username: participant.username, pin });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to regenerate PIN.");
    } finally {
      setBusyId(null);
    }
  }

  async function confirmRemove() {
    if (!pendingRemoval) return;
    const participant = pendingRemoval;
    setPendingRemoval(null);
    setBusyId(participant.participant_id);
    setError(null);
    try {
      await adminRemoveParticipant(password, participant.participant_id);
      refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to remove participant.");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="admin-tab-content">
      <div className="card">
        <h3 className="section-title">Add a participant</h3>
        <p className="section-subtitle">
          Same rules as self-signup - username plus a *@rmit.edu.au email. Prefer pointing people at
          the homepage "Join" button when you can; use this for anyone who can't self-signup.
        </p>
        <form onSubmit={handleAdd} className="admin-form admin-form-inline">
          <input
            className="text-input"
            placeholder="Username"
            value={newUsername}
            onChange={(e) => setNewUsername(e.target.value)}
          />
          <input
            className="text-input"
            placeholder="name@rmit.edu.au"
            type="email"
            value={newEmail}
            onChange={(e) => setNewEmail(e.target.value)}
          />
          <button type="submit" className="primary-button" disabled={adding}>
            {adding ? "Adding..." : "Add participant"}
          </button>
        </form>

        {revealedPin && (
          <p className="pin-reveal">
            <strong>{revealedPin.username}</strong>'s PIN is <strong>{revealedPin.pin}</strong> - share it
            with them now, it won't be shown again.
            <button type="button" className="link-button" onClick={() => setRevealedPin(null)}>
              Dismiss
            </button>
          </p>
        )}
        {error && <p className="error-text">{error}</p>}
      </div>

      <div className="card">
        <h3 className="section-title">Participants ({participants?.length ?? 0})</h3>
        {!participants ? (
          <ListSkeleton />
        ) : participants.length === 0 ? (
          <p className="hint-text">No participants yet - add your first one above.</p>
        ) : (
          <table className="admin-table">
            <thead>
              <tr>
                <th>Username</th>
                <th>Email</th>
                <th>Progress</th>
                <th>Joined</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {participants.map((p) => (
                <tr key={p.participant_id}>
                  <td>{p.username}</td>
                  <td>{p.email}</td>
                  <td>{p.completed_count}/25</td>
                  <td>{new Date(p.created_at).toLocaleDateString()}</td>
                  <td className="admin-table-actions">
                    <button
                      type="button"
                      className="link-button"
                      disabled={busyId === p.participant_id}
                      onClick={() => handleRegenerate(p)}
                    >
                      Reset PIN
                    </button>
                    <button
                      type="button"
                      className="link-button link-button-danger"
                      disabled={busyId === p.participant_id}
                      onClick={() => setPendingRemoval(p)}
                    >
                      Remove
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <Modal
        open={pendingRemoval !== null}
        title="Remove participant?"
        description={
          pendingRemoval
            ? `Remove ${pendingRemoval.username}? This deletes their board history too.`
            : ""
        }
        confirmText="Remove"
        danger
        onConfirm={confirmRemove}
        onCancel={() => setPendingRemoval(null)}
      />
    </div>
  );
}
