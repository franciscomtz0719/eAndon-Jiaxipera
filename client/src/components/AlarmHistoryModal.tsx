import { useEffect, useState } from "react";
import { api } from "../lib/api";
import type { AlarmHistoryEntry, Workcenter } from "../lib/types";
import { useTranslation } from "../i18n";
import { workcenterNameText } from "./WorkcenterName";

export function AlarmHistoryModal({ workcenter, onClose }: { workcenter: Workcenter; onClose: () => void }) {
  const { workcenterId } = workcenter;
  const { t, tOption } = useTranslation();
  const [entries, setEntries] = useState<AlarmHistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .getAlarmHistory(workcenterId)
      .then(setEntries)
      .finally(() => setLoading(false));
  }, [workcenterId]);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-panel" style={{ maxWidth: 800 }} onClick={(e) => e.stopPropagation()}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <h3>
            {t("AlarmHistory", "Alarm History for workcenter ")}
            {workcenterId} {workcenterNameText(workcenter)}
          </h3>
          <button type="button" className="btn" onClick={onClose}>
            {t("Close", "Close")}
          </button>
        </div>

        {loading ? (
          <p>...</p>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>{t("AlarmName", "Alarm Type")}</th>
                  <th>{t("AlarmStartTime", "Alarm Start")}</th>
                  <th>{t("AlarmEndTime", "Alarm End")}</th>
                  <th>{t("DurationMin", "Alarm Duration (min)")}</th>
                  <th>{t("FailureLocation", "Failure Location")}</th>
                  <th>{t("FailureType", "Failure Type")}</th>
                  <th>{t("FailureDetails", "Failure Details")}</th>
                </tr>
              </thead>
              <tbody>
                {entries.map((entry) => (
                  <tr key={entry.alarmId}>
                    <td>{entry.alarmName}</td>
                    <td>{entry.alarmStartTime ? new Date(entry.alarmStartTime).toLocaleString() : "—"}</td>
                    <td>{entry.alarmEndTime ? new Date(entry.alarmEndTime).toLocaleString() : "N/A"}</td>
                    <td>{entry.durationMinutes.toFixed(1)}</td>
                    <td>{tOption(entry.alarmStartText1)}</td>
                    <td>{tOption(entry.alarmStartText2)}</td>
                    <td>{entry.alarmStartText3}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
