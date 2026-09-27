import { NavLink, Outlet } from "react-router-dom";
import { BarChart3, ClipboardList, LayoutDashboard, LayoutGrid, Settings as SettingsIcon } from "lucide-react";
import { useAppData, type Language } from "../i18n";
import { NO_AREA_PARAM } from "../pages/AreaPage";

export function Layout() {
  const { t, language, setLanguage, areas, workcenters } = useAppData();
  const activeAreas = areas.filter((area) => area.active);
  const hasUnassigned = workcenters.some((wc) => wc.areaId === null);

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="sidebar-brand">eAndon</div>

        <div className="sidebar-section-title">{t("AREAS", "Areas")}</div>
        {activeAreas.map((area) => (
          <NavLink key={area.id} to={`/areas/${area.id}`} className={({ isActive }) => `sidebar-link${isActive ? " active" : ""}`}>
            <LayoutGrid size={16} /> {area.name}
          </NavLink>
        ))}
        {hasUnassigned && (
          <NavLink to={`/areas/${NO_AREA_PARAM}`} className={({ isActive }) => `sidebar-link${isActive ? " active" : ""}`}>
            <LayoutGrid size={16} /> {t("NoAreaLabel", "No area")}
          </NavLink>
        )}

        <div className="sidebar-divider" />

        <NavLink to="/overview" className={({ isActive }) => `sidebar-link${isActive ? " active" : ""}`}>
          <LayoutDashboard size={16} /> {t("AlarmOverview", "Alarm Overview")}
        </NavLink>
        <NavLink to="/logs" className={({ isActive }) => `sidebar-link${isActive ? " active" : ""}`}>
          <ClipboardList size={16} /> {t("AlarmLog", "Alarm Log")}
        </NavLink>
        <NavLink to="/statistics" className={({ isActive }) => `sidebar-link${isActive ? " active" : ""}`}>
          <BarChart3 size={16} /> {t("AlarmStatistics", "Alarm Statistics")}
        </NavLink>
        <NavLink to="/settings" className={({ isActive }) => `sidebar-link${isActive ? " active" : ""}`}>
          <SettingsIcon size={16} /> {t("Settings", "Settings")}
        </NavLink>

        <div style={{ marginTop: "auto", paddingTop: 16 }}>
          <select
            className="select"
            style={{ width: "100%", backgroundColor: "var(--navy-800)", color: "#fff", borderColor: "var(--navy-700)" }}
            value={language}
            onChange={(e) => setLanguage(e.target.value as Language)}
          >
            <option value="English">English</option>
            <option value="Spanish">Español</option>
          </select>
        </div>
      </aside>

      <div className="main-area">
        <div className="page-content">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
