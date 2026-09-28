import { useCallback, useEffect, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { api } from "../../lib/api";
import type { Device, ReadType } from "../../lib/types";
import { useAppData } from "../../i18n";
import { workcenterNameText } from "../WorkcenterName";
import { SettingsSection } from "./SettingsSection";
import { useRowDrafts } from "./useRowDrafts";
import { toOptionalNumber, useSettingsActions } from "./useSettingsActions";

const deviceKey = (device: Device) => device.id;

export function DevicesSection() {
  const { t, statusDefinitions, workcenters } = useAppData();
  const { reportSave, runAction, confirmDelete } = useSettingsActions();
  const [devices, setDevices] = useState<Device[]>([]);
  const drafts = useRowDrafts(devices, deviceKey);
  const [newWorkcenterId, setNewWorkcenterId] = useState("");
  const [newStatusRow, setNewStatusRow] = useState<number | null>(1);

  const load = useCallback(() => api.getDevices().then(setDevices).catch(console.error), []);
  // Deleting or renaming a station cascades to its buttons, so reload when the station list changes.
  useEffect(() => {
    load();
  }, [load, workcenters]);

  const departments = statusDefinitions.filter((d) => d.statusEnabled);
  const departmentName = (statusRow: number | null) =>
    statusRow === null ? t("SingleButtonDevice", "— Single button —") : (statusDefinitions.find((d) => d.statusRow === statusRow)?.statusName ?? String(statusRow));
  const label = (device: Device) => `${device.workcenterId} / ${departmentName(device.statusRow)}`;

  const save = async () => {
    reportSave(await drafts.save((device, changes) => api.updateDevice(device.id, changes), label));
    await load();
  };

  const add = async () => {
    if (await runAction(() => api.addDevice(newWorkcenterId, newStatusRow), t("ItemAdded", "Added"))) await load();
  };

  const remove = async (device: Device) => {
    if (!confirmDelete(label(device))) return;
    if (await runAction(() => api.deleteDevice(device.id), t("ItemDeleted", "Deleted"))) await load();
  };

  const workcenterSelect = (value: string, onChange: (workcenterId: string) => void) => (
    <select className="select" value={value} onChange={(e) => onChange(e.target.value)}>
      {value === "" && <option value="">{t("SelectOption", "-- Select option --")}</option>}
      {workcenters.map((wc) => (
        <option key={wc.workcenterId} value={wc.workcenterId}>
          {wc.workcenterId} {workcenterNameText(wc)}
        </option>
      ))}
    </select>
  );

  // Empty value = single-button device (one button per station; the department is chosen by pressing).
  const departmentSelect = (value: number | null, onChange: (statusRow: number | null) => void) => (
    <select className="select" value={value ?? ""} onChange={(e) => onChange(toOptionalNumber(e.target.value))}>
      <option value="">{t("SingleButtonDevice", "— Single button —")}</option>
      {departments.map((d) => (
        <option key={d.statusRow} value={d.statusRow}>
          {d.statusName}
        </option>
      ))}
    </select>
  );

  return (
    <SettingsSection
      id="devices"
      title={t("BUTTONS", "BUTTONS")}
      note={t("ButtonsNote", "Modbus fields stay empty until the gateway register map (DOCA0241EN) is available.")}
      dirty={drafts.dirty}
      onSave={save}
      onDiscard={drafts.discard}
    >
      <div style={{ overflowX: "auto" }}>
        <table className="data-table" style={{ marginBottom: 14 }}>
          <thead>
            <tr>
              <th>{t("Workcenter", "Workcenter")}</th>
              <th>{t("Department", "Department")}</th>
              <th>{t("Name", "Name")}</th>
              <th>{t("ModbusUnitId", "Modbus virtual server ID")}</th>
              <th>{t("RegisterAddress", "Register address")}</th>
              <th>{t("ReadType", "Read type")}</th>
              <th>{t("Active", "Active")}</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {devices.length === 0 && (
              <tr>
                <td colSpan={8} style={{ textAlign: "center", color: "var(--text-muted)" }}>
                  {t("NoButtonsYet", "No buttons configured yet")}
                </td>
              </tr>
            )}
            {devices.map((saved) => {
              const device = drafts.valueOf(saved);
              return (
                <tr key={saved.id} className={drafts.isDirty(saved) ? "row-dirty" : undefined}>
                  <td>{workcenterSelect(device.workcenterId, (workcenterId) => drafts.edit(saved, { workcenterId }))}</td>
                  <td>{departmentSelect(device.statusRow, (statusRow) => drafts.edit(saved, { statusRow }))}</td>
                  <td>
                    <input className="input-short" value={device.name} onChange={(e) => drafts.edit(saved, { name: e.target.value })} />
                  </td>
                  <td>
                    <input
                      type="number"
                      className="input-narrow"
                      value={device.modbusUnitId ?? ""}
                      onChange={(e) => drafts.edit(saved, { modbusUnitId: toOptionalNumber(e.target.value) })}
                    />
                  </td>
                  <td>
                    <input
                      type="number"
                      className="input-narrow"
                      value={device.registerAddress ?? ""}
                      onChange={(e) => drafts.edit(saved, { registerAddress: toOptionalNumber(e.target.value) })}
                    />
                  </td>
                  <td>
                    <select className="select" value={device.readType} onChange={(e) => drafts.edit(saved, { readType: e.target.value as ReadType })}>
                      <option value="bit">{t("ReadBit", "Bit")}</option>
                      <option value="counter">{t("ReadCounter", "Counter")}</option>
                    </select>
                  </td>
                  <td>
                    <input type="checkbox" checked={device.active} onChange={(e) => drafts.edit(saved, { active: e.target.checked })} />
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
          <label>{t("Workcenter", "Workcenter")}</label>
          {workcenterSelect(newWorkcenterId, setNewWorkcenterId)}
        </div>
        <div className="form-group">
          <label>{t("Department", "Department")}</label>
          {departmentSelect(newStatusRow, setNewStatusRow)}
        </div>
        <button className="btn btn-primary" onClick={add}>
          <Plus size={14} /> {t("AddButton", "Add button")}
        </button>
      </div>
    </SettingsSection>
  );
}
