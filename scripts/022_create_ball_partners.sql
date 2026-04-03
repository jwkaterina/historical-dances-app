-- Ball partners: users can assign partner names to dances in a ball
CREATE TABLE ball_partners (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ball_id uuid NOT NULL REFERENCES balls(id) ON DELETE CASCADE,
  section_dance_id uuid NOT NULL REFERENCES section_dances(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  partner_name text NOT NULL DEFAULT '',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE (ball_id, section_dance_id, user_id)
);

ALTER TABLE ball_partners ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own partners"
  ON ball_partners
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
