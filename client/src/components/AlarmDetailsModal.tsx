import { useState } from "react";
import type { DetailField, DetailValues, StartDetails } from "../lib/types";
import { useTranslation } from "../i18n";

/** The fields the operator fills in; also used as the preview in Settings. */
export function AlarmDetailsFields({
  details,
  values,
  onChange,
}: {
  details: StartDetails;
  values: DetailValues;
  onChange: (values: DetailValues) => void;
}) {
  const { t, tOption } = useTranslation();

  const dropdown = (field: DetailField, key: "location" | "type", label: string) =>
    field.enabled && (
      <div className="form-group" style={{ flex: 1, minWidth: 160 }}>
        <label>{label}</label>
        <select value={values[key]} onChange={(e) => onChange({ ...values, [key]: e.target.value })}>
          <option value="">{t("SelectOption", "-- Select option --")}</option>
          {field.options.map((opt) => (
            <option key={opt} value={opt}>
              {tOption(opt)}
            </option>
          ))}
        </select>
      </div>
    );

  return (
    <>
      <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
        {dropdown(details.location, "location", t("FailureLocation", "Failure Location"))}
        {dropdown(details.type, "type", t("FailureType", "Failure Type"))}
      </div>

      {details.text.enabled && (
        <div className="form-group">
          <label>{t("DetailsOptional", "Details (optional)")}</label>
          <textarea rows={4} value={values.text} onChange={(e) => onChange({ ...values, text: e.target.value })} />
        </div>
      )}
    </>
  );
}

export function AlarmDetailsModal({
  details,
  onCancel,
  onConfirm,
}: {
  details: StartDetails;
  onCancel: () => void;
  onConfirm: (values: DetailValues) => void;
}) {
  const { t } = useTranslation();
  const [values, setValues] = useState<DetailValues>({ location: "", type: "", text: "" });

  return (
    <div className="modal-overlay">
      <div className="modal-panel">
        <h3 style={{ marginBottom: 16 }}>{t("AlarmStartDetails", "Enter details to start the alarm")}</h3>

        <AlarmDetailsFields details={details} values={values} onChange={setValues} />

        <div className="modal-footer">
          <button type="button" className="btn" onClick={onCancel}>
            {t("Cancel", "Cancel")}
          </button>
          <button type="button" className="btn btn-primary" onClick={() => onConfirm(values)}>
            {t("ConfirmAlarm", "Confirm Alarm")}
          </button>
        </div>
      </div>
    </div>
  );
}
