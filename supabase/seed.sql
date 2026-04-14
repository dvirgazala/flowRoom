-- ============================================================
-- FlowRoom — Seed Data
-- Run AFTER schema.sql and AFTER creating the storage buckets.
-- This creates the demo users via auth.users + profiles.
-- ============================================================

-- NOTE: In Supabase, auth users are created via the Auth API, not by INSERT.
-- For seeding demo users, use the Supabase Dashboard → Authentication → Users → Add user
-- OR run this through the Admin API / SQL with caution.

-- Demo profiles will be created automatically by the handle_new_user trigger
-- when users sign up. The seed below inserts example POSTS, ROOMS, etc. that
-- reference profiles — you must have profiles created first.

-- ============================================================
-- Helper: Create demo users by signup through the app:
-- Email: avi@flowroom.demo        password: flowroom123  role: מפיק
-- Email: noa@flowroom.demo        password: flowroom123  role: זמרת
-- Email: yael@flowroom.demo       password: flowroom123  role: זמרת
-- Email: rachel@flowroom.demo     password: flowroom123  role: מיקס
-- Email: dan@flowroom.demo        password: flowroom123  role: כותב
-- (etc - 12 total)
-- ============================================================

-- Example: Seed a post for a known profile id
-- INSERT INTO posts (user_id, content, privacy, hashtags)
-- VALUES (
--   (SELECT id FROM profiles WHERE username = 'avi'),
--   'ביט חדש שעבדתי עליו! מחפש זמר/ת לשיתוף פעולה 🎵',
--   'public',
--   ARRAY['#ביט','#הפקה','#שיתוף']
-- );
