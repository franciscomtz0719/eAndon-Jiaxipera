import { useState } from "react";
import { api } from "./api";
import type { AlarmEvent, DetailValues, StartDetails, StatusDefinition } from "./types";
import { useAppData } from "../i18n";
import { useToast } from "../components/toastContext";

export function needsDetails({ askOnOpen, location, type, text }: StartDetails) {
  return askOnOpen && (location.enabled || type.enabled || text.enabled);
}

type Details = { detailLocation?: string; detailType?: string; detailText?: string };

/**
 * Open and close alarms from a computer (the server applies the rule in events.ts: open with optional
 * details, close without lockout). When the department asks for details, `pendingOpen` is set and the
 * page shows AlarmDetailsModal wired to `confirmPending` / `cancelPending`.
 */
export function useAlarmActions(onDone?: () => void) {
  const { t } = useAppData();
  const toast = useToast();
  const [busy, setBusy] = useState(false);
  const [pendingOpen, setPendingOpen] = useState<{ workcenterId: string; definition: StatusDefinition } | null>(null);

  const run = async (action: () => Promise<unknown>, success?: string) => {
    setBusy(true);
    try {
      await action();
      if (success) toast.success(success);
      onDone?.();
    } catch (err) {
      toast.error(`${t("Rejected", "Rejected")}: ${err instanceof Error ? err.message : "Error"}`);
    } finally {
      setBusy(false);
    }
  };

  const openAlarm = (workcenterId: string, def: StatusDefinition, details?: Details) =>
    run(() => api.openAlarm({ workcenterId, statusRow: def.statusRow, ...details }), t("AlarmOpened", "Alarm opened"));

  const requestOpen = (workcenterId: string, def: StatusDefinition) =>
    needsDetails(def.startDetails) ? setPendingOpen({ workcenterId, definition: def }) : openAlarm(workcenterId, def);

  const closeAlarm = (event: AlarmEvent) => run(() => api.closeAlarm(event.id), t("AlarmClosed", "Alarm closed"));

  /** Department tile click: open when green, close right away when it has an open alarm. */
  const toggle = (workcenterId: string, def: StatusDefinition, event?: AlarmEvent) =>
    event ? closeAlarm(event) : requestOpen(workcenterId, def);

  const confirmPending = ({ location, type, text }: DetailValues) => {
    if (!pendingOpen) return;
    setPendingOpen(null);
    // Empty values are left out: the server stores them as "not given".
    openAlarm(pendingOpen.workcenterId, pendingOpen.definition, {
      detailLocation: location || undefined,
      detailType: type || undefined,
      detailText: text.trim() || undefined,
    });
  };

  return { busy, run, requestOpen, closeAlarm, toggle, pendingOpen, confirmPending, cancelPending: () => setPendingOpen(null) };
}
