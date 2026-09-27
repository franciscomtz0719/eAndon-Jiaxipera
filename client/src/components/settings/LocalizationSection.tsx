import { api } from "../../lib/api";
import type { Localization } from "../../lib/types";
import { useAppData } from "../../i18n";
import { SettingsSection } from "./SettingsSection";
import { useRowDrafts } from "./useRowDrafts";
import { useSettingsActions } from "./useSettingsActions";

const localizationKey = (l: Localization) => l.id;

export function LocalizationSection() {
  const { t, localization, refresh } = useAppData();
  const { reportSave } = useSettingsActions();
  const drafts = useRowDrafts(localization, localizationKey);

  const save = async () => {
    reportSave(await drafts.save((l, { spanish }) => api.updateLocalization(l.id, spanish ?? l.spanish), (l) => l.id));
    await refresh();
  };

  return (
    <SettingsSection id="localization" title={t("LOCALIZATION", "LOCALIZATION")} dirty={drafts.dirty} onSave={save} onDiscard={drafts.discard}>
      <div style={{ maxHeight: 400, overflowY: "auto" }}>
        <table className="data-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>{t("DefaultText", "Default text (English)")}</th>
              <th>{t("LocalizedText", "Localized text (Spanish)")}</th>
            </tr>
          </thead>
          <tbody>
            {localization.map((saved) => (
              <tr key={saved.id} className={drafts.isDirty(saved) ? "row-dirty" : undefined}>
                <td>{saved.id}</td>
                <td>{saved.english}</td>
                <td>
                  <input value={drafts.valueOf(saved).spanish} onChange={(e) => drafts.edit(saved, { spanish: e.target.value })} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </SettingsSection>
  );
}
