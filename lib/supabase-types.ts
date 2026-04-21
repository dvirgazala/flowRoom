// Database types matching supabase/schema.sql
// Hand-maintained — keep in sync with the SQL file.

export type Privacy = 'public' | 'friends' | 'private'
export type NotificationType = 'like' | 'comment' | 'follow' | 'mention' | 'room_invite' | 'split_request' | 'room_admin' | 'split_locked'
export type ActivityType = 'join' | 'stem' | 'stage' | 'chat' | 'action'

export interface DbProfile {
  id: string
  username: string
  display_name: string
  bio: string
  avatar_url: string | null
  cover_url: string | null
  role: string
  location: string
  website: string
  is_verified: boolean
  is_suspended: boolean
  warnings: number
  rating: number
  songs_count: number
  followers_count: number
  following_count: number
  is_online: boolean
  last_seen: string
  is_admin: boolean
  created_at: string
  updated_at: string
}

export interface DbPost {
  id: string
  user_id: string
  content: string
  media_urls: string[]
  audio_url: string | null
  privacy: Privacy
  mood: string
  location: string
  hashtags: string[]
  likes_count: number
  comments_count: number
  shares_count: number
  created_at: string
  updated_at: string
}

export interface DbComment {
  id: string
  post_id: string
  user_id: string
  text: string
  likes_count: number
  dislikes_count: number
  created_at: string
}

export interface DbRoom {
  id: string
  name: string
  description: string
  genre: string
  current_stage: number
  is_active: boolean
  cover_url: string | null
  created_by: string | null
  created_at: string
  updated_at: string
}

export interface DbRoomMember {
  room_id: string
  user_id: string
  role: string
  is_admin: boolean
  split: number
  has_signed: boolean
  joined_at: string
}

export interface DbRoomStem {
  id: string
  room_id: string
  name: string
  audio_url: string
  file_size: string
  uploaded_by: string | null
  created_at: string
}

export interface DbRoomMessage {
  id: string
  room_id: string
  user_id: string
  text: string
  created_at: string
}

export interface DbRoomTask {
  id: string
  room_id: string
  title: string
  done: boolean
  assigned_to: string | null
  stage: number
  sort_order: number
  created_at: string
}

export interface DbDirectMessage {
  id: string
  from_user_id: string
  to_user_id: string
  text: string
  read: boolean
  created_at: string
}

export interface DbNotification {
  id: string
  user_id: string
  from_user_id: string | null
  type: NotificationType
  post_id: string | null
  room_id: string | null
  message: string
  read: boolean
  created_at: string
}

export interface DbSplitSheet {
  id: string
  room_id: string
  track_title: string
  isrc: string | null
  iswc: string | null
  status: 'draft' | 'pending_signatures' | 'locked'
  version: number
  created_by: string
  created_at: string
  locked_at: string | null
}

export interface DbSplitParticipant {
  id: string
  sheet_id: string
  category: 'publishing' | 'master' | 'producer'
  user_id: string
  share_pct: number
  role: string | null
  has_signed: boolean
  signed_at: string | null
}

export interface DbSplitRegistration {
  id: string
  sheet_id: string
  body: 'acum' | 'pil' | 'eshkolot' | 'distributor' | 'youtube-cid'
  status: 'not_registered' | 'pending' | 'registered' | 'rejected'
  reference: string | null
  notes: string | null
  submitted_at: string | null
  registered_at: string | null
}

export interface FullSplitSheet extends DbSplitSheet {
  participants: (DbSplitParticipant & { profile: DbProfile })[]
  registrations: DbSplitRegistration[]
}

export interface DbStory {
  id: string
  user_id: string
  media_url: string
  text_overlay: string | null
  created_at: string
  expires_at: string
}

export interface StoryWithAuthor extends DbStory {
  author: DbProfile
  view_count: number
  viewed_by_me: boolean
}

export interface DbProduct {
  id: string
  seller_id: string
  title: string
  description: string
  price: number
  category: string
  audio_preview_url: string | null
  cover_url: string | null
  tags: string[]
  sales_count: number
  rating: number
  is_active: boolean
  created_at: string
}

// ============================================================
// Strongly-typed Database shape for supabase-js generics
// ============================================================
export interface Database {
  public: {
    Tables: {
      profiles:          { Row: DbProfile;        Insert: Partial<DbProfile> & { id: string; username: string; display_name: string }; Update: Partial<DbProfile> }
      follows:           { Row: { follower_id: string; following_id: string; created_at: string }; Insert: { follower_id: string; following_id: string }; Update: never }
      posts:             { Row: DbPost;           Insert: Partial<DbPost> & { user_id: string; content: string };                                 Update: Partial<DbPost> }
      post_likes:        { Row: { user_id: string; post_id: string; created_at: string };         Insert: { user_id: string; post_id: string };   Update: never }
      comments:          { Row: DbComment;        Insert: Partial<DbComment> & { post_id: string; user_id: string; text: string };               Update: Partial<DbComment> }
      comment_reactions: { Row: { user_id: string; comment_id: string; type: 'like' | 'dislike' }; Insert: { user_id: string; comment_id: string; type: 'like' | 'dislike' }; Update: { type: 'like' | 'dislike' } }
      rooms:             { Row: DbRoom;           Insert: Partial<DbRoom> & { name: string };                                                     Update: Partial<DbRoom> }
      room_members:      { Row: DbRoomMember;     Insert: Partial<DbRoomMember> & { room_id: string; user_id: string; role: string };            Update: Partial<DbRoomMember> }
      room_stems:        { Row: DbRoomStem;       Insert: Partial<DbRoomStem> & { room_id: string; name: string; audio_url: string };            Update: Partial<DbRoomStem> }
      room_messages:     { Row: DbRoomMessage;    Insert: Partial<DbRoomMessage> & { room_id: string; user_id: string; text: string };           Update: never }
      room_tasks:        { Row: DbRoomTask;       Insert: Partial<DbRoomTask> & { room_id: string; title: string };                              Update: Partial<DbRoomTask> }
      direct_messages:   { Row: DbDirectMessage;  Insert: Partial<DbDirectMessage> & { from_user_id: string; to_user_id: string; text: string }; Update: Partial<DbDirectMessage> }
      notifications:     { Row: DbNotification;   Insert: Partial<DbNotification> & { user_id: string; type: NotificationType };                 Update: Partial<DbNotification> }
      products:          { Row: DbProduct;        Insert: Partial<DbProduct> & { seller_id: string; title: string; price: number };              Update: Partial<DbProduct> }
    }
  }
}
