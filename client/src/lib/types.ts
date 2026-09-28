export interface Workcenter {
  workcenterRow: number;
  workcenterId: string;
  workcenterName: string;
  workcenterNameZh: string;
  areaId: number | null;
}

export interface Area {
  id: number;
  name: string;
  nameZh: string;
  sortOrder: number;
  active: boolean;
}

export interface Screen {
  id: number;
  name: string;
  areaId: number | null;
  volume: number;
  soundEnabled: boolean;
}

export interface Shift {
  id: number;
  name: string;
  startTime: string;
  endTime: string;
  /** ISO weekdays, 1 = Monday … 7 = Sunday */
  days: number[];
  active: boolean;
}

export interface GatewayConfig {
  host: string;
  port: number;
  pollIntervalMs: number;
  timeoutMs: number;
  watchdogCycles: number;
  enabled: boolean;
}

export type ReadType = "bit" | "counter";

export interface Device {
  id: number;
  name: string;
  workcenterId: string;
  /** null = single-button device: the department is chosen by pressing repeatedly. */
  statusRow: number | null;
  modbusUnitId: number | null;
  registerAddress: number | null;
  readType: ReadType;
  active: boolean;
}

export interface DetailField {
  enabled: boolean;
  options: string[];
}

/** Alarm details of a department, parsed by the server (server/src/detailStructure.ts). */
export interface StartDetails {
  /** Whether opening an alarm from a computer shows the details dialog. */
  askOnOpen: boolean;
  location: DetailField;
  type: DetailField;
  text: { enabled: boolean };
}

/** What the operator entered in the details dialog; empty string = nothing selected / typed. */
export interface DetailValues {
  location: string;
  type: string;
  text: string;
}

export interface StatusDefinition {
  statusRow: number;
  statusName: string;
  statusNameZh: string;
  /** Position in the single-button cycle (each press moves to the next department). */
  singleButtonOrder: number;
  statusEnabled: boolean;
  statusDetailsEnabled: number;
  iconName: string | null;
  startDetails: StartDetails;
}

export interface Settings {
  settingId: number;
  settingName: string;
  currentSetting: string;
  possibleSettings: string;
  defaultSetting: string;
}

export interface Localization {
  id: string;
  english: string;
  spanish: string;
  chinese: string;
  translation: string;
}



export interface Bootstrap {
  statusDefinitions: StatusDefinition[];
  settings: Settings[];
  localization: Localization[];
  areas: Area[];
  workcenters: Workcenter[];
}

export interface StatisticsSummary {
  totalAlarms: number;
  mttr: number;
  mtbf: number;
  workcenterStatistics: { workcenterId: string; workcenterName: string; workcenterNameZh: string; numberOfAlarms: number }[];
}

export interface StatisticsBreakdown {
  departmentStatistics: { statusRow: number; departmentName: string; numberOfAlarms: number; percentageOfTotal: number }[];
  alarmLocationStatistics: { alarmLocation: string; numberOfAlarms: number; percentageOfTotal: number }[];
  alarmTypeStatistics: { alarmType: string; numberOfAlarms: number; percentageOfTotal: number }[];
}

/** Who opened or closed an alarm. "migrated" marks alarms imported from the old log table. */
export type EventActor = "button" | "computer" | "simulated" | "system" | "migrated";

export interface AlarmEvent {
  id: number;
  workcenterId: string;
  workcenterName: string;
  statusRow: number;
  departmentName: string;
  state: "open" | "closed";
  openedAt: string;
  closedAt: string | null;
  openedBy: EventActor;
  closedBy: EventActor | null;
  pressCount: number;
  lastPressAt: string | null;
  detailLocation: string | null;
  detailType: string | null;
  detailText: string | null;
}

export type PressResult = "opened" | "ignored" | "closed" | "selected";

/** Single-button mode: a department being selected, confirmed when the countdown ends. */
export interface Selection {
  workcenterId: string;
  statusRow: number;
  /** Opens a call, or closes the one already open for that department. */
  action: "open" | "close";
  /** Epoch ms when the selection confirms. */
  expiresAt: number;
  pressCount: number;
}

export interface ButtonPress {
  id: number;
  deviceId: number | null;
  workcenterId: string;
  statusRow: number;
  source: "button" | "simulated";
  pressedAt: string;
  result: PressResult;
  eventId: number | null;
}
