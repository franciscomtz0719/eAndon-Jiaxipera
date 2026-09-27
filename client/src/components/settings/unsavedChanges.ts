import { createContext } from "react";

/** Lets the Settings page know which sections hold unsaved changes. */
export const UnsavedChangesContext = createContext<(sectionId: string, dirty: boolean) => void>(() => {});

/** Ids of the sections that currently hold unsaved changes. */
export const DirtySectionsContext = createContext<ReadonlySet<string>>(new Set());
