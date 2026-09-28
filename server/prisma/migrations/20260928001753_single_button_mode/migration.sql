-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_devices" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL DEFAULT '',
    "workcenter_id" TEXT NOT NULL,
    "status_row" INTEGER,
    "modbus_unit_id" INTEGER,
    "register_address" INTEGER,
    "read_type" TEXT NOT NULL DEFAULT 'bit',
    "active" BOOLEAN NOT NULL DEFAULT true,
    CONSTRAINT "devices_workcenter_id_fkey" FOREIGN KEY ("workcenter_id") REFERENCES "workcenters" ("workcenter_id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_devices" ("active", "id", "modbus_unit_id", "name", "read_type", "register_address", "status_row", "workcenter_id") SELECT "active", "id", "modbus_unit_id", "name", "read_type", "register_address", "status_row", "workcenter_id" FROM "devices";
DROP TABLE "devices";
ALTER TABLE "new_devices" RENAME TO "devices";
CREATE UNIQUE INDEX "devices_modbus_unit_id_register_address_key" ON "devices"("modbus_unit_id", "register_address");
CREATE TABLE "new_status_definitions" (
    "status_row" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "status_name" TEXT NOT NULL,
    "status_name_zh" TEXT NOT NULL DEFAULT '',
    "single_button_order" INTEGER NOT NULL DEFAULT 0,
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
INSERT INTO "new_status_definitions" ("alarm_end_text1_structure", "alarm_end_text2_structure", "alarm_end_text3_structure", "alarm_end_text4_structure", "alarm_start_text1_structure", "alarm_start_text2_structure", "alarm_start_text3_structure", "icon_name", "status_details_enabled", "status_enabled", "status_name", "status_name_zh", "status_row") SELECT "alarm_end_text1_structure", "alarm_end_text2_structure", "alarm_end_text3_structure", "alarm_end_text4_structure", "alarm_start_text1_structure", "alarm_start_text2_structure", "alarm_start_text3_structure", "icon_name", "status_details_enabled", "status_enabled", "status_name", "status_name_zh", "status_row" FROM "status_definitions";
DROP TABLE "status_definitions";
ALTER TABLE "new_status_definitions" RENAME TO "status_definitions";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- Data: single-button cycle follows how often each department is called
-- (Producción → Mantenimiento → Materiales → Calidad), matched by the default names.
UPDATE "status_definitions" SET "single_button_order" = 1 WHERE "status_name" = 'Producción';
UPDATE "status_definitions" SET "single_button_order" = 2 WHERE "status_name" = 'Mantenimiento';
UPDATE "status_definitions" SET "single_button_order" = 3 WHERE "status_name" = 'Materiales';
UPDATE "status_definitions" SET "single_button_order" = 4 WHERE "status_name" = 'Calidad';
UPDATE "status_definitions" SET "single_button_order" = 5 WHERE "status_name" = 'Líder de equipo';
