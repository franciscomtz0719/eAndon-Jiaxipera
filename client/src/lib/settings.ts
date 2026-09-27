import type { Settings } from "./types";

/** Settings row with the minutes before an open alarm turns from yellow to red (seed.ts). */
export const RED_AFTER_SETTING_ID = 6;
const DEFAULT_RED_AFTER_MINUTES = 5;

export function redAfterSeconds(settings: Settings[]): number {
  const minutes = Number(settings.find((s) => s.settingId === RED_AFTER_SETTING_ID)?.currentSetting);
  return (Number.isInteger(minutes) && minutes > 0 ? minutes : DEFAULT_RED_AFTER_MINUTES) * 60;
}
