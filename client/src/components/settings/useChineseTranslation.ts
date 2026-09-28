import { useCallback, useState } from "react";
import { api } from "../../lib/api";
import { useAppData } from "../../i18n";
import { useToast } from "../toastContext";

/**
 * "Translate" buttons: fills a Chinese field from the Spanish/English name (never the other way).
 * The result stays a pending edit to review and save. `translating` holds the key of the busy button.
 */
export function useChineseTranslation() {
  const { t } = useAppData();
  const toast = useToast();
  const [translating, setTranslating] = useState<string | null>(null);

  const translate = useCallback(
    async (key: string, name: string, apply: (zh: string) => void) => {
      if (!name.trim()) {
        toast.error(t("TranslateNeedsName", "Type the Spanish/English name first."));
        return;
      }
      setTranslating(key);
      try {
        apply(await api.translateToChinese(name));
      } catch (err) {
        toast.error(`${t("Rejected", "Rejected")}: ${err instanceof Error ? err.message : "Error"}`);
      } finally {
        setTranslating(null);
      }
    },
    [t, toast],
  );

  return { translating, translate };
}
