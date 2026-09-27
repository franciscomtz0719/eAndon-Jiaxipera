import { useContext, useEffect, useState, type ReactNode } from "react";
import { Save, Undo2 } from "lucide-react";
import { useAppData } from "../../i18n";
import { UnsavedChangesContext } from "./unsavedChanges";

export function SettingsSection({
  id,
  title,
  note,
  dirty,
  onSave,
  onDiscard,
  children,
}: {
  id: string;
  title: string;
  note?: string;
  dirty: boolean;
  onSave: () => Promise<void>;
  onDiscard: () => void;
  children: ReactNode;
}) {
  const { t } = useAppData();
  const reportDirty = useContext(UnsavedChangesContext);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    reportDirty(id, dirty);
    return () => reportDirty(id, false);
  }, [id, dirty, reportDirty]);

  const save = async () => {
    setSaving(true);
    try {
      await onSave();
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="card" style={{ marginBottom: 20 }}>
      <div className="section-header">
        <div>
          <h2 className="section-title">{title}</h2>
          {note && <p className="section-note">{note}</p>}
        </div>
        <div className="section-actions">
          {dirty && <span className="unsaved-badge">{t("UnsavedChanges", "Unsaved changes")}</span>}
          <button type="button" className="btn" disabled={!dirty || saving} onClick={onDiscard}>
            <Undo2 size={14} /> {t("Discard", "Discard")}
          </button>
          <button type="button" className="btn btn-primary" disabled={!dirty || saving} onClick={save}>
            <Save size={14} /> {t("SaveChanges", "Save changes")}
          </button>
        </div>
      </div>
      {children}
    </section>
  );
}
