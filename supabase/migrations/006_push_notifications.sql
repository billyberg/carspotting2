-- Add notification preference to profiles
ALTER TABLE profiles
  ADD COLUMN notification_pref TEXT NOT NULL DEFAULT 'none'
  CHECK (notification_pref IN ('all', 'overtakes', 'none'));

-- Push subscriptions (one row per browser/device per user profile)
CREATE TABLE push_subscriptions (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id  UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  endpoint    TEXT NOT NULL,
  p256dh      TEXT NOT NULL,
  auth        TEXT NOT NULL,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (profile_id, endpoint)
);

ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;

-- Only the owner of the (non-fake) profile can manage their subscriptions
CREATE POLICY "push_subscriptions_select"
  ON push_subscriptions FOR SELECT
  USING (profile_id IN (
    SELECT id FROM profiles WHERE user_id = auth.uid() AND is_fake = false
  ));

CREATE POLICY "push_subscriptions_insert"
  ON push_subscriptions FOR INSERT
  WITH CHECK (profile_id IN (
    SELECT id FROM profiles WHERE user_id = auth.uid() AND is_fake = false
  ));

CREATE POLICY "push_subscriptions_delete"
  ON push_subscriptions FOR DELETE
  USING (profile_id IN (
    SELECT id FROM profiles WHERE user_id = auth.uid() AND is_fake = false
  ));
