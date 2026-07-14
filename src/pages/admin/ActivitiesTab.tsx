import { useEffect, useState } from "react";
import { adminListActivities, adminUpdateActivity } from "../../adminApi";
import ListSkeleton from "../../components/animata/skeleton/list";

interface ActivitiesTabProps {
  password: string;
}

interface Row {
  position: number;
  title: string;
  savedTitle: string;
  saving: boolean;
  error: string | null;
}

export default function ActivitiesTab({ password }: ActivitiesTabProps) {
  const [rows, setRows] = useState<Row[] | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    adminListActivities(password)
      .then((activities) => {
        const byPosition = new Map(activities.map((a) => [a.position, a.title]));
        setRows(
          Array.from({ length: 25 }, (_, i) => {
            const position = i + 1;
            const title = byPosition.get(position) ?? "";
            return { position, title, savedTitle: title, saving: false, error: null };
          })
        );
      })
      .catch((err) => setLoadError(err instanceof Error ? err.message : "Failed to load activities."));
  }, [password]);

  function updateRow(position: number, patch: Partial<Row>) {
    setRows((prev) => (prev ? prev.map((r) => (r.position === position ? { ...r, ...patch } : r)) : prev));
  }

  async function handleSave(position: number) {
    const row = rows?.find((r) => r.position === position);
    if (!row) return;
    updateRow(position, { saving: true, error: null });
    try {
      await adminUpdateActivity(password, position, row.title);
      updateRow(position, { saving: false, savedTitle: row.title });
    } catch (err) {
      updateRow(position, {
        saving: false,
        error: err instanceof Error ? err.message : "Failed to save.",
      });
    }
  }

  if (!rows) {
    return loadError ? <p className="error-text">{loadError}</p> : <ListSkeleton rows={8} />;
  }

  return (
    <div className="card">
      <h3 className="section-title">Challenge activities</h3>
      <p className="section-subtitle">
        Edit any of the 25 challenges (e.g. to reword them for a new round). Changes apply to the shared
        board immediately - existing checkmarks aren't affected, since they're tied to the slot, not the
        wording.
      </p>
      <div className="activities-editor">
        {rows.map((row) => {
          const dirty = row.title !== row.savedTitle;
          return (
            <div className="activity-row" key={row.position}>
              <span className="activity-row-number">{row.position}</span>
              <input
                className="text-input activity-row-input"
                value={row.title}
                onChange={(e) => updateRow(row.position, { title: e.target.value })}
              />
              <button
                type="button"
                className="secondary-button"
                disabled={!dirty || row.saving}
                onClick={() => handleSave(row.position)}
              >
                {row.saving ? "Saving..." : dirty ? "Save" : "Saved"}
              </button>
              {row.error && <span className="error-text activity-row-error">{row.error}</span>}
            </div>
          );
        })}
      </div>
    </div>
  );
}
