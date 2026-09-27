import { useCallback, useEffect, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { api } from "../../lib/api";
import type { Shift } from "../../lib/types";
import { useAppData } from "../../i18n";
import { SettingsSection } from "./SettingsSection";
import { useRowDrafts } from "./useRowDrafts";
import { useSettingsActions } from "./useSettingsActions";

const WEEKDAYS = [1, 2, 3, 4, 5, 6, 7];
const shiftKey = (shift: Shift) => shift.id;

function toggleDay(days: number[], day: number) {
  return days.includes(day) ? days.filter((d) => d !== day) : [...days, day].sort((a, b) => a - b);
}

function DayPicker({ days, onChange }: { days: number[]; onChange: (days: number[]) => void }) {
  const { t } = useAppData();
  return (
    <div className="day-pills">
      {WEEKDAYS.map((day) => (
        <button
          key={day}
          type="button"
          className={`day-pill${days.includes(day) ? " active" : ""}`}
          aria-pressed={days.includes(day)}
          onClick={() => onChange(toggleDay(days, day))}
        >
          {t(`Day${day}`)}
        </button>
      ))}
    </div>
  );
}

export function ShiftsSection() {
  const { t } = useAppData();
  const { reportSave, runAction, confirmDelete } = useSettingsActions();
  const [shifts, setShifts] = useState<Shift[]>([]);
  const drafts = useRowDrafts(shifts, shiftKey);
  const [draft, setDraft] = useState({ name: "", startTime: "06:00", endTime: "14:00", days: [1, 2, 3, 4, 5] });

  const load = useCallback(() => api.getShifts().then(setShifts).catch(console.error), []);
  useEffect(() => {
    load();
  }, [load]);

  const save = async () => {
    reportSave(await drafts.save((shift, changes) => api.updateShift(shift.id, changes), (shift) => shift.name));
    await load();
  };

  const add = async () => {
    if (await runAction(() => api.addShift(draft), t("ItemAdded", "Added"))) {
      setDraft({ ...draft, name: "" });
      await load();
    }
  };

  const remove = async (shift: Shift) => {
    if (!confirmDelete(shift.name)) return;
    if (await runAction(() => api.deleteShift(shift.id), t("ItemDeleted", "Deleted"))) await load();
  };

  return (
    <SettingsSection
      id="shifts"
      title={t("SHIFTS", "SHIFTS")}
      note={t("ShiftCrossesMidnight", "A shift that ends before it starts continues into the next day.")}
      dirty={drafts.dirty}
      onSave={save}
      onDiscard={drafts.discard}
    >
      <div style={{ overflowX: "auto" }}>
        <table className="data-table" style={{ marginBottom: 14 }}>
          <thead>
            <tr>
              <th>{t("ShiftName", "Shift name")}</th>
              <th>{t("ShiftStart", "Start")}</th>
              <th>{t("ShiftEnd", "End")}</th>
              <th>{t("Days", "Days")}</th>
              <th>{t("Active", "Active")}</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {shifts.map((saved) => {
              const shift = drafts.valueOf(saved);
              return (
                <tr key={saved.id} className={drafts.isDirty(saved) ? "row-dirty" : undefined}>
                  <td>
                    <input className="input-short" value={shift.name} onChange={(e) => drafts.edit(saved, { name: e.target.value })} />
                  </td>
                  <td>
                    <input type="time" value={shift.startTime} onChange={(e) => drafts.edit(saved, { startTime: e.target.value })} />
                  </td>
                  <td>
                    <input type="time" value={shift.endTime} onChange={(e) => drafts.edit(saved, { endTime: e.target.value })} />
                  </td>
                  <td>
                    <DayPicker days={shift.days} onChange={(days) => drafts.edit(saved, { days })} />
                  </td>
                  <td>
                    <input type="checkbox" checked={shift.active} onChange={(e) => drafts.edit(saved, { active: e.target.checked })} />
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
          <label>{t("ShiftName", "Shift name")}</label>
          <input className="input-short" value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} />
        </div>
        <div className="form-group">
          <label>{t("ShiftStart", "Start")}</label>
          <input type="time" value={draft.startTime} onChange={(e) => setDraft({ ...draft, startTime: e.target.value })} />
        </div>
        <div className="form-group">
          <label>{t("ShiftEnd", "End")}</label>
          <input type="time" value={draft.endTime} onChange={(e) => setDraft({ ...draft, endTime: e.target.value })} />
        </div>
        <div className="form-group">
          <label>{t("Days", "Days")}</label>
          <DayPicker days={draft.days} onChange={(days) => setDraft({ ...draft, days })} />
        </div>
        <button className="btn btn-primary" onClick={add}>
          <Plus size={14} /> {t("AddShift", "Add shift")}
        </button>
      </div>
    </SettingsSection>
  );
}
