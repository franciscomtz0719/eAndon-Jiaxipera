-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_areas" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "name_zh" TEXT NOT NULL DEFAULT '',
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "active" BOOLEAN NOT NULL DEFAULT true
);
INSERT INTO "new_areas" ("active", "id", "name", "sort_order") SELECT "active", "id", "name", "sort_order" FROM "areas";
DROP TABLE "areas";
ALTER TABLE "new_areas" RENAME TO "areas";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- Data: fix the typo in the pilot area's name and give it its Chinese name. The automatic
-- translation of "Ensamble" alone is 集会 ("meeting"), so the manufacturing term is set directly.
UPDATE "areas" SET "name" = 'Ensamble' WHERE "name" = 'Ensable';
UPDATE "areas" SET "name_zh" = '装配' WHERE "name" = 'Ensamble' AND "name_zh" = '';
