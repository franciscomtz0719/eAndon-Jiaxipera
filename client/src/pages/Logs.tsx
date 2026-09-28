import { useCallback, useEffect, useState } from "react";
import { api } from "../lib/api";
import type { AlarmEvent } from "../lib/types";
import { useAppData } from "../i18n";
import { EventsTable } from "../components/EventsTable";
import { workcenterNameText } from "../components/WorkcenterName";
import { bilingualText } from "../lib/bilingual";
import { useEventChanges } from "../lib/socket";
import { NO_AREA_PARAM } from "./AreaPage";

type StateFilter = "" | "open" | "closed";

export function Logs() {
  const { t, areas, workcenters } = useAppData();
  const [events, setEvents] = useState<AlarmEvent[]>([]);
  const [areaId, setAreaId] = useState("");
  const [workcenterId, setWorkcenterId] = useState("");
  const [state, setState] = useState<StateFilter>("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [reloadToken, setReloadToken] = useState(0);

  const stations = areaId ? workcenters.filter((wc) => (areaId === NO_AREA_PARAM ? wc.areaId === null : String(wc.areaId) === areaId)) : workcenters;
  const hasUnassigned = workcenters.some((wc) => wc.areaId === null);

  useEffect(() => {
    api
      .getEvents({ areaId, workcenterId, state: state || undefined, startDate, endDate })
      .then(setEvents)
      .catch(console.error);
  }, [areaId, workcenterId, state, startDate, endDate, reloadToken]);
  useEventChanges(useCallback(() => setReloadToken((n) => n + 1), []));

  return (
    <div>
      <h1 className="page-title">{t("AlarmLog", "Alarm Log")}</h1>

      <div className="filters-bar">
        <div className="form-group" style={{ marginBottom: 0 }}>
          <label>{t("Area", "Area")}</label>
          <select
            value={areaId}
            onChange={(e) => {
              setAreaId(e.target.value);
              setWorkcenterId("");
            }}
          >
            <option value="">{t("All", "All")}</option>
            {areas.map((area) => (
              <option key={area.id} value={area.id}>
                {bilingualText(area.name, area.nameZh)}
              </option>
            ))}
            {hasUnassigned && <option value={NO_AREA_PARAM}>{t("NoAreaLabel", "No area")}</option>}
          </select>
        </div>
        <div className="form-group" style={{ marginBottom: 0 }}>
          <label>{t("Workcenter", "Workcenter")}</label>
          <select value={workcenterId} onChange={(e) => setWorkcenterId(e.target.value)}>
            <option value="">{t("All", "All")}</option>
            {stations.map((wc) => (
              <option key={wc.workcenterId} value={wc.workcenterId}>
                {wc.workcenterId} {workcenterNameText(wc)}
              </option>
            ))}
          </select>
        </div>
        <div className="form-group" style={{ marginBottom: 0 }}>
          <label>{t("State", "State")}</label>
          <select value={state} onChange={(e) => setState(e.target.value as StateFilter)}>
            <option value="">{t("All", "All")}</option>
            <option value="open">{t("StateOpen", "Open")}</option>
            <option value="closed">{t("StateClosed", "Closed")}</option>
          </select>
        </div>
        <div className="form-group" style={{ marginBottom: 0 }}>
          <label>{t("AlarmStartDate", "Starting Date")}</label>
          <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
        </div>
        <div className="form-group" style={{ marginBottom: 0 }}>
          <label>{t("AlarmEndDate", "Ending Date")}</label>
          <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
        </div>
      </div>

      <div className="card">
        <EventsTable events={events} />
      </div>
    </div>
  );
}
