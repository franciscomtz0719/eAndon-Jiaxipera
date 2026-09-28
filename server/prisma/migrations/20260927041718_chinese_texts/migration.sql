-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_localization" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "english" TEXT NOT NULL,
    "spanish" TEXT NOT NULL DEFAULT '',
    "chinese" TEXT NOT NULL DEFAULT '',
    "translation" TEXT NOT NULL
);
INSERT INTO "new_localization" ("english", "id", "spanish", "translation") SELECT "english", "id", "spanish", "translation" FROM "localization";
DROP TABLE "localization";
ALTER TABLE "new_localization" RENAME TO "localization";
CREATE TABLE "new_status_definitions" (
    "status_row" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "status_name" TEXT NOT NULL,
    "status_name_zh" TEXT NOT NULL DEFAULT '',
    "status_enabled" BOOLEAN NOT NULL,
    "status_details_enabled" INTEGER NOT NULL,
    "icon_name" TEXT,
    "alarm_start_text1_structure" TEXT,
    "alarm_start_text2_structure" TEXT,
    "alarm_start_text3_structure" TEXT,
    "alarm_end_text1_structure" TEXT,
    "alarm_end_text2_structure" TEXT,
    "alarm_end_text3_structure" TEXT,
    "alarm_end_text4_structure" TEXT
);
INSERT INTO "new_status_definitions" ("alarm_end_text1_structure", "alarm_end_text2_structure", "alarm_end_text3_structure", "alarm_end_text4_structure", "alarm_start_text1_structure", "alarm_start_text2_structure", "alarm_start_text3_structure", "icon_name", "status_details_enabled", "status_enabled", "status_name", "status_row") SELECT "alarm_end_text1_structure", "alarm_end_text2_structure", "alarm_end_text3_structure", "alarm_end_text4_structure", "alarm_start_text1_structure", "alarm_start_text2_structure", "alarm_start_text3_structure", "icon_name", "status_details_enabled", "status_enabled", "status_name", "status_row" FROM "status_definitions";
DROP TABLE "status_definitions";
ALTER TABLE "new_status_definitions" RENAME TO "status_definitions";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- Data: Chinese names for the current departments (only where the Spanish name is the default one).
UPDATE "status_definitions" SET "status_name_zh" = '生产' WHERE "status_name" = 'Producción';
UPDATE "status_definitions" SET "status_name_zh" = '质量' WHERE "status_name" = 'Calidad';
UPDATE "status_definitions" SET "status_name_zh" = '维修' WHERE "status_name" = 'Mantenimiento';
UPDATE "status_definitions" SET "status_name_zh" = '物料' WHERE "status_name" = 'Materiales';
UPDATE "status_definitions" SET "status_name_zh" = '班组长' WHERE "status_name" = 'Líder de equipo';
