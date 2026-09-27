import { History } from "lucide-react";
import type { AlarmEvent, StatusDefinition, Workcenter } from "../lib/types";
import { StatusTile } from "./StatusTile";
import { WorkcenterName } from "./WorkcenterName";

export function WorkcenterCard({
  workcenter,
  definitions,
  showName,
  openFor,
  onHeaderClick,
}: {
  workcenter: Workcenter;
  definitions: StatusDefinition[];
  showName: boolean;
  openFor: (workcenterId: string, statusRow: number) => AlarmEvent | undefined;
  onHeaderClick: () => void;
}) {
  return (
    <div className="wc-card">
      <div className="wc-card-header" onClick={onHeaderClick}>
        <div>
          <div className="wc-id">
            <History size={13} style={{ marginRight: 4, verticalAlign: -2 }} />
            {workcenter.workcenterId}
          </div>
          {showName && (
            <div className="wc-name">
              <WorkcenterName workcenter={workcenter} />
            </div>
          )}
        </div>
      </div>
      <div className="status-tiles">
        {definitions.map((def) => (
          <StatusTile key={def.statusRow} definition={def} event={openFor(workcenter.workcenterId, def.statusRow)} />
        ))}
      </div>
    </div>
  );
}
