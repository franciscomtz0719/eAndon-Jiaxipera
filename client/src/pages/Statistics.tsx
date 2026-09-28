import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import {
  BarElement,
  CategoryScale,
  Chart as ChartJS,
  Legend,
  LinearScale,
  Tooltip,
} from "chart.js";
import { Bar } from "react-chartjs-2";
import { api } from "../lib/api";
import type { StatisticsBreakdown, StatisticsSummary } from "../lib/types";
import { useAppData } from "../i18n";
import { workcenterNameText } from "../components/WorkcenterName";
import { bilingualText } from "../lib/bilingual";
import { NO_AREA_PARAM } from "./AreaPage";

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend);

const CHART_COLORS = ["#16a34a", "#0b1f3a", "#2563eb", "#f59e0b", "#dc2626", "#5b6b82"];

function barData(labels: (string | string[])[], values: number[], label: string) {
  return {
    labels,
    datasets: [{ label, data: values, backgroundColor: labels.map((_, i) => CHART_COLORS[i % CHART_COLORS.length]) }],
  };
}

const countTicks = { beginAtZero: true, ticks: { precision: 0 } };
// Every label is shown (no auto-skipping) so no station or option silently disappears from a chart.
const barOptions = { plugins: { legend: { display: false } }, scales: { y: countTicks, x: { ticks: { autoSkip: false } } } };
const departmentOptions = { plugins: { legend: { display: false } }, scales: { y: countTicks, x: { ticks: { autoSkip: false, maxRotation: 0 } } } };
// Horizontal so each station's bilingual name fits on its own line; the chart grows with the station count.
const STATION_ROW_PX = 52;
const stationOptions = { indexAxis: "y" as const, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { x: countTicks, y: { ticks: { autoSkip: false } } } };

function ChartCard({ title, empty, emptyText, children }: { title: string; empty: boolean; emptyText: string; children: React.ReactNode }) {
  return (
    <div className="card">
      <h3 style={{ marginBottom: 10, fontSize: "0.95rem" }}>{title}</h3>
      {empty ? <p style={{ color: "var(--text-muted)", textAlign: "center", padding: "32px 0" }}>{emptyText}</p> : children}
    </div>
  );
}

export function Statistics() {
  const { t, tOption, areas, workcenters } = useAppData();
  const [searchParams, setSearchParams] = useSearchParams();
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [workcenterId, setWorkcenterId] = useState("");
  const [summary, setSummary] = useState<StatisticsSummary | null>(null);
  const [breakdown, setBreakdown] = useState<StatisticsBreakdown | null>(null);

  const activeAreas = areas.filter((area) => area.active);
  const hasUnassigned = workcenters.some((wc) => wc.areaId === null);
  const defaultArea = activeAreas[0] ? String(activeAreas[0].id) : hasUnassigned ? NO_AREA_PARAM : "";
  // The selected area lives in the URL so /statistics?area=… can be linked from an area page.
  const areaId = searchParams.get("area") ?? defaultArea;

  const areaStations = workcenters.filter((wc) => (areaId === NO_AREA_PARAM ? wc.areaId === null : String(wc.areaId) === areaId));

  const selectArea = (value: string) => {
    setWorkcenterId("");
    setSearchParams({ area: value });
  };

  useEffect(() => {
    if (!areaId) return;
    const params = { areaId, startDate, endDate, workcenterId };
    api.getStatistics(params).then(setSummary).catch(console.error);
    api.getStatisticsBreakdown(params).then(setBreakdown).catch(console.error);
  }, [areaId, startDate, endDate, workcenterId]);

  const noData = t("NoData", "No data for this selection");
  const alarmsLabel = t("NumberOfAlarms", "Number of Alarms");

  return (
    <div>
      <h1 className="page-title">{t("AlarmStatistics", "Alarm Statistics")}</h1>

      <div className="filters-bar">
        <div className="form-group" style={{ marginBottom: 0 }}>
          <label>{t("Area", "Area")}</label>
          <select value={areaId} onChange={(e) => selectArea(e.target.value)}>
            {activeAreas.map((area) => (
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
            {areaStations.map((wc) => (
              <option key={wc.workcenterId} value={wc.workcenterId}>
                {wc.workcenterId} {workcenterNameText(wc)}
              </option>
            ))}
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

      <div className="stat-row">
        <div className="stat-card">
          <div className="value">{summary?.totalAlarms ?? 0}</div>
          <div className="label">{t("NoOfFinishedAlarms", "Nr. of finished alarms")}</div>
        </div>
        <div className="stat-card">
          <div className="value">{summary ? (summary.mttr / 60).toFixed(1) : "0.0"}</div>
          <div className="label">{t("MTTR", "Mean time to repair (MTTR)")} (min)</div>
        </div>
        <div className="stat-card">
          <div className="value">{summary ? (summary.mtbf / 60).toFixed(1) : "0.0"}</div>
          <div className="label">{t("MTBF", "Mean time between failures (MTBF)")} (min)</div>
        </div>
      </div>

      <div className="stat-row" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))" }}>
        <ChartCard title={t("AlarmsByStation", "Alarms by station")} empty={!summary || summary.workcenterStatistics.length === 0} emptyText={noData}>
          {summary && (
            <div style={{ height: Math.max(200, summary.workcenterStatistics.length * STATION_ROW_PX + 40) }}>
              <Bar
                data={barData(
                  summary.workcenterStatistics.map((w) => [`${w.workcenterId} ${w.workcenterName}`, w.workcenterNameZh].filter(Boolean)),
                  summary.workcenterStatistics.map((w) => w.numberOfAlarms),
                  alarmsLabel,
                )}
                options={stationOptions}
              />
            </div>
          )}
        </ChartCard>
        <ChartCard title={t("AlarmsByDepartment", "Alarms by department")} empty={!breakdown || breakdown.departmentStatistics.length === 0} emptyText={noData}>
          {breakdown && (
            <Bar
              data={barData(
                breakdown.departmentStatistics.map((d) => d.departmentName),
                breakdown.departmentStatistics.map((d) => d.numberOfAlarms),
                alarmsLabel,
              )}
              options={departmentOptions}
            />
          )}
        </ChartCard>
        <ChartCard title={t("FailureLocation", "Failure Location")} empty={!breakdown || breakdown.alarmLocationStatistics.length === 0} emptyText={noData}>
          {breakdown && (
            <Bar
              data={barData(
                breakdown.alarmLocationStatistics.map((r) => tOption(r.alarmLocation)),
                breakdown.alarmLocationStatistics.map((r) => r.numberOfAlarms),
                alarmsLabel,
              )}
              options={barOptions}
            />
          )}
        </ChartCard>
        <ChartCard title={t("FailureType", "Failure Type")} empty={!breakdown || breakdown.alarmTypeStatistics.length === 0} emptyText={noData}>
          {breakdown && (
            <Bar
              data={barData(
                breakdown.alarmTypeStatistics.map((r) => tOption(r.alarmType)),
                breakdown.alarmTypeStatistics.map((r) => r.numberOfAlarms),
                alarmsLabel,
              )}
              options={barOptions}
            />
          )}
        </ChartCard>
      </div>
    </div>
  );
}
