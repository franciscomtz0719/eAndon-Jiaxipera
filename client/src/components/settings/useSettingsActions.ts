import { useCallback } from "react";
import { useAppData } from "../../i18n";
import { useToast } from "../toastContext";
import type { SaveResult } from "./useRowDrafts";

/** Toast feedback shared by every Settings section. */
export function useSettingsActions() {
  const { t } = useAppData();
  const toast = useToast();

  const reportSave = useCallback(
    ({ saved, failures }: SaveResult) => {
      if (failures.length === 0) {
        toast.success(t("ChangesSaved", "Changes saved"));
        return;
      }
      const savedNote = saved > 0 ? `\n${saved} ${t("SavedCount", "saved")}` : "";
      toast.error(`${t("Rejected", "Rejected")}:\n${failures.join("\n")}${savedNote}`);
    },
    [t, toast],
  );

  /** Runs an immediate action (add, delete, move…) and reports the outcome. Returns true on success. */
  const runAction = useCallback(
    async (action: () => Promise<unknown>, successMessage?: string) => {
      try {
        await action();
        if (successMessage) toast.success(successMessage);
        return true;
      } catch (err) {
        toast.error(`${t("Rejected", "Rejected")}: ${err instanceof Error ? err.message : "Error"}`);
        return false;
      }
    },
    [t, toast],
  );

  const confirmDelete = useCallback((label: string) => window.confirm(`${t("ConfirmDelete", "Delete this item? This cannot be undone.")}\n\n${label}`), [t]);

  return { reportSave, runAction, confirmDelete };
}

/** Empty input means "not set" for optional numeric fields. */
export function toOptionalNumber(value: string): number | null {
  return value.trim() === "" ? null : Number(value);
}
