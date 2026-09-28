import type { Workcenter } from "../lib/types";
import { bilingualText } from "../lib/bilingual";
import { BilingualName } from "./BilingualName";

type Names = Pick<Workcenter, "workcenterName" | "workcenterNameZh">;

/** Shows the workcenter name with its Chinese translation underneath. */
export function WorkcenterName({ workcenter }: { workcenter: Names }) {
  return <BilingualName name={workcenter.workcenterName} nameZh={workcenter.workcenterNameZh} />;
}

/** Single-line form for places that can't hold markup, like <option> elements. */
export const workcenterNameText = (workcenter: Names) => bilingualText(workcenter.workcenterName, workcenter.workcenterNameZh);
