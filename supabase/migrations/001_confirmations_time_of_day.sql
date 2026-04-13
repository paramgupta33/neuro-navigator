-- Run in Supabase SQL editor (or via migration pipeline)
-- 1) Visit time on reports
ALTER TABLE sensory_reports
ADD COLUMN IF NOT EXISTS time_of_day text;

-- 2) One confirmation per anonymous user per report
CREATE TABLE IF NOT EXISTS confirmations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  report_id uuid NOT NULL REFERENCES sensory_reports (id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, report_id)
);

CREATE INDEX IF NOT EXISTS confirmations_user_id_idx ON confirmations (user_id);
CREATE INDEX IF NOT EXISTS confirmations_report_id_idx ON confirmations (report_id);

-- Optional: allow anon read/write for hackathon demo (tighten for production)
ALTER TABLE confirmations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "confirmations_anon_all" ON confirmations;
CREATE POLICY "confirmations_anon_all" ON confirmations
  FOR ALL
  USING (true)
  WITH CHECK (true);
