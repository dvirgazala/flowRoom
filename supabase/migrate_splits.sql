-- Split Sheets migration
-- Creates three tables: split_sheets, split_participants, split_registrations

CREATE TABLE IF NOT EXISTS split_sheets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id UUID REFERENCES rooms(id) ON DELETE CASCADE,
  track_title TEXT NOT NULL,
  isrc TEXT,
  iswc TEXT,
  status TEXT NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft', 'pending_signatures', 'locked')),
  version INT NOT NULL DEFAULT 1,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  locked_at TIMESTAMPTZ,
  UNIQUE(room_id)
);

CREATE TABLE IF NOT EXISTS split_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sheet_id UUID REFERENCES split_sheets(id) ON DELETE CASCADE,
  category TEXT NOT NULL CHECK (category IN ('publishing', 'master', 'producer')),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  share_pct NUMERIC(5,2) NOT NULL DEFAULT 0,
  role TEXT,
  has_signed BOOLEAN NOT NULL DEFAULT FALSE,
  signed_at TIMESTAMPTZ,
  UNIQUE(sheet_id, category, user_id)
);

CREATE TABLE IF NOT EXISTS split_registrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sheet_id UUID REFERENCES split_sheets(id) ON DELETE CASCADE,
  body TEXT NOT NULL CHECK (body IN ('acum', 'pil', 'eshkolot', 'distributor', 'youtube-cid')),
  status TEXT NOT NULL DEFAULT 'not_registered'
    CHECK (status IN ('not_registered', 'pending', 'registered', 'rejected')),
  reference TEXT,
  notes TEXT,
  submitted_at TIMESTAMPTZ,
  registered_at TIMESTAMPTZ,
  UNIQUE(sheet_id, body)
);

-- RLS
ALTER TABLE split_sheets ENABLE ROW LEVEL SECURITY;
ALTER TABLE split_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE split_registrations ENABLE ROW LEVEL SECURITY;

-- split_sheets: visible to room members or creator
DROP POLICY IF EXISTS "split_sheets_select" ON split_sheets;
CREATE POLICY "split_sheets_select" ON split_sheets FOR SELECT USING (
  created_by = auth.uid()
  OR EXISTS (
    SELECT 1 FROM room_members rm
    WHERE rm.room_id = split_sheets.room_id AND rm.user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "split_sheets_insert" ON split_sheets;
CREATE POLICY "split_sheets_insert" ON split_sheets FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM room_members rm
    WHERE rm.room_id = split_sheets.room_id AND rm.user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "split_sheets_update" ON split_sheets;
CREATE POLICY "split_sheets_update" ON split_sheets FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM room_members rm
    WHERE rm.room_id = split_sheets.room_id AND rm.user_id = auth.uid()
  )
);

-- split_participants: visible if sheet is visible
DROP POLICY IF EXISTS "split_participants_select" ON split_participants;
CREATE POLICY "split_participants_select" ON split_participants FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM split_sheets ss
    JOIN room_members rm ON rm.room_id = ss.room_id
    WHERE ss.id = split_participants.sheet_id AND rm.user_id = auth.uid()
  )
  OR user_id = auth.uid()
);

DROP POLICY IF EXISTS "split_participants_insert" ON split_participants;
CREATE POLICY "split_participants_insert" ON split_participants FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM split_sheets ss
    JOIN room_members rm ON rm.room_id = ss.room_id
    WHERE ss.id = split_participants.sheet_id AND rm.user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "split_participants_update" ON split_participants;
CREATE POLICY "split_participants_update" ON split_participants FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM split_sheets ss
    JOIN room_members rm ON rm.room_id = ss.room_id
    WHERE ss.id = split_participants.sheet_id AND rm.user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "split_participants_delete" ON split_participants;
CREATE POLICY "split_participants_delete" ON split_participants FOR DELETE USING (
  EXISTS (
    SELECT 1 FROM split_sheets ss
    JOIN room_members rm ON rm.room_id = ss.room_id
    WHERE ss.id = split_participants.sheet_id AND rm.user_id = auth.uid()
  )
);

-- split_registrations: same visibility as sheet
DROP POLICY IF EXISTS "split_registrations_select" ON split_registrations;
CREATE POLICY "split_registrations_select" ON split_registrations FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM split_sheets ss
    JOIN room_members rm ON rm.room_id = ss.room_id
    WHERE ss.id = split_registrations.sheet_id AND rm.user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "split_registrations_insert" ON split_registrations;
CREATE POLICY "split_registrations_insert" ON split_registrations FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM split_sheets ss
    JOIN room_members rm ON rm.room_id = ss.room_id
    WHERE ss.id = split_registrations.sheet_id AND rm.user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "split_registrations_update" ON split_registrations;
CREATE POLICY "split_registrations_update" ON split_registrations FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM split_sheets ss
    JOIN room_members rm ON rm.room_id = ss.room_id
    WHERE ss.id = split_registrations.sheet_id AND rm.user_id = auth.uid()
  )
);

-- Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE split_sheets;
ALTER PUBLICATION supabase_realtime ADD TABLE split_participants;
ALTER PUBLICATION supabase_realtime ADD TABLE split_registrations;

-- notifications: add split_locked type
ALTER TABLE notifications DROP CONSTRAINT IF EXISTS notifications_type_check;
ALTER TABLE notifications ADD CONSTRAINT notifications_type_check
  CHECK (type = ANY (ARRAY[
    'like','comment','follow','mention','room_invite','split_request','room_admin','split_locked'
  ]));
