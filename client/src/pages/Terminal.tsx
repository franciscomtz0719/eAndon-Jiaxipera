import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { History } from "lucide-react";
import { api } from "../lib/api";
import type { StatusDefinition, Workcenter } from "../lib/types";
import { decodeStatus } from "../lib/types";
import { useAppData } from "../i18n";
import { StatusTile } from "../components/StatusTile";
import { AlarmDetailsModal } from "../components/AlarmDetailsModal";
import { AlarmHistoryModal } from "../components/AlarmHistoryModal";
import { WorkcenterName, workcenterNameText } from "../components/WorkcenterName";
import { useStatusUpdates, type StatusUpdatePayload } from "../lib/socket";

const STATUS_FIELDS = ["status1", "status2", "status3", "status4", "status5"] as const;

export function Terminal() {
  const { workcenterId } = useParams<{ workcenterId: string }>();
  const { t, statusDefinitions, settings } = useAppData();
  const [workcenter, setWorkcenter] = useState<Workcenter | null>(null);
  const [pendingDefinition, setPendingDefinition] = useState<StatusDefinition | null>(null);
  const [showHistory, setShowHistory] = useState(false);

  const showWorkcenterName = settings.find((s) => s.settingName === "Show workcenter name?")?.currentSetting !== "No";
  const enabledDefinitions = useMemo(() => statusDefinitions.filter((d) => d.statusEnabled), [statusDefinitions]);

  useEffect(() => {
    if (!workcenterId) return;
    api.getWorkcenter(workcenterId).then(setWorkcenter).catch(console.error);
  }, [workcenterId]);

  const onStatusUpdate = useCallback(
    (payload: StatusUpdatePayload) => {
      if (payload.workcenterId !== workcenterId) return;
      setWorkcenter((prev) => (prev ? { ...prev, [STATUS_FIELDS[payload.statusIndex]!]: payload.newStatus } : prev));
    },
    [workcenterId],
  );
  useStatusUpdates(onStatusUpdate);

  const applyStatus = async (definition: StatusDefinition, color: "red" | "green", dropdown1 = "", dropdown2 = "", textField = "") => {
    if (!workcenter) return;
    const statusIndex = definition.statusRow - 1;
    const result = await api.setStatus(workcenter.workcenterId, statusIndex, {
      workcenterName: workcenter.workcenterName,
      alarmName: definition.statusName,
      color,
      dropdown1,
      dropdown2,
      textField,
    });
    setWorkcenter((prev) => (prev ? { ...prev, [STATUS_FIELDS[statusIndex]!]: result.newStatus } : prev));
  };

  const handleTileClick = (definition: StatusDefinition) => {
    if (!workcenter) return;
    const raw = workcenter[STATUS_FIELDS[definition.statusRow - 1]!];
    const { color } = decodeStatus(raw);

    if (color === "green") {
      const needsDetails = definition.statusDetailsEnabled === 1 || definition.statusDetailsEnabled === 3;
      if (needsDetails) {
        setPendingDefinition(definition);
      } else {
        applyStatus(definition, "red");
      }
    } else {
      applyStatus(definition, "green");
    }
  };

  if (!workcenter) return <p>Loading...</p>;

  return (
    <div>
      <h1 className="page-title">
        {t("TerminalHeader", "Andon Terminal for workcenter")} {workcenter.workcenterId}
        {showWorkcenterName && ` - ${workcenterNameText(workcenter)}`}
      </h1>

      <div className="card" style={{ marginBottom: 16, fontSize: "0.85rem", color: "var(--text-muted)" }}>
        <div>{t("TerminalInstruction1", "⇒ If a problem arises, click on the relevant green field.")}</div>
        <div>{t("TerminalInstruction2", "⇒ The field turns red, showing the time since the problem started.")}</div>
        <div>{t("TerminalInstruction3", "⇒ After resolving the issue, click on the red field to change it back to green.")}</div>
      </div>

      <div className="card" style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        <div className="wc-card-header" onClick={() => setShowHistory(true)} style={{ cursor: "pointer" }}>
          <div className="wc-id">
            <History size={14} style={{ marginRight: 4, verticalAlign: -2 }} />
            {workcenter.workcenterId} {showWorkcenterName && <WorkcenterName workcenter={workcenter} />}
          </div>
        </div>
        <div className="status-tiles" style={{ gridTemplateColumns: `repeat(${enabledDefinitions.length}, minmax(90px, 1fr))` }}>
          {enabledDefinitions.map((def) => (
            <StatusTile key={def.statusRow} definition={def} rawStatus={workcenter[STATUS_FIELDS[def.statusRow - 1]!]} onClick={() => handleTileClick(def)} />
          ))}
        </div>
      </div>

      {pendingDefinition && (
        <AlarmDetailsModal
          definition={pendingDefinition}
          onCancel={() => setPendingDefinition(null)}
          onConfirm={(d1, d2, text) => {
            applyStatus(pendingDefinition, "red", d1, d2, text);
            setPendingDefinition(null);
          }}
        />
      )}

      {showHistory && (
        <AlarmHistoryModal workcenter={workcenter} onClose={() => setShowHistory(false)} />
      )}
    </div>
  );
}
