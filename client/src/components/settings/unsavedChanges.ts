import { createContext } from "react";

/** Lets the Settings page know which sections hold unsaved changes. */
export const UnsavedChangesContext = createContext<(sectionId: string, dirty: boolean) => void>(() => {});
