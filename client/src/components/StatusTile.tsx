import { useEffect, useState } from "react";
import { decodeStatus } from "../lib/types";
import type { StatusDefinition } from "../lib/types";

function formatElapsed(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
  return `${Math.floor(seconds / 3600)}h`;
}

export function StatusTile({
  definition,
  rawStatus,
  onClick,
  readOnly = false,
}: {
  definition: StatusDefinition;
  rawStatus: string;
  onClick?: () => void;
  readOnly?: boolean;
}) {
  const { color, timestamp } = decodeStatus(rawStatus);
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    if (color !== "red" || !timestamp) {
      setElapsed(0);
      return;
    }
    const tick = () => setElapsed(Math.round((Date.now() - new Date(timestamp).getTime()) / 1000));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [color, timestamp]);

  const className = `status-tile ${color === "red" ? "red" : "green"}`;
  const content = (
    <>
      {definition.iconName && <i className={`${definition.iconName} status-tile-icon`} />}
      <span className="status-tile-name">{definition.statusName}</span>
      <span>{color === "red" ? formatElapsed(elapsed) : "OK"}</span>
    </>
  );

  if (readOnly) {
    return (
      <div className={className} title={definition.statusName} style={{ cursor: "default" }}>
        {content}
      </div>
    );
  }

  return (
    <button type="button" className={className} onClick={onClick} title={definition.statusName}>
      {content}
    </button>
  );
}
