/** Single-line "Spanish / 中文" form for places that can't hold markup, like <option> elements. */
export function bilingualText(name: string, nameZh: string | null | undefined) {
  return nameZh ? `${name} / ${nameZh}` : name;
}
