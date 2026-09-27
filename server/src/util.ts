export interface DecodedStatus {
  color: string;
  timestamp: string | null;
  dropdown1: string;
  dropdown2: string;
  textField: string;
}

export function decodeStatus(raw: string): DecodedStatus {
  const parts = raw.split("|");
  return {
    color: parts[0] ?? "green",
    timestamp: parts[1] ?? null,
    dropdown1: parts[2] ?? "",
    dropdown2: parts[3] ?? "",
    textField: parts[4] ?? "",
  };
}

export function encodeStatus(
  color: "red" | "green",
  dropdown1 = "",
  dropdown2 = "",
  textField = "",
): string {
  const now = new Date().toISOString();
  return color === "red" ? `red|${now}|${dropdown1}|${dropdown2}|${textField}` : `green|${now}`;
}
