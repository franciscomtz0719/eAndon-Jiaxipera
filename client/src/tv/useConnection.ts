import { useEffect, useRef, useState } from "react";
import { api } from "../lib/api";

const POLL_MS = 2000;
const TIMEOUT_MS = 1500;
/** Two missed polls (about 4 s) mark the board offline. */
const FAILURES_FOR_OFFLINE = 2;

export type GatewayState = "not_configured" | "unknown" | "ok" | "down";

export interface ConnectionState {
  /** null until the first answer: the board must not show "all clear" before that. */
  online: boolean | null;
  gateway: GatewayState;
}

/**
 * Polls the server so a TV notices a lost connection within seconds (a dropped socket can take far
 * longer to detect). Also reloads the page when the server version changes after a deploy.
 */
export function useConnection(onBackOnline: () => void): ConnectionState {
  const [state, setState] = useState<ConnectionState>({ online: null, gateway: "not_configured" });
  const failures = useRef(0);
  const version = useRef<string | null>(null);
  const wasOnline = useRef<boolean | null>(null);
  const backOnline = useRef(onBackOnline);
  useEffect(() => {
    backOnline.current = onBackOnline;
  }, [onBackOnline]);

  useEffect(() => {
    let stopped = false;

    const poll = async () => {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);
      try {
        const health = await api.getHealth(controller.signal);
        if (version.current && version.current !== health.version) {
          window.location.reload();
          return;
        }
        version.current = health.version;
        failures.current = 0;
        if (wasOnline.current === false) backOnline.current();
        wasOnline.current = true;
        if (!stopped) setState({ online: true, gateway: health.gateway });
      } catch {
        failures.current += 1;
        if (failures.current >= FAILURES_FOR_OFFLINE) {
          wasOnline.current = false;
          if (!stopped) setState((prev) => ({ ...prev, online: false }));
        }
      } finally {
        clearTimeout(timeout);
      }
    };

    poll();
    const id = setInterval(poll, POLL_MS);
    return () => {
      stopped = true;
      clearInterval(id);
    };
  }, []);

  return state;
}
