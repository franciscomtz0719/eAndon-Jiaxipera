/** A name with its Chinese translation underneath (stations, areas). */
export function BilingualName({ name, nameZh }: { name: string; nameZh?: string | null }) {
  return (
    <span className="wc-name-bilingual">
      <span>{name}</span>
      {nameZh && <span className="wc-name-zh">{nameZh}</span>}
    </span>
  );
}
