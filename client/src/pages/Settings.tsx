import { useCallback, useEffect, useState } from "react";
import { useBlocker } from "react-router-dom";
import { useAppData } from "../i18n";
import { UnsavedChangesContext } from "../components/settings/unsavedChanges";
import { AreasSection } from "../components/settings/AreasSection";
import { WorkcentersSection } from "../components/settings/WorkcentersSection";
import { ScreensSection } from "../components/settings/ScreensSection";
import { ShiftsSection } from "../components/settings/ShiftsSection";
import { DevicesSection } from "../components/settings/DevicesSection";
import { GatewaySection } from "../components/settings/GatewaySection";
import { AlarmTypesSection } from "../components/settings/AlarmTypesSection";
import { AlarmDetailsSection } from "../components/settings/AlarmDetailsSection";
import { InterfaceSection } from "../components/settings/InterfaceSection";
import { LocalizationSection } from "../components/settings/LocalizationSection";

export function Settings() {
  const { t } = useAppData();
  const [dirtySections, setDirtySections] = useState<ReadonlySet<string>>(new Set());
  const hasUnsavedChanges = dirtySections.size > 0;

  const reportDirty = useCallback((sectionId: string, dirty: boolean) => {
    setDirtySections((prev) => {
      if (prev.has(sectionId) === dirty) return prev;
      const next = new Set(prev);
      if (dirty) next.add(sectionId);
      else next.delete(sectionId);
      return next;
    });
  }, []);

  // In-app navigation is held until the user decides; closing or reloading the tab uses the browser prompt.
  const blocker = useBlocker(hasUnsavedChanges);
  useEffect(() => {
    if (!hasUnsavedChanges) return;
    const warn = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [hasUnsavedChanges]);

  return (
    <UnsavedChangesContext.Provider value={reportDirty}>
      <div>
        <h1 className="page-title">{t("Settings", "Settings")}</h1>

        <AreasSection />
        <WorkcentersSection />
        <ScreensSection />
        <ShiftsSection />
        <DevicesSection />
        <GatewaySection />
        <AlarmTypesSection />
        <AlarmDetailsSection />
        <InterfaceSection />
        <LocalizationSection />
      </div>

      {blocker.state === "blocked" && (
        <div className="modal-overlay">
          <div className="modal-panel" style={{ maxWidth: 420 }}>
            <h3 style={{ marginBottom: 12 }}>{t("UnsavedChanges", "Unsaved changes")}</h3>
            <p style={{ marginBottom: 16 }}>{t("LeaveWithoutSaving", "You have unsaved changes. Leave without saving?")}</p>
            <div className="modal-footer">
              <button type="button" className="btn" onClick={() => blocker.reset()}>
                {t("Stay", "Stay")}
              </button>
              <button type="button" className="btn btn-primary" style={{ background: "var(--red-600)", borderColor: "var(--red-600)" }} onClick={() => blocker.proceed()}>
                {t("Leave", "Leave without saving")}
              </button>
            </div>
          </div>
        </div>
      )}
    </UnsavedChangesContext.Provider>
  );
}
