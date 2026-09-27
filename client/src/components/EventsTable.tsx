import type { AlarmEvent } from "../lib/types";
import { useAppData } from "../i18n";

function durationMinutes(event: AlarmEvent) {
  const end = event.closedAt ? new Date(event.closedAt).getTime() : Date.now();
  return ((end - new Date(event.openedAt).getTime()) / 60000).toFixed(1);
}

/** Alarm history rows; used by the alarm log and the station page. */
export function EventsTable({ events, showStation = true }: { events: AlarmEvent[]; showStation?: boolean }) {
  const { t, tOption } = useAppData();
  const actor = (value: string | null) => (value ? t(`Actor_${value}`, value) : "—");

  return (
    <div style={{ overflowX: "auto" }}>
      <table className="data-table">
        <thead>
          <tr>
            {showStation && <th>{t("Workcenter", "Workcenter")}</th>}
            <th>{t("Department", "Department")}</th>
            <th>{t("AlarmStartTime", "Alarm Start")}</th>
            <th>{t("AlarmEndTime", "Alarm End")}</th>
            <th>{t("DurationMin", "Alarm Duration (min)")}</th>
            <th>{t("OpenedBy", "Opened by")}</th>
            <th>{t("ClosedBy", "Closed by")}</th>
            <th>{t("FailureDetails", "Failure Details")}</th>
          </tr>
        </thead>
        <tbody>
          {events.length === 0 && (
            <tr>
              <td colSpan={showStation ? 8 : 7} style={{ textAlign: "center", color: "var(--text-muted)" }}>
                {t("NoData", "No data for this selection")}
              </td>
            </tr>
          )}
          {events.map((event) => (
            <tr key={event.id}>
              {showStation && (
                <td>
                  {event.workcenterId} {event.workcenterName}
                </td>
              )}
              <td>{event.departmentName}</td>
              <td>{new Date(event.openedAt).toLocaleString()}</td>
              <td>{event.closedAt ? new Date(event.closedAt).toLocaleString() : <strong style={{ color: "var(--red-600)" }}>{t("StateOpen", "Open")}</strong>}</td>
              <td>{durationMinutes(event)}</td>
              <td>{actor(event.openedBy)}</td>
              <td>{actor(event.closedBy)}</td>
              <td>{[tOption(event.detailLocation), tOption(event.detailType), event.detailText].filter(Boolean).join(" · ")}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
