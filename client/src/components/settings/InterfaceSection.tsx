import { api } from "../../lib/api";
import type { Settings } from "../../lib/types";
import { useAppData } from "../../i18n";
import { SettingsSection } from "./SettingsSection";
import { useRowDrafts } from "./useRowDrafts";
import { useSettingsActions } from "./useSettingsActions";

const settingKey = (setting: Settings) => setting.settingId;

export function InterfaceSection() {
  const { t, settings, refresh } = useAppData();
  const { reportSave, runAction } = useSettingsActions();
  // The language has its own selector in the sidebar.
  const editable = settings.filter((s) => s.settingName !== "Language");
  const drafts = useRowDrafts(editable, settingKey);

  const save = async () => {
    reportSave(await drafts.save((setting, { currentSetting }) => api.updateSetting(setting.settingId, currentSetting ?? setting.currentSetting), (s) => s.settingName));
    await refresh();
  };

  const reset = async () => {
    if (!window.confirm(t("ConfirmReset", "Reset all interface settings to their defaults?"))) return;
    if (await runAction(() => api.resetSettings(), t("ChangesSaved", "Changes saved"))) {
      drafts.discard();
      await refresh();
    }
  };

  return (
    <SettingsSection id="interface" title={t("INTERFACESETTINGS", "INTERFACE SETTINGS")} dirty={drafts.dirty} onSave={save} onDiscard={drafts.discard}>
      {editable.map((saved) => {
        const setting = drafts.valueOf(saved);
        const options = saved.possibleSettings.split("|");
        return (
          <div key={saved.settingId} className={`form-group${drafts.isDirty(saved) ? " block-dirty" : ""}`}>
            <label>{saved.settingName}</label>
            {options.length > 1 ? (
              <select className="select" style={{ maxWidth: 360 }} value={setting.currentSetting} onChange={(e) => drafts.edit(saved, { currentSetting: e.target.value })}>
                {options.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            ) : (
              <input style={{ maxWidth: 360 }} value={setting.currentSetting} onChange={(e) => drafts.edit(saved, { currentSetting: e.target.value })} />
            )}
          </div>
        );
      })}
      <button className="btn" onClick={reset}>
        {t("ResetToDefaultSettings", "Reset to default settings")}
      </button>
    </SettingsSection>
  );
}
