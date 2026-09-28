import { useContext } from "react";
import { ArrowDown, ArrowUp } from "lucide-react";
import { api } from "../../lib/api";
import type { StatusDefinition } from "../../lib/types";
import { useAppData } from "../../i18n";
import { SettingsSection } from "./SettingsSection";
import { DirtySectionsContext } from "./unsavedChanges";
import { useRowDrafts } from "./useRowDrafts";
import { useSettingsActions } from "./useSettingsActions";

const definitionKey = (def: StatusDefinition) => def.statusRow;

export function AlarmTypesSection() {
  const { t, statusDefinitions, refresh } = useAppData();
  const { reportSave, runAction } = useSettingsActions();
  const drafts = useRowDrafts(statusDefinitions, definitionKey);
  // Unsaved edits in the details section are kept per row too, so they would end up on the other department.
  const dirtySections = useContext(DirtySectionsContext);
  const moveBlocked = drafts.dirty || dirtySections.has("alarm-details");

  const save = async () => {
    reportSave(
      await drafts.save(
        // Whether details are asked for is edited in the alarm details section.
        (def, { statusName, statusNameZh, singleButtonOrder, statusEnabled, iconName }) => api.updateStatusDefinition(def.statusRow, { statusName, statusNameZh, singleButtonOrder, statusEnabled, iconName: iconName ?? undefined }),
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
              <th>{t("AlarmTypeNameZh", "Name (Chinese)")}</th>
              <th>{t("Enabled", "Enabled")}</th>
              <th>{t("SingleButtonOrder", "Single-button order")}</th>
              <th>{t("AlarmTypeIcon", "Alarm Type Icon")}</th>
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
                    <input value={def.statusNameZh} onChange={(e) => drafts.edit(saved, { statusNameZh: e.target.value })} />
                  </td>
                  <td>
                    <input type="checkbox" checked={def.statusEnabled} onChange={(e) => drafts.edit(saved, { statusEnabled: e.target.checked })} />
                  </td>
                  <td>
                    <input type="number" min={0} max={99} className="input-narrow" value={def.singleButtonOrder} onChange={(e) => drafts.edit(saved, { singleButtonOrder: Number(e.target.value) })} />
                  </td>
                  <td>
                    <input value={def.iconName ?? ""} className="input-short" onChange={(e) => drafts.edit(saved, { iconName: e.target.value })} />
                  </td>
                  <td className="cell-actions">
                    <button className="btn btn-icon" disabled={idx === 0 || moveBlocked} onClick={() => move(saved, "up")}>
                      <ArrowUp size={14} />
                    </button>
                    <button className="btn btn-icon" disabled={idx === statusDefinitions.length - 1 || moveBlocked} onClick={() => move(saved, "down")}>
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
