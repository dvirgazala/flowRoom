-- ============================================================
-- FlowRoom — Supabase Schema
-- Professional social music platform
-- ============================================================

-- Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm"; -- for full-text search on usernames

-- ============================================================
-- PROFILES
-- ============================================================
CREATE TABLE IF NOT EXISTS profiles (
  id             UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username       TEXT UNIQUE NOT NULL,
  display_name   TEXT NOT NULL,
  bio            TEXT DEFAULT '',
  avatar_url     TEXT,
  cover_url      TEXT,
  role           TEXT DEFAULT '',          -- זמר, מפיק, כותב וכו
  location       TEXT DEFAULT '',
  website        TEXT DEFAULT '',
  is_verified    BOOLEAN DEFAULT FALSE,
  is_suspended   BOOLEAN DEFAULT FALSE,
  warnings       INT DEFAULT 0,
  rating         NUMERIC(3,1) DEFAULT 4.5,
  songs_count    INT DEFAULT 0,
  followers_count INT DEFAULT 0,
  following_count INT DEFAULT 0,
  is_online      BOOLEAN DEFAULT FALSE,
  last_seen      TIMESTAMPTZ DEFAULT NOW(),
  is_admin       BOOLEAN DEFAULT FALSE,
  created_at     TIMESTAMPTZ DEFAULT NOW(),
  updated_at     TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- FOLLOWS
-- ============================================================
CREATE TABLE IF NOT EXISTS follows (
  follower_id  UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  following_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (follower_id, following_id),
  CHECK (follower_id != following_id)
);
CREATE INDEX IF NOT EXISTS follows_follower_idx  ON follows(follower_id);
CREATE INDEX IF NOT EXISTS follows_following_idx ON follows(following_id);

-- ============================================================
-- POSTS
-- ============================================================
CREATE TABLE IF NOT EXISTS posts (
  id             UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id        UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  content        TEXT NOT NULL,
  media_urls     TEXT[] DEFAULT '{}',
  audio_url      TEXT,
  privacy        TEXT DEFAULT 'public' CHECK (privacy IN ('public', 'friends', 'private')),
  mood           TEXT DEFAULT '',
  location       TEXT DEFAULT '',
  hashtags       TEXT[] DEFAULT '{}',
  likes_count    INT DEFAULT 0,
  comments_count INT DEFAULT 0,
  shares_count   INT DEFAULT 0,
  created_at     TIMESTAMPTZ DEFAULT NOW(),
  updated_at     TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS posts_user_idx       ON posts(user_id);
CREATE INDEX IF NOT EXISTS posts_created_idx    ON posts(created_at DESC);
CREATE INDEX IF NOT EXISTS posts_hashtags_idx   ON posts USING GIN(hashtags);

-- ============================================================
-- POST LIKES
-- ============================================================
CREATE TABLE IF NOT EXISTS post_likes (
  user_id    UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  post_id    UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (user_id, post_id)
);

-- ============================================================
-- COMMENTS
-- ============================================================
CREATE TABLE IF NOT EXISTS comments (
  id             UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  post_id        UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  user_id        UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  text           TEXT NOT NULL,
  likes_count    INT DEFAULT 0,
  dislikes_count INT DEFAULT 0,
  created_at     TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS comments_post_idx ON comments(post_id);

-- ============================================================
-- COMMENT REACTIONS
-- ============================================================
CREATE TABLE IF NOT EXISTS comment_reactions (
  user_id    UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  comment_id UUID NOT NULL REFERENCES comments(id) ON DELETE CASCADE,
  type       TEXT NOT NULL CHECK (type IN ('like', 'dislike')),
  PRIMARY KEY (user_id, comment_id)
);

-- ============================================================
-- ROOMS (Collaboration spaces)
-- ============================================================
CREATE TABLE IF NOT EXISTS rooms (
  id            UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name          TEXT NOT NULL,
  description   TEXT DEFAULT '',
  genre         TEXT DEFAULT 'כללי',
  current_stage INT DEFAULT 0 CHECK (current_stage BETWEEN 0 AND 6),
  is_active     BOOLEAN DEFAULT TRUE,
  cover_url     TEXT,
  created_by    UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- ROOM MEMBERS
-- ============================================================
CREATE TABLE IF NOT EXISTS room_members (
  room_id    UUID NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
  user_id    UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  role       TEXT NOT NULL DEFAULT 'חבר',
  is_admin   BOOLEAN NOT NULL DEFAULT FALSE,
  split      INT DEFAULT 0 CHECK (split BETWEEN 0 AND 100),
  has_signed BOOLEAN DEFAULT FALSE,
  joined_at  TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (room_id, user_id)
);
CREATE INDEX IF NOT EXISTS room_members_user_idx ON room_members(user_id);

-- ============================================================
-- ROOM STEMS (Audio files)
-- ============================================================
CREATE TABLE IF NOT EXISTS room_stems (
  id          UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  room_id     UUID NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  audio_url   TEXT NOT NULL,
  file_size   TEXT DEFAULT '—',
  uploaded_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- ROOM MESSAGES (Chat)
-- ============================================================
CREATE TABLE IF NOT EXISTS room_messages (
  id         UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  room_id    UUID NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
  user_id    UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  text       TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS room_messages_room_idx ON room_messages(room_id, created_at);

-- ============================================================
-- ROOM TASKS
-- ============================================================
CREATE TABLE IF NOT EXISTS room_tasks (
  id          UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  room_id     UUID NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
  title       TEXT NOT NULL,
  done        BOOLEAN DEFAULT FALSE,
  assigned_to UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- ROOM ACTIVITY
-- ============================================================
CREATE TABLE IF NOT EXISTS room_activity (
  id         UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  room_id    UUID NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
  user_id    UUID REFERENCES profiles(id) ON DELETE SET NULL,
  action     TEXT NOT NULL,
  type       TEXT DEFAULT 'action' CHECK (type IN ('join','stem','stage','chat','action')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- DIRECT MESSAGES
-- ============================================================
CREATE TABLE IF NOT EXISTS direct_messages (
  id           UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  from_user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  to_user_id   UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  text         TEXT NOT NULL,
  read         BOOLEAN DEFAULT FALSE,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS dm_to_idx   ON direct_messages(to_user_id, created_at);
CREATE INDEX IF NOT EXISTS dm_from_idx ON direct_messages(from_user_id, created_at);

-- ============================================================
-- NOTIFICATIONS
-- ============================================================
CREATE TABLE IF NOT EXISTS notifications (
  id           UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id      UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  from_user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  type         TEXT NOT NULL CHECK (type IN ('like','comment','follow','mention','room_invite','split_request','room_admin')),
  post_id      UUID REFERENCES posts(id) ON DELETE SET NULL,
  room_id      UUID REFERENCES rooms(id) ON DELETE SET NULL,
  message      TEXT DEFAULT '',
  read         BOOLEAN DEFAULT FALSE,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS notif_user_idx ON notifications(user_id, created_at DESC);

-- ============================================================
-- PRODUCTS (Marketplace)
-- ============================================================
CREATE TABLE IF NOT EXISTS products (
  id                UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  seller_id         UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title             TEXT NOT NULL,
  description       TEXT DEFAULT '',
  price             NUMERIC(10,2) NOT NULL,
  category          TEXT DEFAULT '',
  audio_preview_url TEXT,
  cover_url         TEXT,
  tags              TEXT[] DEFAULT '{}',
  sales_count       INT DEFAULT 0,
  rating            NUMERIC(3,1) DEFAULT 0,
  is_active         BOOLEAN DEFAULT TRUE,
  created_at        TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- ADMIN LOGS
-- ============================================================
CREATE TABLE IF NOT EXISTS admin_logs (
  id             UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  admin_id       UUID REFERENCES profiles(id) ON DELETE SET NULL,
  action         TEXT NOT NULL,
  target_user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  details        TEXT DEFAULT '',
  created_at     TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- STORAGE BUCKETS (run in Supabase dashboard Storage tab)
-- ============================================================
-- INSERT INTO storage.buckets (id, name, public) VALUES ('avatars', 'avatars', true);
-- INSERT INTO storage.buckets (id, name, public) VALUES ('covers', 'covers', true);
-- INSERT INTO storage.buckets (id, name, public) VALUES ('post-media', 'post-media', true);
-- INSERT INTO storage.buckets (id, name, public) VALUES ('stems', 'stems', true);

-- ============================================================
-- FUNCTIONS & TRIGGERS
-- ============================================================

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger AS $$
DECLARE
  base_username TEXT;
  final_username TEXT;
  counter INT := 0;
BEGIN
  base_username := COALESCE(
    NEW.raw_user_meta_data->>'username',
    split_part(NEW.email, '@', 1)
  );
  -- Ensure unique username
  final_username := base_username;
  WHILE EXISTS (SELECT 1 FROM public.profiles WHERE username = final_username) LOOP
    counter := counter + 1;
    final_username := base_username || counter::TEXT;
  END LOOP;

  INSERT INTO public.profiles (id, username, display_name, avatar_url, role)
  VALUES (
    NEW.id,
    final_username,
    COALESCE(NEW.raw_user_meta_data->>'display_name', base_username),
    NEW.raw_user_meta_data->>'avatar_url',
    COALESCE(NEW.raw_user_meta_data->>'role', '')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION touch_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER profiles_updated_at BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION touch_updated_at();
CREATE TRIGGER posts_updated_at BEFORE UPDATE ON posts
  FOR EACH ROW EXECUTE FUNCTION touch_updated_at();
CREATE TRIGGER rooms_updated_at BEFORE UPDATE ON rooms
  FOR EACH ROW EXECUTE FUNCTION touch_updated_at();

-- Post likes count
CREATE OR REPLACE FUNCTION update_post_likes_count()
RETURNS trigger AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE posts SET likes_count = likes_count + 1 WHERE id = NEW.post_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE posts SET likes_count = GREATEST(0, likes_count - 1) WHERE id = OLD.post_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS post_likes_count_trigger ON post_likes;
CREATE TRIGGER post_likes_count_trigger
  AFTER INSERT OR DELETE ON post_likes
  FOR EACH ROW EXECUTE FUNCTION update_post_likes_count();

-- Post comments count
CREATE OR REPLACE FUNCTION update_post_comments_count()
RETURNS trigger AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE posts SET comments_count = comments_count + 1 WHERE id = NEW.post_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE posts SET comments_count = GREATEST(0, comments_count - 1) WHERE id = OLD.post_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS post_comments_count_trigger ON comments;
CREATE TRIGGER post_comments_count_trigger
  AFTER INSERT OR DELETE ON comments
  FOR EACH ROW EXECUTE FUNCTION update_post_comments_count();

-- Follow counts
CREATE OR REPLACE FUNCTION update_follow_counts()
RETURNS trigger AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE profiles SET followers_count = followers_count + 1 WHERE id = NEW.following_id;
    UPDATE profiles SET following_count = following_count + 1 WHERE id = NEW.follower_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE profiles SET followers_count = GREATEST(0, followers_count - 1) WHERE id = OLD.following_id;
    UPDATE profiles SET following_count = GREATEST(0, following_count - 1) WHERE id = OLD.follower_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS follow_counts_trigger ON follows;
CREATE TRIGGER follow_counts_trigger
  AFTER INSERT OR DELETE ON follows
  FOR EACH ROW EXECUTE FUNCTION update_follow_counts();

-- Comment reactions count
CREATE OR REPLACE FUNCTION update_comment_reaction_count()
RETURNS trigger AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW.type = 'like' THEN
      UPDATE comments SET likes_count = likes_count + 1 WHERE id = NEW.comment_id;
    ELSE
      UPDATE comments SET dislikes_count = dislikes_count + 1 WHERE id = NEW.comment_id;
    END IF;
  ELSIF TG_OP = 'DELETE' THEN
    IF OLD.type = 'like' THEN
      UPDATE comments SET likes_count = GREATEST(0, likes_count - 1) WHERE id = OLD.comment_id;
    ELSE
      UPDATE comments SET dislikes_count = GREATEST(0, dislikes_count - 1) WHERE id = OLD.comment_id;
    END IF;
  ELSIF TG_OP = 'UPDATE' THEN
    -- flipped reaction
    IF OLD.type = 'like' THEN
      UPDATE comments SET likes_count = GREATEST(0, likes_count - 1),
                         dislikes_count = dislikes_count + 1 WHERE id = NEW.comment_id;
    ELSE
      UPDATE comments SET dislikes_count = GREATEST(0, dislikes_count - 1),
                         likes_count = likes_count + 1 WHERE id = NEW.comment_id;
    END IF;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS comment_reactions_count_trigger ON comment_reactions;
CREATE TRIGGER comment_reactions_count_trigger
  AFTER INSERT OR DELETE OR UPDATE ON comment_reactions
  FOR EACH ROW EXECUTE FUNCTION update_comment_reaction_count();

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

ALTER TABLE profiles         ENABLE ROW LEVEL SECURITY;
ALTER TABLE follows           ENABLE ROW LEVEL SECURITY;
ALTER TABLE posts             ENABLE ROW LEVEL SECURITY;
ALTER TABLE post_likes        ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments          ENABLE ROW LEVEL SECURITY;
ALTER TABLE comment_reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE rooms             ENABLE ROW LEVEL SECURITY;
ALTER TABLE room_members      ENABLE ROW LEVEL SECURITY;
ALTER TABLE room_stems        ENABLE ROW LEVEL SECURITY;
ALTER TABLE room_messages     ENABLE ROW LEVEL SECURITY;
ALTER TABLE room_tasks        ENABLE ROW LEVEL SECURITY;
ALTER TABLE room_activity     ENABLE ROW LEVEL SECURITY;
ALTER TABLE direct_messages   ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications     ENABLE ROW LEVEL SECURITY;
ALTER TABLE products          ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_logs        ENABLE ROW LEVEL SECURITY;

-- Profiles: anyone can read, only owner can edit
CREATE POLICY "profiles_select"    ON profiles FOR SELECT USING (true);
CREATE POLICY "profiles_insert"    ON profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "profiles_update"    ON profiles FOR UPDATE USING (auth.uid() = id);

-- Follows: public read, own write
CREATE POLICY "follows_select"     ON follows FOR SELECT USING (true);
CREATE POLICY "follows_insert"     ON follows FOR INSERT WITH CHECK (auth.uid() = follower_id);
CREATE POLICY "follows_delete"     ON follows FOR DELETE USING (auth.uid() = follower_id);

-- Posts: public posts visible to all, own posts always visible
CREATE POLICY "posts_select"       ON posts FOR SELECT USING (privacy = 'public' OR user_id = auth.uid());
CREATE POLICY "posts_insert"       ON posts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "posts_update"       ON posts FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "posts_delete"       ON posts FOR DELETE USING (auth.uid() = user_id);

-- Post likes
CREATE POLICY "post_likes_select"  ON post_likes FOR SELECT USING (true);
CREATE POLICY "post_likes_insert"  ON post_likes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "post_likes_delete"  ON post_likes FOR DELETE USING (auth.uid() = user_id);

-- Comments
CREATE POLICY "comments_select"    ON comments FOR SELECT USING (true);
CREATE POLICY "comments_insert"    ON comments FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "comments_delete"    ON comments FOR DELETE USING (auth.uid() = user_id);

-- Comment reactions
CREATE POLICY "comment_reactions_select" ON comment_reactions FOR SELECT USING (true);
CREATE POLICY "comment_reactions_write"  ON comment_reactions FOR ALL USING (auth.uid() = user_id);

-- Rooms: visible to members and public rooms
CREATE POLICY "rooms_select"       ON rooms FOR SELECT USING (
  is_active = true
  OR created_by = auth.uid()
  OR EXISTS (SELECT 1 FROM room_members WHERE room_id = rooms.id AND user_id = auth.uid())
);
CREATE POLICY "rooms_insert"       ON rooms FOR INSERT WITH CHECK (auth.uid() = created_by);
CREATE POLICY "rooms_update"       ON rooms FOR UPDATE USING (auth.uid() = created_by);
CREATE POLICY "rooms_delete"       ON rooms FOR DELETE USING (auth.uid() = created_by);

-- Room members
CREATE POLICY "room_members_select" ON room_members FOR SELECT USING (true);
CREATE POLICY "room_members_insert" ON room_members FOR INSERT WITH CHECK (
  auth.uid() = user_id
  OR auth.uid() IN (SELECT created_by FROM rooms WHERE id = room_id)
);
CREATE POLICY "room_members_delete" ON room_members FOR DELETE USING (
  auth.uid() = user_id
  OR auth.uid() IN (SELECT created_by FROM rooms WHERE id = room_id)
  OR EXISTS (SELECT 1 FROM room_members rm WHERE rm.room_id = room_members.room_id AND rm.user_id = auth.uid() AND rm.is_admin = true)
);
CREATE POLICY "room_members_update" ON room_members FOR UPDATE USING (
  auth.uid() IN (SELECT created_by FROM rooms WHERE id = room_id)
  OR EXISTS (SELECT 1 FROM room_members rm WHERE rm.room_id = room_members.room_id AND rm.user_id = auth.uid() AND rm.is_admin = true)
  OR (auth.uid() = user_id AND has_signed = false)
);

-- Room stems
CREATE POLICY "room_stems_select"  ON room_stems FOR SELECT USING (
  EXISTS (SELECT 1 FROM room_members WHERE room_id = room_stems.room_id AND user_id = auth.uid())
);
CREATE POLICY "room_stems_insert"  ON room_stems FOR INSERT WITH CHECK (
  auth.uid() = uploaded_by
  AND EXISTS (SELECT 1 FROM room_members WHERE room_id = room_stems.room_id AND user_id = auth.uid())
);

-- Room messages
CREATE POLICY "room_messages_select" ON room_messages FOR SELECT USING (
  EXISTS (SELECT 1 FROM room_members WHERE room_id = room_messages.room_id AND user_id = auth.uid())
);
CREATE POLICY "room_messages_insert" ON room_messages FOR INSERT WITH CHECK (
  auth.uid() = user_id
  AND EXISTS (SELECT 1 FROM room_members WHERE room_id = room_messages.room_id AND user_id = auth.uid())
);

-- Room tasks
CREATE POLICY "room_tasks_select"  ON room_tasks FOR SELECT USING (
  EXISTS (SELECT 1 FROM room_members WHERE room_id = room_tasks.room_id AND user_id = auth.uid())
);
CREATE POLICY "room_tasks_write"   ON room_tasks FOR ALL USING (
  EXISTS (SELECT 1 FROM room_members WHERE room_id = room_tasks.room_id AND user_id = auth.uid())
);

-- Room activity
CREATE POLICY "room_activity_select" ON room_activity FOR SELECT USING (
  EXISTS (SELECT 1 FROM room_members WHERE room_id = room_activity.room_id AND user_id = auth.uid())
);
CREATE POLICY "room_activity_insert" ON room_activity FOR INSERT WITH CHECK (true);

-- Direct messages
CREATE POLICY "dm_select"          ON direct_messages FOR SELECT USING (
  auth.uid() = from_user_id OR auth.uid() = to_user_id
);
CREATE POLICY "dm_insert"          ON direct_messages FOR INSERT WITH CHECK (auth.uid() = from_user_id);
CREATE POLICY "dm_update"          ON direct_messages FOR UPDATE USING (auth.uid() = to_user_id);

-- Notifications
CREATE POLICY "notif_select"       ON notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "notif_insert"       ON notifications FOR INSERT WITH CHECK (true);
CREATE POLICY "notif_update"       ON notifications FOR UPDATE USING (auth.uid() = user_id);

-- Products
CREATE POLICY "products_select"    ON products FOR SELECT USING (is_active = true OR seller_id = auth.uid());
CREATE POLICY "products_write"     ON products FOR ALL USING (auth.uid() = seller_id);

-- Admin logs: only admins
CREATE POLICY "admin_logs_select"  ON admin_logs FOR SELECT USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
);
CREATE POLICY "admin_logs_insert"  ON admin_logs FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
);
