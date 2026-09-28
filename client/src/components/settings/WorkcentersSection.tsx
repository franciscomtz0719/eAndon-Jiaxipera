import { useState } from "react";
import { ArrowDown, ArrowUp, Languages, Plus, Trash2 } from "lucide-react";
import { api } from "../../lib/api";
import type { Area, Workcenter } from "../../lib/types";
import { useAppData } from "../../i18n";
import { SettingsSection } from "./SettingsSection";
import { useRowDrafts } from "./useRowDrafts";
import { toOptionalNumber, useSettingsActions } from "./useSettingsActions";
import { useChineseTranslation } from "./useChineseTranslation";
import { bilingualText } from "../../lib/bilingual";

const workcenterKey = (wc: Workcenter) => wc.workcenterRow;

export function AreaSelect({ areas, value, onChange }: { areas: Area[]; value: number | null; onChange: (areaId: number | null) => void }) {
  const { t } = useAppData();
  return (
    <select className="select" value={value ?? ""} onChange={(e) => onChange(toOptionalNumber(e.target.value))}>
      <option value="">{t("NoArea", "-- No area --")}</option>
      {areas.map((area) => (
        <option key={area.id} value={area.id}>
          {bilingualText(area.name, area.nameZh)}
        </option>
      ))}
    </select>
  );
}

export function WorkcentersSection() {
  const { t, areas, workcenters, refresh } = useAppData();
  const { reportSave, runAction, confirmDelete } = useSettingsActions();
  const drafts = useRowDrafts(workcenters, workcenterKey);
  const [newId, setNewId] = useState("");
  const [newName, setNewName] = useState("");
  const [newNameZh, setNewNameZh] = useState("");
  const [newAreaId, setNewAreaId] = useState<number | null>(null);
  const { translating, translate } = useChineseTranslation();

  const save = async () => {
    reportSave(await drafts.save((wc, changes) => api.updateWorkcenter(wc.workcenterRow, changes), (wc) => wc.workcenterId));
    await refresh();
  };

  const add = async () => {
    if (await runAction(() => api.addWorkcenter({ workcenterId: newId, workcenterName: newName, workcenterNameZh: newNameZh, areaId: newAreaId }), t("ItemAdded", "Added"))) {
      setNewId("");
      setNewName("");
      setNewNameZh("");
      await refresh();
    }
  };

  // Moving renumbers rows, which would re-key pending edits, so it waits until changes are saved.
  const move = async (wc: Workcenter, direction: "up" | "down") => {
    if (await runAction(() => api.moveWorkcenter(wc.workcenterRow, direction))) await refresh();
  };

  const remove = async (wc: Workcenter) => {
    if (!confirmDelete(`${wc.workcenterId} ${wc.workcenterName}`)) return;
    if (await runAction(() => api.deleteWorkcenter(wc.workcenterRow), t("ItemDeleted", "Deleted"))) await refresh();
  };

  return (
    <SettingsSection id="workcenters" title={t("WORKCENTERS", "WORKCENTERS")} dirty={drafts.dirty} onSave={save} onDiscard={drafts.discard}>
      <div style={{ overflowX: "auto" }}>
        <table className="data-table" style={{ marginBottom: 14 }}>
          <thead>
            <tr>
              <th>{t("WorkcenterRow", "Workcenter Row")}</th>
              <th>{t("WorkcenterID", "Workcenter ID")}</th>
              <th>{t("WorkcenterName", "Workcenter Name")}</th>
              <th>{t("WorkcenterNameZh", "Workcenter Name (Chinese)")}</th>
              <th>{t("Area", "Area")}</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {workcenters.map((saved, idx) => {
              const wc = drafts.valueOf(saved);
              return (
                <tr key={saved.workcenterRow} className={drafts.isDirty(saved) ? "row-dirty" : undefined}>
                  <td>{saved.workcenterRow}</td>
                  <td>
                    <input className="input-narrow" value={wc.workcenterId} onChange={(e) => drafts.edit(saved, { workcenterId: e.target.value })} />
                  </td>
                  <td>
                    <input value={wc.workcenterName} onChange={(e) => drafts.edit(saved, { workcenterName: e.target.value })} />
                  </td>
                  <td>
                    <div className="input-group">
                      <input value={wc.workcenterNameZh} onChange={(e) => drafts.edit(saved, { workcenterNameZh: e.target.value })} />
                      <button
                        className="btn"
                        title={t("Translate", "Translate")}
                        disabled={translating !== null}
                        onClick={() => translate(`row-${saved.workcenterRow}`, wc.workcenterName, (workcenterNameZh) => drafts.edit(saved, { workcenterNameZh }))}
                      >
                        <Languages size={14} /> {t("Translate", "Translate")}
                      </button>
                    </div>
                  </td>
                  <td>
                    <AreaSelect areas={areas} value={wc.areaId} onChange={(areaId) => drafts.edit(saved, { areaId })} />
                  </td>
                  <td className="cell-actions">
                    <button className="btn btn-icon" disabled={idx === 0 || drafts.dirty} onClick={() => move(saved, "up")}>
                      <ArrowUp size={14} />
                    </button>
                    <button className="btn btn-icon" disabled={idx === workcenters.length - 1 || drafts.dirty} onClick={() => move(saved, "down")}>
                      <ArrowDown size={14} />
                    </button>
                    <button className="btn btn-icon" title={t("Delete", "Delete")} onClick={() => remove(saved)}>
                      <Trash2 size={14} />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <p className="section-note" style={{ marginBottom: 12 }}>
        {t("ChineseTranslateNote", "Use Translate to fill the Chinese name from the Spanish/English name, then save. It never translates from Chinese.")}
      </p>

      <div className="form-row">
        <div className="form-group">
          <label>{t("WorkcenterIDUnique", "Workcenter ID (unique)")}</label>
          <input value={newId} onChange={(e) => setNewId(e.target.value)} />
        </div>
        <div className="form-group">
          <label>{t("WorkcenterName", "Workcenter Name")}</label>
          <input value={newName} onChange={(e) => setNewName(e.target.value)} />
        </div>
        <div className="form-group">
          <label>{t("WorkcenterNameZh", "Workcenter Name (Chinese)")}</label>
          <div className="input-group">
            <input value={newNameZh} onChange={(e) => setNewNameZh(e.target.value)} />
            <button className="btn" title={t("Translate", "Translate")} disabled={translating !== null} onClick={() => translate("new", newName, setNewNameZh)}>
              <Languages size={14} /> {t("Translate", "Translate")}
            </button>
          </div>
        </div>
        <div className="form-group">
          <label>{t("Area", "Area")}</label>
          <AreaSelect areas={areas} value={newAreaId} onChange={setNewAreaId} />
        </div>
        <button className="btn btn-primary" onClick={add}>
          <Plus size={14} /> {t("AddWorkcenter", "Add workcenter")}
        </button>
      </div>
    </SettingsSection>
  );
}
