import { useEffect, useState } from "react";
import { api } from "../lib/api";
import type { AndonLog, Workcenter } from "../lib/types";
import { useAppData } from "../i18n";
import { WorkcenterName, workcenterNameText } from "../components/WorkcenterName";

export function Logs() {
  const { t, tOption } = useAppData();
  const [workcenters, setWorkcenters] = useState<Workcenter[]>([]);
  const [logs, setLogs] = useState<AndonLog[]>([]);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [workcenterId, setWorkcenterId] = useState("");
  const [showFinishedOnly, setShowFinishedOnly] = useState(false);

  useEffect(() => {
    api.getWorkcenters().then(setWorkcenters).catch(console.error);
  }, []);

  useEffect(() => {
    api.getLogs({ startDate, endDate, workcenterId, showFinishedAlarms: showFinishedOnly }).then(setLogs).catch(console.error);
  }, [startDate, endDate, workcenterId, showFinishedOnly]);

  const chineseNameById = new Map(workcenters.map((wc) => [wc.workcenterId, wc.workcenterNameZh]));

  return (
    <div>
      <h1 className="page-title">{t("AlarmLog", "Alarm Log")}</h1>

      <div className="filters-bar">
        <div className="form-group" style={{ marginBottom: 0 }}>
          <label>{t("AlarmStartDate", "Starting Date")}</label>
          <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
        </div>
        <div className="form-group" style={{ marginBottom: 0 }}>
          <label>{t("AlarmEndDate", "Ending Date")}</label>
          <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
        </div>
        <div className="form-group" style={{ marginBottom: 0 }}>
          <label>{t("Workcenter", "Workcenter")}</label>
          <select className="select" value={workcenterId} onChange={(e) => setWorkcenterId(e.target.value)}>
            <option value="">{t("All", "All")}</option>
            {workcenters.map((wc) => (
              <option key={wc.workcenterId} value={wc.workcenterId}>
                {wc.workcenterId} {workcenterNameText(wc)}
              </option>
            ))}
          </select>
        </div>
        <label className="checkbox-label">
          <input type="checkbox" checked={showFinishedOnly} onChange={(e) => setShowFinishedOnly(e.target.checked)} />
          {t("ShowOnlyFinishedAlarms", "Show only finished alarms:")}
        </label>
      </div>

      <div className="card" style={{ overflowX: "auto" }}>
        <table className="data-table">
          <thead>
            <tr>
              <th>{t("Workcenter", "Workcenter")}</th>
              <th>{t("AlarmName", "Alarm Type")}</th>
              <th>{t("AlarmStartTime", "Alarm Start")}</th>
              <th>{t("AlarmEndTime", "Alarm End")}</th>
              <th>{t("FailureLocation", "Failure Location")}</th>
              <th>{t("FailureType", "Failure Type")}</th>
              <th>{t("FailureDetails", "Failure Details")}</th>
            </tr>
          </thead>
          <tbody>
            {logs.map((log) => (
              <tr key={log.id}>
                <td>
                  {log.workcenterId}{" "}
                  <WorkcenterName workcenter={{ workcenterName: log.workcenterName ?? "", workcenterNameZh: chineseNameById.get(log.workcenterId) ?? "" }} />
                </td>
                <td>{log.alarmName}</td>
                <td>{log.alarmStartTime ? new Date(log.alarmStartTime).toLocaleString() : "—"}</td>
                <td>{log.alarmEndTime ? new Date(log.alarmEndTime).toLocaleString() : "N/A"}</td>
                <td>{tOption(log.alarmStartText1)}</td>
                <td>{tOption(log.alarmStartText2)}</td>
                <td>{log.alarmStartText3}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
