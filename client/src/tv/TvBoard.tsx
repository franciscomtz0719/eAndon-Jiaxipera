import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { api } from "../lib/api";
import type { AlarmEvent, Screen, Selection, StatusDefinition, Workcenter } from "../lib/types";
import { useAppData } from "../i18n";
import { useOpenEvents } from "../lib/useOpenEvents";
import { useSelections } from "../lib/useSelections";
import { useEventChanges } from "../lib/socket";
import { redAfterSeconds } from "../lib/settings";
import { useConnection } from "./useConnection";
import "./tv.css";
import logo from "../assets/jiaxipera_logo.svg";

const CONFIG_REFRESH_MS = 60_000;
const CLOSED_FLASH_MS = 3000;
const OPENED_FLASH_MS = 2000;
const PAGE_SIZE = 12;
const PAGE_ROTATE_MS = 10_000;
const CURSOR_HIDE_MS = 3000;

/** Spanish and Chinese at once: the board ignores the UI language selector. */
function Bi({ es, zh, className }: { es: string; zh: string; className?: string }) {
  return (
    <span className={`tv-bi ${className ?? ""}`}>
      <span>{es}</span>
      {zh && <span className="tv-zh">{zh}</span>}
    </span>
  );
}

function formatTimer(seconds: number) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  const mmss = `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  return h > 0 ? `${h}:${mmss}` : mmss;
}

/** Few cards are shown big; the grid gets denser as alarms pile up. */
function columnsFor(count: number) {
  if (count <= 1) return 1;
  if (count <= 4) return 2;
  if (count <= 9) return 3;
  return 4;
}

interface CardItem {
  event: AlarmEvent;
  closing: boolean;
}

interface StationCard {
  station: Workcenter;
  items: CardItem[];
  /** Single-button mode: department being chosen at this station, if any. */
  selection?: Selection;
  since: number;
}

type Bilingual = { es: string; zh: string };

export function TvBoard() {
  const { screenId = "" } = useParams<{ screenId: string }>();
  const { areas, workcenters, statusDefinitions, settings, localization, refresh } = useAppData();
  const { events } = useOpenEvents();
  const selections = useSelections();
  const [screen, setScreen] = useState<Screen | null | undefined>(undefined);
  const [closing, setClosing] = useState<AlarmEvent[]>([]);
  const [flashing, setFlashing] = useState<ReadonlySet<number>>(new Set());
  const [now, setNow] = useState(() => Date.now());
  const [page, setPage] = useState(0);
  const [idle, setIdle] = useState(false);

  const loadScreen = useCallback(() => {
    api
      .getScreen(screenId)
      .then(setScreen)
      .catch(() => setScreen(null));
  }, [screenId]);

  // Screen and station configuration changes reach the TV within a minute, without touching it.
  useEffect(() => {
    loadScreen();
    const id = setInterval(() => {
      loadScreen();
      refresh();
    }, CONFIG_REFRESH_MS);
    return () => clearInterval(id);
  }, [loadScreen, refresh]);

  const connection = useConnection(
    useCallback(() => {
      loadScreen();
      refresh();
    }, [loadScreen, refresh]),
  );

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  // Openings flash for a moment; closings stay 3 s as "CLOSED" so the operator sees the press worked.
  useEventChanges(
    useCallback((event: AlarmEvent) => {
      if (event.state === "open") {
        setFlashing((prev) => new Set(prev).add(event.id));
        setTimeout(() => setFlashing((prev) => new Set([...prev].filter((id) => id !== event.id))), OPENED_FLASH_MS);
      } else {
        setClosing((prev) => [...prev.filter((e) => e.id !== event.id), event]);
        setTimeout(() => setClosing((prev) => prev.filter((e) => e.id !== event.id)), CLOSED_FLASH_MS);
      }
    }, []),
  );

  useEffect(() => {
    let timer = setTimeout(() => setIdle(true), CURSOR_HIDE_MS);
    const wake = () => {
      setIdle(false);
      clearTimeout(timer);
      timer = setTimeout(() => setIdle(true), CURSOR_HIDE_MS);
    };
    window.addEventListener("mousemove", wake);
    return () => {
      clearTimeout(timer);
      window.removeEventListener("mousemove", wake);
    };
  }, []);

  const text = useCallback(
    (id: string, es: string, zh: string) => {
      const row = localization.find((l) => l.id === id);
      return { es: row?.spanish || es, zh: row?.chinese || zh };
    },
    [localization],
  );

  const area = screen ? areas.find((a) => a.id === screen.areaId) : undefined;
  const stations = useMemo(() => (area ? workcenters.filter((wc) => wc.areaId === area.id) : []), [area, workcenters]);
  const definitionOf = useMemo(() => new Map(statusDefinitions.map((d) => [d.statusRow, d])), [statusDefinitions]);
  const redAfter = redAfterSeconds(settings);

  // One card per station with an open (or just-closed) alarm, oldest first so new cards append at the end.
  const cards = useMemo<StationCard[]>(() => {
    const byStation = new Map(stations.map((s) => [s.workcenterId, s]));
    const grouped = new Map<string, StationCard>();
    const add = (event: AlarmEvent, isClosing: boolean) => {
      const station = byStation.get(event.workcenterId);
      if (!station) return;
      const card = grouped.get(station.workcenterId) ?? { station, items: [], since: Infinity };
      card.items.push({ event, closing: isClosing });
      card.since = Math.min(card.since, new Date(event.openedAt).getTime());
      grouped.set(station.workcenterId, card);
    };
    events.forEach((e) => add(e, false));
    closing.forEach((e) => add(e, true));
    // A station that is only choosing a department (single-button mode) also gets a card, at the end.
    for (const selection of selections.values()) {
      const station = byStation.get(selection.workcenterId);
      if (!station) continue;
      const card = grouped.get(station.workcenterId) ?? { station, items: [], since: selection.expiresAt };
      grouped.set(station.workcenterId, { ...card, selection });
    }
    return [...grouped.values()]
      .map((card) => ({ ...card, items: card.items.sort((a, b) => a.event.statusRow - b.event.statusRow) }))
      .sort((a, b) => a.since - b.since);
  }, [events, closing, selections, stations]);

  const pageCount = Math.max(1, Math.ceil(cards.length / PAGE_SIZE));
  useEffect(() => {
    if (pageCount <= 1) return;
    const id = setInterval(() => setPage((p) => (p + 1) % pageCount), PAGE_ROTATE_MS);
    return () => clearInterval(id);
  }, [pageCount]);
  const currentPage = page % pageCount;
  const visible = cards.slice(currentPage * PAGE_SIZE, (currentPage + 1) * PAGE_SIZE);
  const columns = columnsFor(visible.length);
  const rows = Math.max(1, Math.ceil(visible.length / columns));

  const degraded = connection.online !== true || connection.gateway === "down";
  // The logo sits above the green check while all is clear, and slides into the header otherwise.
  const allClear = visible.length === 0 && !degraded;
  const openCount = events.filter((e) => stations.some((s) => s.workcenterId === e.workcenterId)).length;

  const rootClass = `tv-root${degraded ? " tv-degraded" : ""}${idle ? " tv-idle" : ""}`;
  const clock = new Date(now).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: false });

  if (screen === null || (screen && !area)) {
    const message = screen === null ? text("TV.ScreenNotFound", "Pantalla no encontrada", "未找到屏幕") : text("TV.NoArea", "Esta pantalla no tiene área asignada. Configúrala en Configuración → Pantallas.", "此屏幕未分配区域，请在设置中配置。");
    return (
      <div className={rootClass}>
        <div className="tv-message">
          <Bi es={message.es} zh={message.zh} />
        </div>
      </div>
    );
  }

  const statusPill = degraded ? (
    <span className="tv-pill tv-pill-offline">
      ● <Bi {...(connection.online === true ? text("TV.GatewayDown", "LOS BOTONES NO RESPONDEN", "按钮无响应") : text("TV.Offline", "SIN CONEXIÓN", "连接中断"))} />
    </span>
  ) : (
    <span className="tv-pill tv-pill-online">
      ● <Bi {...text("TV.Online", "EN LÍNEA", "在线")} />
    </span>
  );

  return (
    <div className={rootClass} onDoubleClick={() => document.documentElement.requestFullscreen?.().catch(() => undefined)}>
      <div className={`tv-logo ${allClear ? "tv-logo-center" : "tv-logo-header"}`}>
        <img src={logo} alt="Jiaxipera" />
      </div>
      <header className="tv-header">
        <div className="tv-area">{area && <Bi es={area.name} zh={area.nameZh} />}</div>
        {statusPill}
        <div className="tv-count">
          <strong>{openCount}</strong> <Bi {...text("TV.OpenAlarms", "abiertas", "个报警")} /> · <strong>{stations.length}</strong> <Bi {...text("TV.Stations", "est.", "工位")} />
          {pageCount > 1 && (
            <>
              {" · "}
              <Bi {...text("TV.Page", "Página", "页")} /> <strong>{currentPage + 1}/{pageCount}</strong>
            </>
          )}
        </div>
        <div className="tv-clock">{clock}</div>
      </header>

      <main className="tv-body">
        {degraded && (
          <div className="tv-offline-banner">
            <Bi {...(connection.online === true ? text("TV.GatewayDown", "LOS BOTONES NO RESPONDEN", "按钮无响应") : text("TV.Offline", "SIN CONEXIÓN", "连接中断"))} className="tv-offline-title" />
            <Bi {...text("TV.OfflineNote", "La información puede no estar actualizada", "信息可能不是最新的")} className="tv-offline-note" />
          </div>
        )}

        {visible.length === 0 ? (
          // "All clear" is only shown with a confirmed connection; otherwise the banner above says why.
          allClear && (
            <div className="tv-all-clear">
              <div className="tv-check">✓</div>
              <Bi {...text("TV.AllClear", "SIN ALARMAS ABIERTAS", "无报警")} className="tv-all-clear-title" />
              <div className="tv-all-clear-note">
                <strong className="tv-all-clear-count">{stations.length}</strong>
                <Bi {...text("TV.StationsRunning", "estaciones en operación", "个工位运行中")} />
              </div>
            </div>
          )
        ) : (
          <div
            className="tv-grid"
            style={{
              gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`,
              gridTemplateRows: `repeat(${rows}, minmax(0, 1fr))`,
              // Text grows while few cards are shown and shrinks as the grid fills up.
              ["--tv-scale" as string]: String(Math.min(2.2 / rows, 2.6 / columns, 1.6)),
            }}
          >
            {visible.map((card) => (
              <StationCardView
                key={card.station.workcenterId}
                card={card}
                now={now}
                redAfter={redAfter}
                definitionOf={definitionOf}
                flashing={flashing}
                closedLabel={text("TV.Closed", "CERRADA", "已解除")}
                selectOpenLabel={text("TV.SelectOpen", "ABRIR en {n} s", "{n}秒后呼叫")}
                selectCloseLabel={text("TV.SelectClose", "CERRAR en {n} s", "{n}秒后解除")}
              />
            ))}
          </div>
        )}

      </main>
    </div>
  );
}

function StationCardView({
  card,
  now,
  redAfter,
  definitionOf,
  flashing,
  closedLabel,
  selectOpenLabel,
  selectCloseLabel,
}: {
  card: StationCard;
  now: number;
  redAfter: number;
  definitionOf: Map<number, StatusDefinition>;
  flashing: ReadonlySet<number>;
  closedLabel: Bilingual;
  selectOpenLabel: Bilingual;
  selectCloseLabel: Bilingual;
}) {
  const levels = card.items.map(({ event, closing }) => {
    if (closing) return "closed";
    const elapsed = Math.max(0, Math.round((now - new Date(event.openedAt).getTime()) / 1000));
    return elapsed >= redAfter ? "red" : "yellow";
  });
  const worst = levels.includes("red") ? "red" : levels.includes("yellow") ? "yellow" : levels.includes("closed") ? "closed" : "select";
  const selection = card.selection;
  const selectedDef = selection && definitionOf.get(selection.statusRow);
  const secondsLeft = selection ? Math.max(0, Math.ceil((selection.expiresAt - now) / 1000)) : 0;
  const countdown = selection && (selection.action === "close" ? selectCloseLabel : selectOpenLabel);

  return (
    <section className={`tv-card tv-card-${worst}`}>
      <div className="tv-card-head">
        <span className="tv-station-id">{card.station.workcenterId}</span>
        <Bi es={card.station.workcenterName} zh={card.station.workcenterNameZh} className="tv-station-name" />
      </div>
      <div className="tv-items">
        {selection && countdown && (
          <div className="tv-item tv-item-select">
            <span className="tv-glyph">▶</span>
            {selectedDef?.iconName && <i className={`${selectedDef.iconName} tv-icon`} />}
            <Bi es={(selectedDef?.statusName ?? "").toUpperCase()} zh={selectedDef?.statusNameZh ?? ""} className="tv-dept" />
            <Bi es={countdown.es.replace("{n}", String(secondsLeft))} zh={countdown.zh.replace("{n}", String(secondsLeft))} className="tv-timer tv-countdown" />
          </div>
        )}
        {card.items.map(({ event, closing }, i) => {
          const def = definitionOf.get(event.statusRow);
          const level = levels[i];
          const elapsed = Math.max(0, Math.round((now - new Date(event.openedAt).getTime()) / 1000));
          const glyph = level === "closed" ? "✓" : level === "red" ? "‼" : "⚠";
          return (
            <div key={event.id} className={`tv-item tv-item-${level}${flashing.has(event.id) ? " tv-flash" : ""}`}>
              <span className="tv-glyph">{glyph}</span>
              {def?.iconName && <i className={`${def.iconName} tv-icon`} />}
              <Bi es={(def?.statusName ?? event.departmentName).toUpperCase()} zh={def?.statusNameZh ?? ""} className="tv-dept" />
              <span className="tv-timer">{closing ? <Bi {...closedLabel} /> : formatTimer(elapsed)}</span>
            </div>
          );
        })}
      </div>
    </section>
  );
}
