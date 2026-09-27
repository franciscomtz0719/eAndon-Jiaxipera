-- CreateTable
CREATE TABLE "alarm_events" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "workcenter_id" TEXT NOT NULL,
    "workcenter_name" TEXT NOT NULL,
    "status_row" INTEGER NOT NULL,
    "department_name" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "opened_at" DATETIME NOT NULL,
    "closed_at" DATETIME,
    "opened_by" TEXT NOT NULL,
    "closed_by" TEXT,
    "press_count" INTEGER NOT NULL DEFAULT 0,
    "last_press_at" DATETIME,
    "detail_location" TEXT,
    "detail_type" TEXT,
    "detail_text" TEXT
);

-- CreateTable
CREATE TABLE "button_presses" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "device_id" INTEGER,
    "workcenter_id" TEXT NOT NULL,
    "status_row" INTEGER NOT NULL,
    "source" TEXT NOT NULL,
    "pressed_at" DATETIME NOT NULL,
    "result" TEXT NOT NULL,
    "event_id" INTEGER,
    "idempotency_key" TEXT,
    CONSTRAINT "button_presses_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "alarm_events" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "alarm_events_workcenter_id_status_row_state_idx" ON "alarm_events"("workcenter_id", "status_row", "state");

-- CreateIndex
CREATE INDEX "alarm_events_opened_at_idx" ON "alarm_events"("opened_at");

-- CreateIndex
CREATE UNIQUE INDEX "button_presses_idempotency_key_key" ON "button_presses"("idempotency_key");

-- CreateIndex
CREATE INDEX "button_presses_workcenter_id_pressed_at_idx" ON "button_presses"("workcenter_id", "pressed_at");

-- Data: every finished alarm in the old andon_logs becomes a closed event (andon_logs is kept, no longer written).
-- There were no open alarms at migration time. "-- N/A --" means the detail was left unselected.
INSERT INTO "alarm_events" ("workcenter_id", "workcenter_name", "status_row", "department_name", "state", "opened_at", "closed_at", "opened_by", "closed_by", "press_count", "detail_location", "detail_type", "detail_text")
SELECT "workcenter_id", COALESCE("workcenter_name", ''), "status_index" + 1, COALESCE("alarm_name", ''), 'closed', "alarm_start_time", "alarm_end_time", 'migrated', 'migrated', 0,
       NULLIF(NULLIF("alarm_start_text1", ''), '-- N/A --'), NULLIF(NULLIF("alarm_start_text2", ''), '-- N/A --'), NULLIF("alarm_start_text3", '')
FROM "andon_logs"
WHERE "alarm_start_time" IS NOT NULL AND "alarm_end_time" IS NOT NULL
ORDER BY "alarm_start_time";
