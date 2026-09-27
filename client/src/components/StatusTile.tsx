import { useEffect, useState } from "react";
import type { AlarmEvent, StatusDefinition } from "../lib/types";
import { useAppData } from "../i18n";
import { redAfterSeconds } from "../lib/settings";

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

/**
 * One department of a station: green "OK", or the time since the alarm opened — yellow at first,
 * red once it passes the "turns red" setting.
 */
export function StatusTile({
  definition,
  event,
  onClick,
  disabled,
}: {
  definition: StatusDefinition;
  event?: AlarmEvent;
  onClick?: () => void;
  disabled?: boolean;
}) {
  const { settings } = useAppData();
  const elapsed = useElapsedSeconds(event?.openedAt);
  const color = !event ? "green" : elapsed < redAfterSeconds(settings) ? "yellow" : "red";
  const className = `status-tile ${color}`;
  const content = (
    <>
      {definition.iconName && <i className={`${definition.iconName} status-tile-icon`} />}
      <span className="status-tile-name">{definition.statusName}</span>
      <span>{event ? formatElapsed(elapsed) : "OK"}</span>
    </>
  );

  if (!onClick) {
    return (
      <div className={className} title={definition.statusName}>
        {content}
      </div>
    );
  }
  return (
    <button type="button" className={className} onClick={onClick} disabled={disabled} title={definition.statusName}>
      {content}
    </button>
  );
}
