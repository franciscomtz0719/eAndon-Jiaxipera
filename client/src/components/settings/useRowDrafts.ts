import { useCallback, useState } from "react";

function sameValue(a: unknown, b: unknown) {
  // Arrays (e.g. shift days) are compared by content.
  return JSON.stringify(a) === JSON.stringify(b);
}

export interface SaveResult {
  saved: number;
  failures: string[];
}

/**
 * Keeps unsaved edits per row until the section's "Save changes" button is pressed.
 * A field edited back to its saved value stops counting as a change.
 */
export function useRowDrafts<T extends object>(rows: T[], keyOf: (row: T) => string | number) {
  const [drafts, setDrafts] = useState<Record<string, Partial<T>>>({});

  const valueOf = useCallback((row: T): T => ({ ...row, ...drafts[String(keyOf(row))] }), [drafts, keyOf]);

  const edit = useCallback(
    (row: T, patch: Partial<T>) => {
      setDrafts((prev) => {
        const key = String(keyOf(row));
        const merged: Partial<T> = { ...prev[key], ...patch };
        for (const field of Object.keys(merged) as (keyof T)[]) {
          if (sameValue(merged[field], row[field])) delete merged[field];
        }
        const next = { ...prev };
        if (Object.keys(merged).length > 0) next[key] = merged;
        else delete next[key];
        return next;
      });
    },
    [keyOf],
  );

  const isDirty = useCallback((row: T) => String(keyOf(row)) in drafts, [drafts, keyOf]);
  const dirtyRows = rows.filter(isDirty);

  const discard = useCallback(() => setDrafts({}), []);

  /** Saves each edited row; rows that fail keep their edits so they can be fixed. */
  const save = useCallback(
    async (saveRow: (row: T, changes: Partial<T>) => Promise<unknown>, labelOf: (row: T) => string): Promise<SaveResult> => {
      const result: SaveResult = { saved: 0, failures: [] };
      for (const row of rows) {
        const key = String(keyOf(row));
        const changes = drafts[key];
        if (!changes) continue;
        try {
          await saveRow(row, changes);
          result.saved++;
          setDrafts((prev) => {
            const next = { ...prev };
            delete next[key];
            return next;
          });
        } catch (err) {
          result.failures.push(`${labelOf(row)}: ${err instanceof Error ? err.message : "Error"}`);
        }
      }
      return result;
    },
    [rows, drafts, keyOf],
  );

  return { valueOf, edit, isDirty, dirty: dirtyRows.length > 0, discard, save };
}
