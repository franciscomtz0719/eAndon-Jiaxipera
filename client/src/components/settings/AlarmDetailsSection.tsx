import { useState } from "react";
import { ChevronLeft, Plus, X } from "lucide-react";
import { api } from "../../lib/api";
import type { DetailField, DetailValues, StartDetails, StatusDefinition } from "../../lib/types";
import { needsDetails } from "../../lib/useAlarmActions";
import { useAppData } from "../../i18n";
import { AlarmDetailsFields } from "../AlarmDetailsModal";
import { useToast } from "../toastContext";
import { SettingsSection } from "./SettingsSection";
import { useRowDrafts } from "./useRowDrafts";
import { useSettingsActions } from "./useSettingsActions";

const definitionKey = (def: StatusDefinition) => def.statusRow;

/** Options of one dropdown: chips that can be removed or moved left, plus an "add" field. */
function OptionsEditor({ field, onChange }: { field: DetailField; onChange: (options: string[]) => void }) {
  const { t, tOption } = useAppData();
  const toast = useToast();
  const [newOption, setNewOption] = useState("");

  const add = () => {
    const option = newOption.trim();
    if (!option) return;
    if (option.includes("|")) return toast.error(t("OptionHasPipe", 'Options cannot contain "|"'));
    if (field.options.includes(option)) return toast.error(t("DuplicateOption", "That option already exists"));
    onChange([...field.options, option]);
    setNewOption("");
  };

  const moveLeft = (i: number) => onChange(field.options.map((o, j) => (j === i - 1 ? field.options[i] : j === i ? field.options[i - 1] : o)));

  return (
    <div className="detail-options" style={field.enabled ? undefined : { opacity: 0.55 }}>
      {field.options.length === 0 && <span className="section-note">{t("NoOptionsYet", "No options yet")}</span>}
      {field.options.map((opt, i) => (
        <span key={opt} className="option-chip">
          {i > 0 && (
            <button type="button" title={t("MoveOptionLeft", "Move left")} onClick={() => moveLeft(i)}>
              <ChevronLeft size={12} />
            </button>
          )}
          {tOption(opt)}
          <button type="button" title={t("RemoveOption", "Remove")} onClick={() => onChange(field.options.filter((o) => o !== opt))}>
            <X size={12} />
          </button>
        </span>
      ))}
      <div className="input-group" style={{ minWidth: 220 }}>
        <input
          value={newOption}
          maxLength={100}
          placeholder={t("NewOption", "New option…")}
          onChange={(e) => setNewOption(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") add();
          }}
        />
        <button type="button" className="btn" onClick={add}>
          <Plus size={14} /> {t("AddOption", "Add option")}
        </button>
      </div>
    </div>
  );
}

/** Settings of one department, with a live preview of the dialog the operator will see. */
function DepartmentDetails({ name, details, onChange }: { name: string; details: StartDetails; onChange: (details: StartDetails) => void }) {
  const { t } = useAppData();
  const [preview, setPreview] = useState<DetailValues>({ location: "", type: "", text: "" });
  const anyField = details.location.enabled || details.type.enabled || details.text.enabled;

  const listField = (key: "location" | "type", label: string) => {
    const field = details[key];
    return (
      <div className="form-group">
        <label className="checkbox-label">
          <input type="checkbox" checked={field.enabled} onChange={(e) => onChange({ ...details, [key]: { ...field, enabled: e.target.checked } })} />
          {label}
        </label>
        <OptionsEditor field={field} onChange={(options) => onChange({ ...details, [key]: { ...field, options } })} />
        {field.enabled && field.options.length === 0 && (
          <span className="section-note" style={{ color: "var(--amber-700)" }}>
            {t("NeedsOneOption", "Add at least one option or turn this field off")}
          </span>
        )}
      </div>
    );
  };

  return (
    <>
      <div className="section-header" style={{ marginBottom: 8 }}>
        <h3 className="section-title">{name}</h3>
        <label className="checkbox-label">
          <input type="checkbox" checked={details.askOnOpen} onChange={(e) => onChange({ ...details, askOnOpen: e.target.checked })} />
          {t("AskDetailsOnOpen", "Ask for details when opening from a computer")}
        </label>
      </div>
      {!details.askOnOpen && <p className="section-note">{t("AskDetailsOff", "Details are not requested; the fields below are kept for later.")}</p>}
      {details.askOnOpen && !anyField && (
        <p className="section-note" style={{ color: "var(--amber-700)" }}>
          {t("NoFieldsEnabled", "No field is on, so the dialog will not appear.")}
        </p>
      )}

      {listField("location", t("FailureLocation", "Failure Location"))}
      {listField("type", t("FailureType", "Failure Type"))}
      <div className="form-group">
        <label className="checkbox-label">
          <input type="checkbox" checked={details.text.enabled} onChange={(e) => onChange({ ...details, text: { enabled: e.target.checked } })} />
          {t("DetailsFree", "Details (free text field)")}
        </label>
      </div>

      {needsDetails(details) && (
        <div className="details-preview">
          <p className="section-note" style={{ marginBottom: 8 }}>
            {t("OperatorPreview", "Operator preview")}
          </p>
          <AlarmDetailsFields details={details} values={preview} onChange={setPreview} />
        </div>
      )}
    </>
  );
}

export function AlarmDetailsSection() {
  const { t, statusDefinitions, refresh } = useAppData();
  const { reportSave } = useSettingsActions();
  const drafts = useRowDrafts(statusDefinitions, definitionKey);

  const save = async () => {
    reportSave(await drafts.save((saved) => api.updateAlarmDetails(saved.statusRow, drafts.valueOf(saved).startDetails), (def) => def.statusName));
    await refresh();
  };

  return (
    <SettingsSection
      id="alarm-details"
      title={t("DefineAlarmStartDetails", "Alarm start details")}
      note={t("AlarmDetailsNote", "Asked when an alarm is opened from a computer; physical buttons open without asking. Past alarms keep the option names they were saved with.")}
      dirty={drafts.dirty}
      onSave={save}
      onDiscard={drafts.discard}
    >
      {statusDefinitions.map((saved) => (
        <div key={saved.statusRow} className={`details-department${drafts.isDirty(saved) ? " block-dirty" : ""}`}>
          <DepartmentDetails
            name={saved.statusName}
            details={drafts.valueOf(saved).startDetails}
            onChange={(startDetails) => drafts.edit(saved, { startDetails })}
          />
        </div>
      ))}
    </SettingsSection>
  );
}
