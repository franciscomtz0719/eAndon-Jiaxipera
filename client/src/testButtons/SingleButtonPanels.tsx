import { useEffect, useState } from "react";
import { api } from "../lib/api";
import type { Workcenter } from "../lib/types";
import { useAppData } from "../i18n";
import { useOpenEvents } from "../lib/useOpenEvents";
import { useSelections } from "../lib/useSelections";
import { useToast } from "../components/toastContext";
import { WorkcenterName } from "../components/WorkcenterName";

/*
 * TEMPORARY test module (see TestButtonsPage): one button per station, as in single-button mode.
 * Each click is POST /presses/single with source "simulated"; the server cycles the department and
 * confirms it when the countdown ends (events.ts).
 */
export function SingleButtonPanels({ stations }: { stations: Workcenter[] }) {
  const { t, statusDefinitions } = useAppData();
  const { events } = useOpenEvents();
  const selections = useSelections();
  const toast = useToast();
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 250);
    return () => clearInterval(id);
  }, []);

  const definitionOf = (statusRow: number) => statusDefinitions.find((d) => d.statusRow === statusRow);

  const press = (wc: Workcenter) =>
    api.simulateSinglePress(wc.workcenterId).catch((err) => toast.error(err instanceof Error ? err.message : String(err)));

  return (
    <>
      <p className="section-note" style={{ marginBottom: 12 }}>
        {t("TestButtons.SingleHint", "Each press moves to the next department; the call confirms after the countdown. Choosing a department with an open call closes it.")}
      </p>
      <div className="tiles-grid">
        {stations.map((wc) => {
          const selection = selections.get(wc.workcenterId);
          const selected = selection && definitionOf(selection.statusRow);
          const secondsLeft = selection ? Math.max(0, Math.ceil((selection.expiresAt - now) / 1000)) : 0;
          const open = events.filter((e) => e.workcenterId === wc.workcenterId);
          return (
            <div key={wc.workcenterId} className="wc-card">
              <div>
                <div className="wc-id">{wc.workcenterId}</div>
                <div className="wc-name">
                  <WorkcenterName workcenter={wc} />
                </div>
              </div>
              <button type="button" className={`single-button${selection ? " selecting" : ""}`} onClick={() => press(wc)}>
                {selection && selected ? (
                  <>
                    {selected.iconName && <i className={selected.iconName} />}
                    <strong>{selected.statusName}</strong>
                    <span>
                      {selection.action === "close" ? t("TestButtons.WillClose", "Closes in") : t("TestButtons.WillOpen", "Opens in")} {secondsLeft} s
                    </span>
                  </>
                ) : (
                  <strong>{t("TestButtons.PressToCall", "Press to call")}</strong>
                )}
              </button>
              <div className="section-note" style={{ minHeight: 18 }}>
                {open.length > 0 ? open.map((e) => definitionOf(e.statusRow)?.statusName ?? e.departmentName).join(" · ") : t("NoOpenAlarm", "No open alarm")}
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}
