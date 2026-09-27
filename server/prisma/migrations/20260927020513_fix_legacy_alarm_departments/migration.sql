-- Data only: logs written before the alarm types were reorganized into departments keep the old
-- names and slot numbers. Re-attribute them to the department each old type belongs to
-- (status_index is statusRow - 1: 0 Producción, 1 Calidad, 2 Mantenimiento, 3 Materiales).
UPDATE "andon_logs" SET "status_index" = 2, "alarm_name" = 'Mantenimiento' WHERE "alarm_name" = 'Machine trouble';
UPDATE "andon_logs" SET "status_index" = 1, "alarm_name" = 'Calidad' WHERE "alarm_name" = 'Quality issue';
UPDATE "andon_logs" SET "status_index" = 3, "alarm_name" = 'Materiales' WHERE "alarm_name" = 'Material shortage';
UPDATE "andon_logs" SET "status_index" = 0, "alarm_name" = 'Producción' WHERE "alarm_name" = 'Process abnormality';
