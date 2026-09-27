import { api } from "../../lib/api";
import type { StatusDefinition } from "../../lib/types";
import { useAppData } from "../../i18n";
import { SettingsSection } from "./SettingsSection";
import { useRowDrafts } from "./useRowDrafts";
import { useSettingsActions } from "./useSettingsActions";

const definitionKey = (def: StatusDefinition) => def.statusRow;

const FIELDS = ["alarmStartText1Structure", "alarmStartText2Structure", "alarmStartText3Structure"] as const;

export function AlarmDetailsSection() {
  const { t, statusDefinitions, refresh } = useAppData();
  const { reportSave } = useSettingsActions();
  const drafts = useRowDrafts(statusDefinitions, definitionKey);

  const save = async () => {
    reportSave(
      await drafts.save(
        (saved) => {
          // The endpoint replaces all three structures at once, so send the merged values.
          const def = drafts.valueOf(saved);
          return api.updateStartDetails(saved.statusRow - 1, {
            failureLocationOptions: def.alarmStartText1Structure ?? "OFF",
            failureTypeOptions: def.alarmStartText2Structure ?? "OFF",
            detailsTextOptions: def.alarmStartText3Structure ?? "OFF",
          });
        },
        (def) => def.statusName,
      ),
    );
    await refresh();
  };

  return (
    <SettingsSection
      id="alarm-details"
      title={t("DefineAlarmStartDetails", "Define alarm start details - ")}
      note={`${t("OptionsSeparated", "Options (separated by | )")} — ON|opt1|opt2… / OFF`}
      dirty={drafts.dirty}
      onSave={save}
      onDiscard={drafts.discard}
    >
      {statusDefinitions.map((saved) => {
        const def = drafts.valueOf(saved);
        return (
          <div key={saved.statusRow} className={`form-group${drafts.isDirty(saved) ? " block-dirty" : ""}`}>
            <label>
              {saved.statusName} — {t("FailureLocation", "Failure Location")} / {t("FailureType", "Failure Type")} / {t("DetailsFree", "Details (free text field)")}
            </label>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {FIELDS.map((field, i) => (
                <input
                  key={field}
                  value={def[field] ?? "OFF"}
                  style={{ flex: 1, minWidth: i === 2 ? 100 : 160 }}
                  onChange={(e) => drafts.edit(saved, { [field]: e.target.value })}
                />
              ))}
            </div>
          </div>
        );
      })}
    </SettingsSection>
  );
}
