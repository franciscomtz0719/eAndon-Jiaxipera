import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { MousePointerClick } from "lucide-react";
import { api } from "../lib/api";
import type { AlarmEvent, ButtonPress, StatusDefinition } from "../lib/types";
import { useAppData } from "../i18n";
import { StatusTile } from "../components/StatusTile";
import { AlarmDetailsModal } from "../components/AlarmDetailsModal";
import { EventsTable } from "../components/EventsTable";
import { WorkcenterName } from "../components/WorkcenterName";
import { useToast } from "../components/toastContext";
import { useOpenEvents } from "../lib/useOpenEvents";
import { useEventChanges } from "../lib/socket";

const PRESSES_REFRESH_MS = 10_000;

function needsDetails(def: StatusDefinition) {
  const detailsOnStart = def.statusDetailsEnabled === 1 || def.statusDetailsEnabled === 3;
  const anyField = [def.alarmStartText1Structure, def.alarmStartText2Structure, def.alarmStartText3Structure].some((s) => s?.startsWith("ON"));
  return detailsOnStart && anyField;
}

/**
 * Admin view of one station. Normal operation is with the physical buttons; this page is for when a
 * button fails: open (with optional details) or close an alarm, and a test tool that simulates a press.
 */
export function StationPage() {
  const { workcenterId = "" } = useParams<{ workcenterId: string }>();
  const { t, statusDefinitions, workcenters, areas } = useAppData();
  const toast = useToast();
  const { openFor } = useOpenEvents();
  const [pendingOpen, setPendingOpen] = useState<StatusDefinition | null>(null);
  const [presses, setPresses] = useState<ButtonPress[]>([]);
  const [history, setHistory] = useState<AlarmEvent[]>([]);
  const [busy, setBusy] = useState(false);

  const workcenter = workcenters.find((wc) => wc.workcenterId === workcenterId);
  const area = areas.find((a) => a.id === workcenter?.areaId);
  const departments = useMemo(() => statusDefinitions.filter((d) => d.statusEnabled), [statusDefinitions]);
  const departmentName = (statusRow: number) => statusDefinitions.find((d) => d.statusRow === statusRow)?.statusName ?? String(statusRow);

  const reload = useCallback(() => {
    if (!workcenterId) return;
    api.getPresses(workcenterId).then(setPresses).catch(console.error);
    api.getEvents({ workcenterId, limit: "20" }).then(setHistory).catch(console.error);
  }, [workcenterId]);

  // Ignored presses don't broadcast anything, so the press list also refreshes on a timer.
  useEffect(() => {
    reload();
    const id = setInterval(reload, PRESSES_REFRESH_MS);
    return () => clearInterval(id);
  }, [reload]);
  useEventChanges(useCallback((event: AlarmEvent) => event.workcenterId === workcenterId && reload(), [workcenterId, reload]));

  const run = async (action: () => Promise<unknown>, success?: string) => {
    setBusy(true);
    try {
      await action();
      if (success) toast.success(success);
      reload();
    } catch (err) {
      toast.error(`${t("Rejected", "Rejected")}: ${err instanceof Error ? err.message : "Error"}`);
    } finally {
      setBusy(false);
    }
  };

  const openAlarm = (def: StatusDefinition, details?: { detailLocation: string; detailType: string; detailText: string }) =>
    run(() => api.openAlarm({ workcenterId, statusRow: def.statusRow, ...details }), t("AlarmOpened", "Alarm opened"));

  const simulate = (def: StatusDefinition) =>
    run(async () => {
      const { result } = await api.simulatePress(workcenterId, def.statusRow);
      toast.success(`${t("SimulatePress", "Simulate button press")}: ${t(`Result_${result}`, result)}`);
    });

  if (!workcenter) return <p>{t("WorkcenterNotFound", "Station not found")}</p>;

  return (
    <div>
      <h1 className="page-title">
        {workcenter.workcenterId} · <WorkcenterName workcenter={workcenter} />
      </h1>
      <p className="section-note" style={{ marginBottom: 16 }}>
        {area && (
          <>
            <Link to={`/areas/${area.id}`}>{area.name}</Link> ·{" "}
          </>
        )}
        {t("StationPageNote", "Normal operation is with the physical buttons. Use this page when a button fails.")}
      </p>

      <div className="tiles-grid" style={{ marginBottom: 20 }}>
        {departments.map((def) => {
          const event = openFor(workcenterId, def.statusRow);
          return (
            <div key={def.statusRow} className="card" style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <StatusTile definition={def} event={event} />
              <div className="section-note" style={{ minHeight: 18 }}>
                {event
                  ? `${t("OpenedBy", "Opened by")}: ${t(`Actor_${event.openedBy}`, event.openedBy)} · ${new Date(event.openedAt).toLocaleTimeString()}`
                  : t("NoOpenAlarm", "No open alarm")}
              </div>
              {event ? (
                <button className="btn btn-primary" style={{ background: "var(--red-600)", borderColor: "var(--red-600)" }} disabled={busy} onClick={() => run(() => api.closeAlarm(event.id), t("AlarmClosed", "Alarm closed"))}>
                  {t("CloseAlarm", "Close alarm")}
                </button>
              ) : (
                <button className="btn btn-primary" disabled={busy} onClick={() => (needsDetails(def) ? setPendingOpen(def) : openAlarm(def))}>
                  {t("OpenAlarm", "Open alarm")}
                </button>
              )}
              <button className="btn" disabled={busy} title={t("SimulatePressHint", "Test tool: follows the physical button rule and does not count in statistics.")} onClick={() => simulate(def)}>
                <MousePointerClick size={14} /> {t("SimulatePress", "Simulate button press")}
              </button>
            </div>
          );
        })}
      </div>

      <section className="card" style={{ marginBottom: 20 }}>
        <h2 className="section-title" style={{ marginBottom: 12 }}>
          {t("RecentPresses", "Recent button presses")}
        </h2>
        <div style={{ overflowX: "auto" }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>{t("Time", "Time")}</th>
                <th>{t("Department", "Department")}</th>
                <th>{t("Source", "Source")}</th>
                <th>{t("PressResult", "Result")}</th>
              </tr>
            </thead>
            <tbody>
              {presses.length === 0 && (
                <tr>
                  <td colSpan={4} style={{ textAlign: "center", color: "var(--text-muted)" }}>
                    {t("NoPressesYet", "No button presses yet")}
                  </td>
                </tr>
              )}
              {presses.map((press) => (
                <tr key={press.id}>
                  <td>{new Date(press.pressedAt).toLocaleString()}</td>
                  <td>{departmentName(press.statusRow)}</td>
                  <td>{t(`Actor_${press.source}`, press.source)}</td>
                  <td>{t(`Result_${press.result}`, press.result)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="card">
        <h2 className="section-title" style={{ marginBottom: 12 }}>
          {t("AlarmHistory", "Alarm History for workcenter ")}
        </h2>
        <EventsTable events={history} showStation={false} />
      </section>

      {pendingOpen && (
        <AlarmDetailsModal
          definition={pendingOpen}
          onCancel={() => setPendingOpen(null)}
          onConfirm={(detailLocation, detailType, detailText) => {
            const def = pendingOpen;
            setPendingOpen(null);
            openAlarm(def, { detailLocation, detailType, detailText });
          }}
        />
      )}
    </div>
  );
}
