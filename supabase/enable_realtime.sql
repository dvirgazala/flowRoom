-- Run this in Supabase SQL Editor → enable Realtime for feed tables
ALTER PUBLICATION supabase_realtime ADD TABLE posts;
ALTER PUBLICATION supabase_realtime ADD TABLE comments;
