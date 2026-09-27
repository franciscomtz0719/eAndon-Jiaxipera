import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { api } from "../lib/api";
import type { Area, Bootstrap, Localization, Settings, StatusDefinition, Workcenter } from "../lib/types";

interface AppDataContextValue {
  loading: boolean;
  statusDefinitions: StatusDefinition[];
  settings: Settings[];
  localization: Localization[];
  /** Configuration snapshot (areas and stations); live alarm states come from the socket instead. */
  areas: Area[];
  workcenters: Workcenter[];
  language: string;
  t: (id: string, fallback?: string) => string;
  /** Translates a stored failure location/type option, falling back to the stored text. */
  tOption: (value: string | null | undefined) => string;
  setLanguage: (language: Language) => Promise<void>;
  refresh: () => Promise<void>;
}

export type Language = "English" | "Spanish";

const AppDataContext = createContext<AppDataContextValue | null>(null);

export function AppDataProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<Bootstrap | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const bootstrap = await api.getBootstrap();
    setData(bootstrap);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const language = useMemo(
    () => data?.settings.find((s) => s.settingName === "Language")?.currentSetting ?? "English",
    [data],
  );

  const translationMap = useMemo(() => {
    const map = new Map<string, string>();
    for (const l of data?.localization ?? []) {
      map.set(l.id, language === "Spanish" && l.spanish ? l.spanish : l.english);
    }
    return map;
  }, [data, language]);

  const t = useCallback((id: string, fallback?: string) => translationMap.get(id) ?? fallback ?? id, [translationMap]);
  const tOption = useCallback((value: string | null | undefined) => (value ? (translationMap.get(`Option.${value}`) ?? value) : ""), [translationMap]);

  const setLanguage = useCallback(
    async (newLanguage: Language) => {
      const languageSetting = data?.settings.find((s) => s.settingName === "Language");
      if (!languageSetting) return;
      await api.updateSetting(languageSetting.settingId, newLanguage);
      await load();
    },
    [data, load],
  );

  const value: AppDataContextValue = {
    loading,
    statusDefinitions: data?.statusDefinitions ?? [],
    settings: data?.settings ?? [],
    localization: data?.localization ?? [],
    areas: data?.areas ?? [],
    workcenters: data?.workcenters ?? [],
    language,
    t,
    tOption,
    setLanguage,
    refresh: load,
  };

  return <AppDataContext.Provider value={value}>{children}</AppDataContext.Provider>;
}

export function useAppData() {
  const ctx = useContext(AppDataContext);
  if (!ctx) throw new Error("useAppData must be used inside AppDataProvider");
  return ctx;
}

export function useTranslation() {
  const { t, tOption } = useAppData();
  return { t, tOption };
}
