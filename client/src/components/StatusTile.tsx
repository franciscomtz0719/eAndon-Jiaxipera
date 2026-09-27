import { useEffect, useState } from "react";
import type { AlarmEvent, StatusDefinition } from "../lib/types";

function formatElapsed(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
  return `${Math.floor(seconds / 3600)}h ${Math.floor((seconds % 3600) / 60)}m`;
}

function useElapsedSeconds(since: string | undefined) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!since) return;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [since]);
  return since ? Math.max(0, Math.round((now - new Date(since).getTime()) / 1000)) : 0;
}

/** One department of a station: green "OK", or red with the time since the alarm opened. */
export function StatusTile({ definition, event, onClick }: { definition: StatusDefinition; event?: AlarmEvent; onClick?: () => void }) {
  const elapsed = useElapsedSeconds(event?.openedAt);
  const className = `status-tile ${event ? "red" : "green"}`;
  const content = (
    <>
      {definition.iconName && <i className={`${definition.iconName} status-tile-icon`} />}
      <span className="status-tile-name">{definition.statusName}</span>
      <span>{event ? formatElapsed(elapsed) : "OK"}</span>
    </>
  );

  if (!onClick) {
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
