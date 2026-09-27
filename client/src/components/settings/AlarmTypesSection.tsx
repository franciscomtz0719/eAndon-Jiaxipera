import { ArrowDown, ArrowUp } from "lucide-react";
import { api } from "../../lib/api";
import type { StatusDefinition } from "../../lib/types";
import { useAppData } from "../../i18n";
import { SettingsSection } from "./SettingsSection";
import { useRowDrafts } from "./useRowDrafts";
import { useSettingsActions } from "./useSettingsActions";

const definitionKey = (def: StatusDefinition) => def.statusRow;

export function AlarmTypesSection() {
  const { t, statusDefinitions, refresh } = useAppData();
  const { reportSave, runAction } = useSettingsActions();
  const drafts = useRowDrafts(statusDefinitions, definitionKey);

  const save = async () => {
    reportSave(
      await drafts.save(
        (def, { statusName, statusEnabled, statusDetailsEnabled, iconName }) =>
          api.updateStatusDefinition(def.statusRow, { statusName, statusEnabled, statusDetailsEnabled, iconName: iconName ?? undefined }),
        (def) => def.statusName,
      ),
    );
    await refresh();
  };

  // Moving swaps fields between rows (see CLAUDE.md E-1), so it waits until pending edits are saved.
  const move = async (def: StatusDefinition, direction: "up" | "down") => {
    if (await runAction(() => api.moveStatusDefinition(def.statusRow, direction))) await refresh();
  };

  return (
    <SettingsSection id="alarm-types" title={t("ALARMTYPES", "ALARM TYPES")} dirty={drafts.dirty} onSave={save} onDiscard={drafts.discard}>
      <div style={{ overflowX: "auto" }}>
        <table className="data-table">
          <thead>
            <tr>
              <th>{t("AlarmTypeName", "Alarm Type Name")}</th>
              <th>{t("Enabled", "Enabled")}</th>
              <th>{t("AlarmTypeIcon", "Alarm Type Icon")}</th>
              <th>{t("DetailEnabled", "Detail enabled")}</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {statusDefinitions.map((saved, idx) => {
              const def = drafts.valueOf(saved);
              return (
                <tr key={saved.statusRow} className={drafts.isDirty(saved) ? "row-dirty" : undefined}>
                  <td>
                    <input value={def.statusName} onChange={(e) => drafts.edit(saved, { statusName: e.target.value })} />
                  </td>
                  <td>
                    <input type="checkbox" checked={def.statusEnabled} onChange={(e) => drafts.edit(saved, { statusEnabled: e.target.checked })} />
                  </td>
                  <td>
                    <input value={def.iconName ?? ""} className="input-short" onChange={(e) => drafts.edit(saved, { iconName: e.target.value })} />
                  </td>
                  <td>
                    <select className="select" value={def.statusDetailsEnabled} onChange={(e) => drafts.edit(saved, { statusDetailsEnabled: Number(e.target.value) })}>
                      <option value={0}>{t("NoDetailsEnabled", "No details enabled")}</option>
                      <option value={1}>{t("EnabledForStart", "Enabled for alarm start")}</option>
                      <option value={2}>{t("EnabledForEnd", "Enabled for alarm end")}</option>
                      <option value={3}>{t("EnabledForStartEnd", "Enabled for alarm start & end")}</option>
                    </select>
                  </td>
                  <td className="cell-actions">
                    <button className="btn btn-icon" disabled={idx === 0 || drafts.dirty} onClick={() => move(saved, "up")}>
                      <ArrowUp size={14} />
                    </button>
                    <button className="btn btn-icon" disabled={idx === statusDefinitions.length - 1 || drafts.dirty} onClick={() => move(saved, "down")}>
                      <ArrowDown size={14} />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </SettingsSection>
  );
}
