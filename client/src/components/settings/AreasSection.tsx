import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { api } from "../../lib/api";
import type { Area } from "../../lib/types";
import { useAppData } from "../../i18n";
import { SettingsSection } from "./SettingsSection";
import { useRowDrafts } from "./useRowDrafts";
import { useSettingsActions } from "./useSettingsActions";

const areaKey = (area: Area) => area.id;

export function AreasSection() {
  const { t, areas, refresh } = useAppData();
  const { reportSave, runAction, confirmDelete } = useSettingsActions();
  const drafts = useRowDrafts(areas, areaKey);
  const [newName, setNewName] = useState("");

  const save = async () => {
    reportSave(await drafts.save((area, changes) => api.updateArea(area.id, changes), (area) => area.name));
    await refresh();
  };

  const add = async () => {
    if (await runAction(() => api.addArea(newName), t("ItemAdded", "Added"))) {
      setNewName("");
      await refresh();
    }
  };

  const remove = async (area: Area) => {
    if (!confirmDelete(area.name)) return;
    if (await runAction(() => api.deleteArea(area.id), t("ItemDeleted", "Deleted"))) await refresh();
  };

  return (
    <SettingsSection id="areas" title={t("AREAS", "AREAS")} dirty={drafts.dirty} onSave={save} onDiscard={drafts.discard}>
      <table className="data-table" style={{ marginBottom: 14 }}>
        <thead>
          <tr>
            <th>{t("AreaName", "Area name")}</th>
            <th>{t("SortOrder", "Order")}</th>
            <th>{t("Active", "Active")}</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {areas.map((saved) => {
            const area = drafts.valueOf(saved);
            return (
              <tr key={saved.id} className={drafts.isDirty(saved) ? "row-dirty" : undefined}>
                <td>
                  <input value={area.name} onChange={(e) => drafts.edit(saved, { name: e.target.value })} />
                </td>
                <td>
                  <input type="number" min={0} className="input-narrow" value={area.sortOrder} onChange={(e) => drafts.edit(saved, { sortOrder: Number(e.target.value) })} />
                </td>
                <td>
                  <input type="checkbox" checked={area.active} onChange={(e) => drafts.edit(saved, { active: e.target.checked })} />
                </td>
                <td className="cell-actions">
                  <button className="btn btn-icon" title={t("Delete", "Delete")} onClick={() => remove(saved)}>
                    <Trash2 size={14} />
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      <div className="form-row">
        <div className="form-group">
          <label>{t("AreaName", "Area name")}</label>
          <input value={newName} onChange={(e) => setNewName(e.target.value)} />
        </div>
        <button className="btn btn-primary" onClick={add}>
          <Plus size={14} /> {t("AddArea", "Add area")}
        </button>
      </div>
    </SettingsSection>
  );
}
