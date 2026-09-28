import { translate } from "google-translate-api-x";
import { prisma } from "./db.js";

// Translation only ever goes from Spanish/English into Chinese: a name that already contains
// Chinese characters (or that Google detects as Chinese) is never sent through a translation.
const CHINESE_CHARACTERS = /[㐀-鿿豈-﫿]/;

export class ChineseSourceError extends Error {
  constructor() {
    super("The name already contains Chinese characters; only Spanish/English names are translated to Chinese.");
  }
}

/** Throws ChineseSourceError for Chinese input and lets service errors (no internet, etc.) propagate. */
export async function translateToChinese(text: string): Promise<string> {
  if (CHINESE_CHARACTERS.test(text)) throw new ChineseSourceError();
  const result = await translate(text, { from: "auto", to: "zh-CN" });
  if (result.from.language.iso.startsWith("zh")) throw new ChineseSourceError();
  return result.text;
}

// Returns "" when the name can't be translated so creating a workcenter never fails because of it.
export async function toChinese(text: string): Promise<string> {
  if (!text.trim()) return "";
  try {
    return await translateToChinese(text);
  } catch (err) {
    console.error("Chinese translation failed:", err instanceof Error ? err.message : err);
    return "";
  }
}

export async function backfillChineseNames() {
  const missing = await prisma.workcenter.findMany({ where: { workcenterNameZh: "" } });
  for (const wc of missing) {
    const workcenterNameZh = await toChinese(wc.workcenterName);
    if (workcenterNameZh) {
      await prisma.workcenter.update({ where: { workcenterRow: wc.workcenterRow }, data: { workcenterNameZh } });
    }
  }
  const areas = await prisma.area.findMany({ where: { nameZh: "" } });
  for (const area of areas) {
    const nameZh = await toChinese(area.name);
    if (nameZh) await prisma.area.update({ where: { id: area.id }, data: { nameZh } });
  }
}
