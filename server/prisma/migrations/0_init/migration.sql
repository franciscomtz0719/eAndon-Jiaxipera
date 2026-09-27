-- CreateTable
CREATE TABLE "workcenters" (
    "workcenter_row" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "workcenter_id" TEXT NOT NULL,
    "workcenter_name" TEXT NOT NULL,
    "workcenter_name_zh" TEXT NOT NULL DEFAULT '',
    "status1" TEXT NOT NULL DEFAULT 'green',
    "status2" TEXT NOT NULL DEFAULT 'green',
    "status3" TEXT NOT NULL DEFAULT 'green',
    "status4" TEXT NOT NULL DEFAULT 'green',
    "status5" TEXT NOT NULL DEFAULT 'green'
);

-- CreateTable
CREATE TABLE "status_definitions" (
    "status_row" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "status_name" TEXT NOT NULL,
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

-- CreateTable
CREATE TABLE "andon_logs" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "workcenter_id" TEXT NOT NULL,
    "workcenter_name" TEXT,
    "status_index" INTEGER NOT NULL,
    "alarm_name" TEXT,
    "old_status" TEXT NOT NULL,
    "new_status" TEXT NOT NULL,
    "change_date_time" DATETIME NOT NULL,
    "alarm_start_time" DATETIME,
    "alarm_end_time" DATETIME,
    "alarm_start_text1" TEXT,
    "alarm_start_text2" TEXT,
    "alarm_start_text3" TEXT,
    "alarm_end_text1" TEXT,
    "alarm_end_text2" TEXT,
    "alarm_end_text3" TEXT,
    "alarm_end_text4" TEXT
);

-- CreateTable
CREATE TABLE "settings" (
    "setting_id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "setting_name" TEXT NOT NULL,
    "current_setting" TEXT NOT NULL,
    "possible_settings" TEXT NOT NULL,
    "default_setting" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "localization" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "english" TEXT NOT NULL,
    "spanish" TEXT NOT NULL DEFAULT '',
    "translation" TEXT NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "workcenters_workcenter_id_key" ON "workcenters"("workcenter_id");

