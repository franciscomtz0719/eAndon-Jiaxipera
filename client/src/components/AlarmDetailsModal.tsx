import { useState } from "react";
import type { StatusDefinition } from "../lib/types";
import { useTranslation } from "../i18n";

function parseStructure(structure: string | null) {
  const parts = (structure ?? "OFF").split("|");
  return { enabled: parts[0] === "ON", options: parts.slice(1) };
}

export function AlarmDetailsModal({
  definition,
  onCancel,
  onConfirm,
}: {
  definition: StatusDefinition;
  onCancel: () => void;
  onConfirm: (dropdown1: string, dropdown2: string, textField: string) => void;
}) {
  const { t, tOption } = useTranslation();
  const dropdown1 = parseStructure(definition.alarmStartText1Structure);
  const dropdown2 = parseStructure(definition.alarmStartText2Structure);
  const textEnabled = parseStructure(definition.alarmStartText3Structure).enabled;

  const [value1, setValue1] = useState("-- N/A --");
  const [value2, setValue2] = useState("-- N/A --");
  const [text, setText] = useState("");

  return (
    <div className="modal-overlay">
      <div className="modal-panel">
        <h3 style={{ marginBottom: 16 }}>{t("AlarmStartDetails", "Enter details to start the alarm")}</h3>

        <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
          {dropdown1.enabled && (
            <div className="form-group" style={{ flex: 1, minWidth: 160 }}>
              <label>{t("FailureLocation", "Failure Location")}</label>
              <select value={value1} onChange={(e) => setValue1(e.target.value)}>
                <option value="-- N/A --">{t("SelectOption", "-- Select option --")}</option>
                {dropdown1.options.map((opt) => (
                  <option key={opt} value={opt}>
                    {tOption(opt)}
                  </option>
                ))}
              </select>
            </div>
          )}
          {dropdown2.enabled && (
            <div className="form-group" style={{ flex: 1, minWidth: 160 }}>
              <label>{t("FailureType", "Failure Type")}</label>
              <select value={value2} onChange={(e) => setValue2(e.target.value)}>
                <option value="-- N/A --">{t("SelectOption", "-- Select option --")}</option>
                {dropdown2.options.map((opt) => (
                  <option key={opt} value={opt}>
                    {tOption(opt)}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {textEnabled && (
          <div className="form-group">
            <label>{t("DetailsOptional", "Details (optional)")}</label>
            <textarea rows={4} value={text} onChange={(e) => setText(e.target.value)} />
          </div>
        )}

        <div className="modal-footer">
          <button type="button" className="btn" onClick={onCancel}>
            {t("Cancel", "Cancel")}
          </button>
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => onConfirm(dropdown1.enabled ? value1 : "", dropdown2.enabled ? value2 : "", textEnabled ? text : "")}
          >
            {t("ConfirmAlarm", "Confirm Alarm")}
          </button>
        </div>
      </div>
    </div>
  );
}
