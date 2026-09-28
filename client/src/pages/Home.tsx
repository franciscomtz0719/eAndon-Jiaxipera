import { Link } from "react-router-dom";
import { LayoutGrid } from "lucide-react";
import { useAppData } from "../i18n";
import { useOpenEvents } from "../lib/useOpenEvents";
import { NO_AREA_PARAM } from "./AreaPage";
import { BilingualName } from "../components/BilingualName";

export function Home() {
  const { t, areas, workcenters } = useAppData();
  const { countFor } = useOpenEvents();

  const cards = areas
    .filter((area) => area.active)
    .map((area) => ({ key: String(area.id), name: area.name, nameZh: area.nameZh, stations: workcenters.filter((wc) => wc.areaId === area.id) }));
  const unassigned = workcenters.filter((wc) => wc.areaId === null);
  if (unassigned.length > 0) cards.push({ key: NO_AREA_PARAM, name: t("NoAreaLabel", "No area"), nameZh: "", stations: unassigned });

  return (
    <div>
      <h1 className="page-title">eAndon</h1>
      <div className="tiles-grid">
        {cards.map((card) => {
          const openAlarms = card.stations.reduce((sum, wc) => sum + countFor(wc.workcenterId), 0);
          return (
            <Link key={card.key} to={`/areas/${card.key}`} className="wc-card">
              <div className="wc-card-header">
                <div>
                  <div className="wc-id">
                    <LayoutGrid size={14} style={{ marginRight: 4, verticalAlign: -2 }} />
                    <BilingualName name={card.name} nameZh={card.nameZh} />
                  </div>
                  <div className="wc-name">
                    {card.stations.length} {t("Stations", "Stations")}
                  </div>
                </div>
              </div>
              <div style={{ fontWeight: 700, color: openAlarms > 0 ? "var(--red-600)" : "var(--green-700)" }}>
                {openAlarms} {t("OpenAlarms", "Open alarms")}
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
