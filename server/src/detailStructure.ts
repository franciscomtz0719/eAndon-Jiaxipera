import type { StatusDefinition } from "@prisma/client";
import { z } from "zod";

/*
 * Alarm details per department (CLAUDE.md E-3). The database keeps each field as a string:
 * "ON|option|option…" or "OFF|option|option…" (options are kept while the field is off).
 * This is the only place that parses or writes that format; everything else uses StartDetails.
 */

export interface DetailField {
  enabled: boolean;
  options: string[];
}

export interface StartDetails {
  /** Whether opening an alarm from a computer shows the details dialog. */
  askOnOpen: boolean;
  location: DetailField;
  type: DetailField;
  text: { enabled: boolean };
}

/** Value older clients send (and older alarms store) when a dropdown was left unselected. */
export const NOT_SELECTED = "-- N/A --";

export function parseDetailStructure(structure: string | null | undefined): DetailField {
  const [flag, ...rest] = (structure ?? "OFF").split("|");
  const options = [...new Set(rest.map((o) => o.trim()).filter(Boolean))];
  return { enabled: flag?.trim() === "ON", options };
}

export function serializeDetailStructure(field: DetailField): string {
  return [field.enabled ? "ON" : "OFF", ...field.options].join("|");
}

// statusDetailsEnabled: 0 = none, 1 = start, 2 = end, 3 = start & end. The "end" part has no
// feature yet, so the editor only changes the "start" part and keeps whatever "end" was.
export const asksOnOpen = (statusDetailsEnabled: number) => statusDetailsEnabled === 1 || statusDetailsEnabled === 3;

export function withAskOnOpen(statusDetailsEnabled: number, askOnOpen: boolean): number {
  const onEnd = statusDetailsEnabled === 2 || statusDetailsEnabled === 3;
  return (askOnOpen ? 1 : 0) + (onEnd ? 2 : 0);
}

export function startDetailsOf(def: StatusDefinition): StartDetails {
  return {
    askOnOpen: asksOnOpen(def.statusDetailsEnabled),
    location: parseDetailStructure(def.alarmStartText1Structure),
    type: parseDetailStructure(def.alarmStartText2Structure),
    text: { enabled: parseDetailStructure(def.alarmStartText3Structure).enabled },
  };
}

/** Database columns for a validated StartDetails. */
export function startDetailsData(current: StatusDefinition, details: StartDetails) {
  return {
    statusDetailsEnabled: withAskOnOpen(current.statusDetailsEnabled, details.askOnOpen),
    alarmStartText1Structure: serializeDetailStructure(details.location),
    alarmStartText2Structure: serializeDetailStructure(details.type),
    alarmStartText3Structure: serializeDetailStructure({ enabled: details.text.enabled, options: [] }),
  };
}

const MAX_OPTIONS = 100;

const option = z.string().trim().min(1, "Options cannot be empty").max(100).refine((o) => !o.includes("|"), 'Options cannot contain "|"');

const detailField = z
  .object({ enabled: z.boolean(), options: z.array(option).max(MAX_OPTIONS) })
  .refine((f) => new Set(f.options).size === f.options.length, { message: "Duplicate option", path: ["options"] })
  .refine((f) => !f.enabled || f.options.length > 0, { message: "Add at least one option or turn the field off", path: ["options"] });

export const startDetailsSchema = z.object({
  askOnOpen: z.boolean(),
  location: detailField,
  type: detailField,
  text: z.object({ enabled: z.boolean() }),
});

/**
 * Checks the details sent when opening an alarm against the department's configuration.
 * Returns the problem, or null when they are acceptable.
 */
export function detailsProblem(
  def: StatusDefinition,
  input: { detailLocation?: string; detailType?: string; detailText?: string },
): string | null {
  const details = startDetailsOf(def);
  const checks: [string, string | undefined, DetailField][] = [
    ["detailLocation", input.detailLocation, details.location],
    ["detailType", input.detailType, details.type],
  ];
  for (const [name, value, field] of checks) {
    if (value && !(field.enabled && field.options.includes(value))) return `${name}: not an option for this department`;
  }
  if (input.detailText && !details.text.enabled) return "detailText: this department does not take free text";
  return null;
}
