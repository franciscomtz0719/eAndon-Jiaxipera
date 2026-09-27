import { useEffect, useMemo, useState } from "react";
import { api } from "../lib/api";
import type { Workcenter } from "../lib/types";
import { useAppData } from "../i18n";
import { AlarmHistoryModal } from "../components/AlarmHistoryModal";
import { WorkcenterCard } from "../components/WorkcenterCard";
import { hasActiveAlarm, useLiveWorkcenters } from "../lib/useLiveWorkcenters";

export function Overview() {
  const { t, statusDefinitions, settings } = useAppData();
  const workcenters = useLiveWorkcenters();
  const [historyTarget, setHistoryTarget] = useState<Workcenter | null>(null);

  const showWorkcenterName = settings.find((s) => s.settingName === "Show workcenter name?")?.currentSetting !== "No";
  const showOnlyActiveSetting = settings.find((s) => s.settingName === "Show only workcenters with alarms in Overivew?");
  const [showOnlyActive, setShowOnlyActive] = useState(false);

  useEffect(() => {
    if (showOnlyActiveSetting) setShowOnlyActive(showOnlyActiveSetting.currentSetting === "Yes");
  }, [showOnlyActiveSetting]);

  const enabledDefinitions = useMemo(() => statusDefinitions.filter((d) => d.statusEnabled), [statusDefinitions]);

  const visibleWorkcenters = showOnlyActive ? workcenters.filter(hasActiveAlarm) : workcenters;

  const toggleShowOnlyActive = async (checked: boolean) => {
    setShowOnlyActive(checked);
    if (showOnlyActiveSetting) {
      await api.updateSetting(showOnlyActiveSetting.settingId, checked ? "Yes" : "No");
    }
  };

  return (
    <div>
      <h1 className="page-title">{t("AlarmOverview", "Alarm Overview")}</h1>

      <div className="filters-bar">
        <label className="checkbox-label">
          <input type="checkbox" checked={showOnlyActive} onChange={(e) => toggleShowOnlyActive(e.target.checked)} />
          {t("ShowOnlyActiveAlarms", "Show only workcenters with active alarms")}
        </label>
      </div>

      {visibleWorkcenters.length === 0 ? (
        <div className="card" style={{ textAlign: "center", color: "var(--green-700)", fontWeight: 700 }}>
          {t("NoWorkcentersWithActiveAlarms", "--  No workcenters with active alarms --")}
        </div>
      ) : (
        <div className="tiles-grid">
          {visibleWorkcenters.map((wc) => (
            <WorkcenterCard key={wc.workcenterId} workcenter={wc} definitions={enabledDefinitions} showName={showWorkcenterName} onHeaderClick={() => setHistoryTarget(wc)} />
          ))}
        </div>
      )}

      {historyTarget && <AlarmHistoryModal workcenter={historyTarget} onClose={() => setHistoryTarget(null)} />}
    </div>
  );
}
