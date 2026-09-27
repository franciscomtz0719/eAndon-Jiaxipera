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
  statusRow: number;
  modbusUnitId: number | null;
  registerAddress: number | null;
  readType: ReadType;
  active: boolean;
}

export interface StatusDefinition {
  statusRow: number;
  statusName: string;
  statusEnabled: boolean;
  statusDetailsEnabled: number;
  iconName: string | null;
  alarmStartText1Structure: string | null;
  alarmStartText2Structure: string | null;
  alarmStartText3Structure: string | null;
  alarmEndText1Structure: string | null;
  alarmEndText2Structure: string | null;
  alarmEndText3Structure: string | null;
  alarmEndText4Structure: string | null;
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

export type PressResult = "opened" | "ignored" | "closed";

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
