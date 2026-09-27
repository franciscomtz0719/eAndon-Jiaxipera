import { useEffect, useMemo, useState } from "react";
import { api } from "../../lib/api";
import type { GatewayConfig } from "../../lib/types";
import { useAppData } from "../../i18n";
import { SettingsSection } from "./SettingsSection";
import { useRowDrafts } from "./useRowDrafts";
import { useSettingsActions } from "./useSettingsActions";

const NUMBER_FIELDS: { key: "port" | "pollIntervalMs" | "timeoutMs" | "watchdogCycles"; label: string; fallback: string }[] = [
  { key: "port", label: "Port", fallback: "Port" },
  { key: "pollIntervalMs", label: "PollInterval", fallback: "Poll interval (ms)" },
  { key: "timeoutMs", label: "TimeoutMs", fallback: "Timeout (ms)" },
  { key: "watchdogCycles", label: "WatchdogCycles", fallback: 'Failed polls before "no communication"' },
];

const gatewayKey = () => "gateway";

export function GatewaySection() {
  const { t } = useAppData();
  const { reportSave } = useSettingsActions();
  const [gateway, setGateway] = useState<GatewayConfig | null>(null);
  const rows = useMemo(() => (gateway ? [gateway] : []), [gateway]);
  const drafts = useRowDrafts(rows, gatewayKey);

  useEffect(() => {
    api.getGateway().then(setGateway).catch(console.error);
  }, []);

  if (!gateway) return null;
  const value = drafts.valueOf(gateway);

  const save = async () => {
    reportSave(await drafts.save((_row, changes) => api.updateGateway(changes).then(setGateway), () => t("GATEWAY", "Gateway")));
  };

  return (
    <SettingsSection
      id="gateway"
      title={t("GATEWAY", "GATEWAY (MODBUS TCP)")}
      note={t("GatewayNote", "Connection used by the acquisition service (phase 2).")}
      dirty={drafts.dirty}
      onSave={save}
      onDiscard={drafts.discard}
    >
      <div className="form-row" style={{ borderTop: "none", paddingTop: 0 }}>
        <div className="form-group">
          <label>{t("GatewayHost", "Gateway IP / host")}</label>
          <input value={value.host} placeholder="192.168.x.x" onChange={(e) => drafts.edit(gateway, { host: e.target.value })} />
        </div>
        {NUMBER_FIELDS.map((field) => (
          <div key={field.key} className="form-group">
            <label>{t(field.label, field.fallback)}</label>
            <input type="number" className="input-short" value={value[field.key]} onChange={(e) => drafts.edit(gateway, { [field.key]: Number(e.target.value) })} />
          </div>
        ))}
        <label className="checkbox-label">
          <input type="checkbox" checked={value.enabled} onChange={(e) => drafts.edit(gateway, { enabled: e.target.checked })} />
          {t("Enabled", "Enabled")}
        </label>
      </div>
    </SettingsSection>
  );
}
