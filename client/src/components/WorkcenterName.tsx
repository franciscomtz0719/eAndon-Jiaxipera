import type { Workcenter } from "../lib/types";

/** Shows the workcenter name with its Chinese translation underneath. */
export function WorkcenterName({ workcenter }: { workcenter: Pick<Workcenter, "workcenterName" | "workcenterNameZh"> }) {
  return (
    <span className="wc-name-bilingual">
      <span>{workcenter.workcenterName}</span>
      {workcenter.workcenterNameZh && <span className="wc-name-zh">{workcenter.workcenterNameZh}</span>}
    </span>
  );
}

/** Single-line form for places that can't hold markup, like <option> elements. */
export function workcenterNameText(workcenter: Pick<Workcenter, "workcenterName" | "workcenterNameZh">) {
  return workcenter.workcenterNameZh ? `${workcenter.workcenterName} / ${workcenter.workcenterNameZh}` : workcenter.workcenterName;
}
