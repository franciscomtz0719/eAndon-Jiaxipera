import { useMemo } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { BarChart3 } from "lucide-react";
import { useAppData } from "../i18n";
import { WorkcenterCard } from "../components/WorkcenterCard";
import { useLiveWorkcenters } from "../lib/useLiveWorkcenters";

/** Route value used for stations that have no area yet. */
export const NO_AREA_PARAM = "none";

export function AreaPage() {
  const { areaId } = useParams<{ areaId: string }>();
  const { t, areas, statusDefinitions, settings } = useAppData();
  const workcenters = useLiveWorkcenters();
  const navigate = useNavigate();

  const unassigned = areaId === NO_AREA_PARAM;
  const area = unassigned ? null : areas.find((a) => String(a.id) === areaId);
  const title = unassigned ? t("NoAreaLabel", "No area") : area?.name;

  const showWorkcenterName = settings.find((s) => s.settingName === "Show workcenter name?")?.currentSetting !== "No";
  const enabledDefinitions = useMemo(() => statusDefinitions.filter((d) => d.statusEnabled), [statusDefinitions]);
  const stations = workcenters.filter((wc) => (unassigned ? wc.areaId === null : String(wc.areaId) === areaId));

  if (!unassigned && !area) return <p>{t("AreaNotFound", "Area not found")}</p>;

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
        <h1 className="page-title">{title}</h1>
        <Link className="btn" to={`/statistics?area=${areaId}`}>
          <BarChart3 size={14} /> {t("AlarmStatistics", "Alarm Statistics")}
        </Link>
      </div>
      {stations.length === 0 ? (
        <div className="card" style={{ textAlign: "center", color: "var(--text-muted)" }}>
          {t("NoStationsInArea", "No stations in this area")}
        </div>
      ) : (
        <div className="tiles-grid">
          {stations.map((wc) => (
            <WorkcenterCard
              key={wc.workcenterId}
              workcenter={wc}
              definitions={enabledDefinitions}
              showName={showWorkcenterName}
              onHeaderClick={() => navigate(`/terminal/${encodeURIComponent(wc.workcenterId)}`)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
