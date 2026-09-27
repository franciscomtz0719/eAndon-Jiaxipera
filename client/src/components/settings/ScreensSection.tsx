import { useCallback, useEffect, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { api } from "../../lib/api";
import type { Screen } from "../../lib/types";
import { useAppData } from "../../i18n";
import { SettingsSection } from "./SettingsSection";
import { AreaSelect } from "./WorkcentersSection";
import { useRowDrafts } from "./useRowDrafts";
import { useSettingsActions } from "./useSettingsActions";

const screenKey = (screen: Screen) => screen.id;

export function ScreensSection() {
  const { t, areas } = useAppData();
  const { reportSave, runAction, confirmDelete } = useSettingsActions();
  const [screens, setScreens] = useState<Screen[]>([]);
  const drafts = useRowDrafts(screens, screenKey);
  const [newName, setNewName] = useState("");
  const [newAreaId, setNewAreaId] = useState<number | null>(null);

  const load = useCallback(() => api.getScreens().then(setScreens).catch(console.error), []);
  useEffect(() => {
    load();
  }, [load]);

  const save = async () => {
    reportSave(await drafts.save((screen, changes) => api.updateScreen(screen.id, changes), (screen) => screen.name));
    await load();
  };

  const add = async () => {
    if (await runAction(() => api.addScreen(newName, newAreaId), t("ItemAdded", "Added"))) {
      setNewName("");
      await load();
    }
  };

  const remove = async (screen: Screen) => {
    if (!confirmDelete(screen.name)) return;
    if (await runAction(() => api.deleteScreen(screen.id), t("ItemDeleted", "Deleted"))) await load();
  };

  return (
    <SettingsSection id="screens" title={t("SCREENS", "SCREENS (TV)")} dirty={drafts.dirty} onSave={save} onDiscard={drafts.discard}>
      <div style={{ overflowX: "auto" }}>
        <table className="data-table" style={{ marginBottom: 14 }}>
          <thead>
            <tr>
              <th>{t("ScreenName", "Screen name")}</th>
              <th>{t("Area", "Area")}</th>
              <th>{t("Volume", "Volume")}</th>
              <th>{t("SoundEnabled", "Sound")}</th>
              <th>{t("KioskAddress", "Kiosk address")}</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {screens.map((saved) => {
              const screen = drafts.valueOf(saved);
              return (
                <tr key={saved.id} className={drafts.isDirty(saved) ? "row-dirty" : undefined}>
                  <td>
                    <input value={screen.name} onChange={(e) => drafts.edit(saved, { name: e.target.value })} />
                  </td>
                  <td>
                    <AreaSelect areas={areas} value={screen.areaId} onChange={(areaId) => drafts.edit(saved, { areaId })} />
                  </td>
                  <td>
                    <input type="number" min={0} max={100} className="input-narrow" value={screen.volume} onChange={(e) => drafts.edit(saved, { volume: Number(e.target.value) })} />
                  </td>
                  <td>
                    <input type="checkbox" checked={screen.soundEnabled} onChange={(e) => drafts.edit(saved, { soundEnabled: e.target.checked })} />
                  </td>
                  <td>
                    <code className="kiosk-url">{`${window.location.origin}/tv/${saved.id}`}</code>
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
      </div>

      <div className="form-row">
        <div className="form-group">
          <label>{t("ScreenName", "Screen name")}</label>
          <input value={newName} onChange={(e) => setNewName(e.target.value)} />
        </div>
        <div className="form-group">
          <label>{t("Area", "Area")}</label>
          <AreaSelect areas={areas} value={newAreaId} onChange={setNewAreaId} />
        </div>
        <button className="btn btn-primary" onClick={add}>
          <Plus size={14} /> {t("AddScreen", "Add screen")}
        </button>
      </div>
    </SettingsSection>
  );
}
