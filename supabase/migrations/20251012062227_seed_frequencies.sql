-- Insert default frequency options
-- Using RFC 5545 RRULE format for recurrence rules

INSERT INTO "frequencies" ("label", "rrule") VALUES
  ('Una vez', NULL),
  ('Diariamente', 'FREQ=DAILY'),
  ('Cada día de la semana (Lun-Vie)', 'FREQ=DAILY;BYDAY=MO,TU,WE,TH,FR'),
  ('Semanalmente', 'FREQ=WEEKLY'),
  ('Cada dos semanas', 'FREQ=WEEKLY;INTERVAL=2'),
  ('Mensualmente', 'FREQ=MONTHLY'),
  ('Anualmente', 'FREQ=YEARLY')
ON CONFLICT DO NOTHING;
