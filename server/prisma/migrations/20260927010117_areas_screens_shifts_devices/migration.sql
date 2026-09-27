-- CreateTable
CREATE TABLE "areas" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "active" BOOLEAN NOT NULL DEFAULT true
);

-- CreateTable
CREATE TABLE "screens" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "area_id" INTEGER,
    "volume" INTEGER NOT NULL DEFAULT 80,
    "sound_enabled" BOOLEAN NOT NULL DEFAULT true,
    CONSTRAINT "screens_area_id_fkey" FOREIGN KEY ("area_id") REFERENCES "areas" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "shifts" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "start_time" TEXT NOT NULL,
    "end_time" TEXT NOT NULL,
    "days" TEXT NOT NULL DEFAULT '1,2,3,4,5',
    "active" BOOLEAN NOT NULL DEFAULT true
);

-- CreateTable
CREATE TABLE "gateway_config" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT DEFAULT 1,
    "host" TEXT NOT NULL DEFAULT '',
    "port" INTEGER NOT NULL DEFAULT 502,
    "poll_interval_ms" INTEGER NOT NULL DEFAULT 300,
    "timeout_ms" INTEGER NOT NULL DEFAULT 1000,
    "watchdog_cycles" INTEGER NOT NULL DEFAULT 20,
    "enabled" BOOLEAN NOT NULL DEFAULT false
);

-- CreateTable
CREATE TABLE "devices" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL DEFAULT '',
    "workcenter_id" TEXT NOT NULL,
    "status_row" INTEGER NOT NULL,
    "modbus_unit_id" INTEGER,
    "register_address" INTEGER,
    "read_type" TEXT NOT NULL DEFAULT 'bit',
    "active" BOOLEAN NOT NULL DEFAULT true,
    CONSTRAINT "devices_workcenter_id_fkey" FOREIGN KEY ("workcenter_id") REFERENCES "workcenters" ("workcenter_id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_workcenters" (
    "workcenter_row" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "workcenter_id" TEXT NOT NULL,
    "workcenter_name" TEXT NOT NULL,
    "workcenter_name_zh" TEXT NOT NULL DEFAULT '',
    "area_id" INTEGER,
    "status1" TEXT NOT NULL DEFAULT 'green',
    "status2" TEXT NOT NULL DEFAULT 'green',
    "status3" TEXT NOT NULL DEFAULT 'green',
    "status4" TEXT NOT NULL DEFAULT 'green',
    "status5" TEXT NOT NULL DEFAULT 'green',
    CONSTRAINT "workcenters_area_id_fkey" FOREIGN KEY ("area_id") REFERENCES "areas" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_workcenters" ("status1", "status2", "status3", "status4", "status5", "workcenter_id", "workcenter_name", "workcenter_name_zh", "workcenter_row") SELECT "status1", "status2", "status3", "status4", "status5", "workcenter_id", "workcenter_name", "workcenter_name_zh", "workcenter_row" FROM "workcenters";
DROP TABLE "workcenters";
ALTER TABLE "new_workcenters" RENAME TO "workcenters";
CREATE UNIQUE INDEX "workcenters_workcenter_id_key" ON "workcenters"("workcenter_id");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "devices_modbus_unit_id_register_address_key" ON "devices"("modbus_unit_id", "register_address");

-- Data: existing stations start in a default area so the first TV has something to show.
INSERT INTO "areas" ("id", "name", "sort_order", "active") VALUES (1, 'Área 1', 1, true);
UPDATE "workcenters" SET "area_id" = 1;
