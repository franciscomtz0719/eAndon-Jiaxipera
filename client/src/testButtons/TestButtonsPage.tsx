import { useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { FlaskConical } from "lucide-react";
import { api } from "../lib/api";
import type { ButtonPress, StatusDefinition, Workcenter } from "../lib/types";
import { useAppData } from "../i18n";
import { useOpenEvents, eventKey } from "../lib/useOpenEvents";
import { useToast } from "../components/toastContext";
import { WorkcenterName } from "../components/WorkcenterName";
import { NO_AREA_PARAM } from "../pages/AreaPage";

/*
 * TEMPORARY test module: imitates the physical button panels until the real buttons are installed.
 * Every click is a physical button press (POST /presses with source "simulated"), so it follows the
 * same rule as the button (open → lockout → close). Delete this folder together with the lines marked
 * "TEST-BUTTONS: remove with module" in App.tsx and Layout.tsx, and the TestButtons.* rows in seed.ts.
 */

interface LastPress {
  statusRow: number;
  result: ButtonPress["result"];
  at: Date;
}

export function TestButtonsPage() {
  const { t, areas, workcenters, statusDefinitions } = useAppData();
  const { openFor } = useOpenEvents();
  const toast = useToast();
  const [searchParams, setSearchParams] = useSearchParams();
  const [pending, setPending] = useState<Set<string>>(() => new Set());
  const [lastPress, setLastPress] = useState<Map<string, LastPress>>(() => new Map());

  const activeAreas = areas.filter((area) => area.active);
  const hasUnassigned = workcenters.some((wc) => wc.areaId === null);
  const areaOptions = [
    ...activeAreas.map((area) => ({ value: String(area.id), label: area.name })),
    ...(hasUnassigned ? [{ value: NO_AREA_PARAM, label: t("NoAreaLabel", "No area") }] : []),
  ];
  const requested = searchParams.get("area");
  const areaParam = areaOptions.some((o) => o.value === requested) ? requested : (areaOptions[0]?.value ?? null);

  const departments = useMemo(
    () => statusDefinitions.filter((d) => d.statusEnabled).sort((a, b) => a.statusRow - b.statusRow),
    [statusDefinitions],
  );
  const stations = workcenters.filter((wc) => (areaParam === NO_AREA_PARAM ? wc.areaId === null : String(wc.areaId) === areaParam));
  const departmentName = (statusRow: number) => statusDefinitions.find((d) => d.statusRow === statusRow)?.statusName ?? String(statusRow);

  const press = async (wc: Workcenter, def: StatusDefinition) => {
    const key = eventKey(wc.workcenterId, def.statusRow);
    setPending((prev) => new Set(prev).add(key));
    try {
      const { result } = await api.simulatePress(wc.workcenterId, def.statusRow);
      setLastPress((prev) => new Map(prev).set(wc.workcenterId, { statusRow: def.statusRow, result, at: new Date() }));
      toast.success(`${wc.workcenterId} · ${def.statusName}: ${t(`Result_${result}`, result)}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : String(err));
    } finally {
      setPending((prev) => {
        const next = new Set(prev);
        next.delete(key);
        return next;
      });
    }
  };

  return (
    <div>
      <h1 className="page-title">{t("TestButtons.Title", "Test button panels")}</h1>
      <div
        className="card"
        style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16, background: "var(--amber-100)", borderColor: "var(--amber-500)", color: "var(--amber-700)", fontWeight: 600 }}
      >
        <FlaskConical size={18} style={{ flexShrink: 0 }} />
        {t("TestButtons.Warning", "Test tool: each click acts as a physical button press. Its alarms are marked as simulated and do not count in statistics.")}
      </div>

      <div className="filters-bar" style={{ marginBottom: 16 }}>
        <label className="form-group" style={{ margin: 0 }}>
          {t("TestButtons.SelectArea", "Area")}
          <select className="select" value={areaParam ?? ""} onChange={(e) => setSearchParams({ area: e.target.value }, { replace: true })}>
            {areaOptions.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      {stations.length === 0 ? (
        <div className="card" style={{ textAlign: "center", color: "var(--text-muted)" }}>
          {t("NoStationsInArea", "No stations in this area")}
        </div>
      ) : (
        <div className="tiles-grid">
          {stations.map((wc) => {
            const last = lastPress.get(wc.workcenterId);
            return (
              <div key={wc.workcenterId} className="wc-card">
                <div>
                  <div className="wc-id">{wc.workcenterId}</div>
                  <div className="wc-name">
                    <WorkcenterName workcenter={wc} />
                  </div>
                </div>
                <div className="status-tiles">
                  {departments.map((def) => {
                    const key = eventKey(wc.workcenterId, def.statusRow);
                    const open = openFor(wc.workcenterId, def.statusRow);
                    return (
                      <button
                        key={def.statusRow}
                        type="button"
                        className={`status-tile ${open ? "red" : "green"}`}
                        disabled={pending.has(key)}
                        title={def.statusName}
                        onClick={() => press(wc, def)}
                      >
                        {def.iconName && <i className={`${def.iconName} status-tile-icon`} />}
                        <span className="status-tile-name">{def.statusName}</span>
                      </button>
                    );
                  })}
                </div>
                <div className="section-note" style={{ minHeight: 18 }}>
                  {last
                    ? `${t("TestButtons.LastPress", "Last press")}: ${departmentName(last.statusRow)} · ${t(`Result_${last.result}`, last.result)} · ${last.at.toLocaleTimeString()}`
                    : t("TestButtons.NoPress", "No presses yet")}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
