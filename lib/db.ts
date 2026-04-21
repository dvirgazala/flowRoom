'use client'
import { supabase } from './supabase'
import type {
  DbProfile, DbPost, DbComment, DbRoom, DbRoomMember, DbRoomMessage,
  DbRoomStem, DbRoomTask, DbDirectMessage, DbNotification,
  Privacy, NotificationType,
} from './supabase-types'

// ============================================================
// AUTH
// ============================================================
export async function signUp(opts: {
  email: string
  password: string
  username: string
  displayName: string
  role?: string
}) {
  const { data, error } = await supabase.auth.signUp({
    email: opts.email,
    password: opts.password,
    options: {
      data: {
        username:     opts.username,
        display_name: opts.displayName,
        role:         opts.role ?? '',
      },
    },
  })
  return { data, error }
}

export async function signIn(email: string, password: string) {
  return supabase.auth.signInWithPassword({ email, password })
}

export async function signInWithOAuth(provider: 'google' | 'facebook' | 'apple' | 'github') {
  const redirectTo = typeof window !== 'undefined' ? `${window.location.origin}/feed` : undefined
  return supabase.auth.signInWithOAuth({ provider, options: { redirectTo } })
}

export async function signOut() {
  return supabase.auth.signOut()
}

export async function getSession() {
  const { data } = await supabase.auth.getSession()
  return data.session
}

// ============================================================
// PROFILES
// ============================================================
export async function getMyProfile(): Promise<DbProfile | null> {
  const session = await getSession()
  if (!session) return null
  const { data } = await supabase.from('profiles').select('*').eq('id', session.user.id).single()
  return data as DbProfile | null
}

export async function getProfileById(id: string): Promise<DbProfile | null> {
  const { data } = await supabase.from('profiles').select('*').eq('id', id).single()
  return data as DbProfile | null
}

export async function getProfileByUsername(username: string): Promise<DbProfile | null> {
  const { data } = await supabase.from('profiles').select('*').eq('username', username).single()
  return data as DbProfile | null
}

export async function updateProfile(id: string, patch: Partial<DbProfile>) {
  return supabase.from('profiles').update(patch).eq('id', id)
}

export async function searchProfiles(query: string, limit = 10) {
  const { data } = await supabase
    .from('profiles')
    .select('*')
    .or(`username.ilike.%${query}%,display_name.ilike.%${query}%`)
    .limit(limit)
  return (data ?? []) as DbProfile[]
}

export async function listAllProfiles(limit = 50): Promise<DbProfile[]> {
  const { data } = await supabase
    .from('profiles')
    .select('*')
    .order('followers_count', { ascending: false })
    .limit(limit)
  return (data ?? []) as DbProfile[]
}

// ============================================================
// FOLLOWS
// ============================================================
export async function followUser(targetId: string) {
  const session = await getSession(); if (!session) return
  return supabase.from('follows').insert({ follower_id: session.user.id, following_id: targetId })
}
export async function unfollowUser(targetId: string) {
  const session = await getSession(); if (!session) return
  return supabase.from('follows').delete().match({ follower_id: session.user.id, following_id: targetId })
}
export async function isFollowing(targetId: string): Promise<boolean> {
  const session = await getSession(); if (!session) return false
  const { data } = await supabase
    .from('follows')
    .select('follower_id')
    .match({ follower_id: session.user.id, following_id: targetId })
    .maybeSingle()
  return !!data
}

// ============================================================
// POSTS
// ============================================================
export interface PostWithAuthor extends DbPost {
  author: DbProfile
  is_liked?: boolean
}

export async function getFeed(limit = 30): Promise<PostWithAuthor[]> {
  const session = await getSession()
  const { data: posts } = await supabase
    .from('posts')
    .select('*, author:profiles!posts_user_id_fkey(*)')
    .order('created_at', { ascending: false })
    .limit(limit)

  const rows = (posts ?? []) as unknown as PostWithAuthor[]

  if (session && rows.length) {
    const { data: likes } = await supabase
      .from('post_likes')
      .select('post_id')
      .eq('user_id', session.user.id)
      .in('post_id', rows.map(p => p.id))
    const likedSet = new Set((likes ?? []).map(l => l.post_id))
    rows.forEach(p => { p.is_liked = likedSet.has(p.id) })
  }
  return rows
}

export async function getPostsByUser(userId: string, limit = 30): Promise<PostWithAuthor[]> {
  const { data } = await supabase
    .from('posts')
    .select('*, author:profiles!posts_user_id_fkey(*)')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit)
  return ((data ?? []) as unknown) as PostWithAuthor[]
}

export async function createPost(opts: {
  content: string
  privacy?: Privacy
  mediaUrls?: string[]
  audioUrl?: string | null
  mood?: string
  location?: string
  hashtags?: string[]
}) {
  const session = await getSession(); if (!session) return { error: new Error('not logged in') }
  return supabase.from('posts').insert({
    user_id:    session.user.id,
    content:    opts.content,
    privacy:    opts.privacy ?? 'public',
    media_urls: opts.mediaUrls ?? [],
    audio_url:  opts.audioUrl ?? null,
    mood:       opts.mood ?? '',
    location:   opts.location ?? '',
    hashtags:   opts.hashtags ?? [],
  }).select().single()
}

export async function deletePost(id: string) {
  return supabase.from('posts').delete().eq('id', id)
}

export async function togglePostLike(postId: string, liked: boolean) {
  const session = await getSession(); if (!session) return
  if (liked) {
    return supabase.from('post_likes').delete().match({ user_id: session.user.id, post_id: postId })
  }
  return supabase.from('post_likes').insert({ user_id: session.user.id, post_id: postId })
}

// ============================================================
// COMMENTS
// ============================================================
export interface CommentWithAuthor extends DbComment {
  author: DbProfile
}

export async function getCommentsForPost(postId: string): Promise<CommentWithAuthor[]> {
  const { data } = await supabase
    .from('comments')
    .select('*, author:profiles!comments_user_id_fkey(*)')
    .eq('post_id', postId)
    .order('created_at', { ascending: true })
  return ((data ?? []) as unknown) as CommentWithAuthor[]
}

export async function addComment(postId: string, text: string) {
  const session = await getSession(); if (!session) return
  return supabase.from('comments').insert({ post_id: postId, user_id: session.user.id, text }).select().single()
}

export async function reactToComment(commentId: string, type: 'like' | 'dislike') {
  const session = await getSession(); if (!session) return
  return supabase.from('comment_reactions').upsert({ user_id: session.user.id, comment_id: commentId, type })
}

// ============================================================
// ROOMS
// ============================================================
export interface RoomWithMeta extends DbRoom {
  member_count: number
  stems_count: number
  is_member: boolean
}

export async function getMyRooms(): Promise<DbRoom[]> {
  const session = await getSession(); if (!session) return []
  const { data: memberRows } = await supabase
    .from('room_members')
    .select('room_id, rooms(*)')
    .eq('user_id', session.user.id)
  return ((memberRows ?? []).map(r => (r as unknown as { rooms: DbRoom }).rooms)) as DbRoom[]
}

export async function getActiveRooms(): Promise<DbRoom[]> {
  const { data } = await supabase
    .from('rooms').select('*').eq('is_active', true).order('updated_at', { ascending: false })
  return (data ?? []) as DbRoom[]
}

export async function getRoomById(id: string) {
  const { data } = await supabase.from('rooms').select('*').eq('id', id).single()
  return data as DbRoom | null
}

export async function getRoomMembers(roomId: string) {
  const { data } = await supabase
    .from('room_members')
    .select('*, profile:profiles!room_members_user_id_fkey(*)')
    .eq('room_id', roomId)
  return (data ?? []) as (DbRoomMember & { profile: DbProfile })[]
}

const DEFAULT_STAGE_TASKS: string[][] = [
  ['הגדרת ז\'אנר וויב', 'איסוף רפרנסים', 'הגדרת קהל יעד'],
  ['כתיבת טקסט ראשוני', 'הגדרת מבנה שיר', 'עריכה ואישור'],
  ['מלודיה ראשית', 'הרמוניות ואקורדים', 'קביעת טמפו'],
  ['בניית beat', 'עיצוב סאונד', 'הפקה מלאה'],
  ['הקלטת גיידאנס', 'הקלטה סופית', 'הקלטת כלים'],
  ['מיקס ראשוני', 'תיקונים', 'מאסטרינג'],
  ['העלאה לפלטפורמות', 'ארטוורק', 'שיווק ופרסום'],
]

export async function createRoom(opts: { name: string; genre?: string; description?: string }) {
  const session = await getSession(); if (!session) return { error: new Error('not logged in') }
  const { data: room, error } = await supabase
    .from('rooms')
    .insert({ name: opts.name, genre: opts.genre ?? 'כללי', description: opts.description ?? '', created_by: session.user.id })
    .select().single()
  if (error || !room) return { error }
  await supabase.from('room_members').insert({ room_id: room.id, user_id: session.user.id, role: 'מפיק', split: 100, is_admin: true })
  // Create default tasks for all stages
  const tasks = DEFAULT_STAGE_TASKS.flatMap((stageTasks, stage) =>
    stageTasks.map((title, i) => ({ room_id: room.id, title, stage, sort_order: i, done: false }))
  )
  await supabase.from('room_tasks').insert(tasks)
  return { data: room as DbRoom, error: null }
}

export async function joinRoom(roomId: string, role = 'אמן', split = 0) {
  const session = await getSession(); if (!session) return { error: new Error('not logged in') }
  const { error } = await supabase.from('room_members')
    .upsert({ room_id: roomId, user_id: session.user.id, role, split }, { onConflict: 'room_id,user_id' })
  return { error }
}

export async function leaveRoom(roomId: string) {
  const session = await getSession(); if (!session) return
  await supabase.from('room_members').delete().match({ room_id: roomId, user_id: session.user.id })
}

export async function updateRoomMember(roomId: string, userId: string, patch: { role?: string; split?: number }) {
  return supabase.from('room_members').update(patch).match({ room_id: roomId, user_id: userId })
}

export async function deleteRoomStem(stemId: string) {
  return supabase.from('room_stems').delete().eq('id', stemId)
}

export async function addRoomTask(roomId: string, title: string, stage: number) {
  return supabase.from('room_tasks').insert({ room_id: roomId, title, stage, done: false })
}

export async function addRoomMember(roomId: string, userId: string, role: string, split: number) {
  return supabase.from('room_members').insert({ room_id: roomId, user_id: userId, role, split })
}

export async function getRoomMessages(roomId: string, limit = 100): Promise<(DbRoomMessage & { author: DbProfile })[]> {
  const { data } = await supabase
    .from('room_messages')
    .select('*, author:profiles!room_messages_user_id_fkey(*)')
    .eq('room_id', roomId)
    .order('created_at', { ascending: true })
    .limit(limit)
  return ((data ?? []) as unknown) as (DbRoomMessage & { author: DbProfile })[]
}

export async function sendRoomMessage(roomId: string, text: string) {
  const session = await getSession(); if (!session) return
  return supabase.from('room_messages').insert({ room_id: roomId, user_id: session.user.id, text })
}

export async function getRoomStems(roomId: string): Promise<DbRoomStem[]> {
  const { data } = await supabase.from('room_stems').select('*').eq('room_id', roomId).order('created_at')
  return (data ?? []) as DbRoomStem[]
}

export async function addRoomStem(roomId: string, name: string, audioUrl: string, fileSize = '—') {
  const session = await getSession(); if (!session) return
  return supabase.from('room_stems').insert({ room_id: roomId, name, audio_url: audioUrl, file_size: fileSize, uploaded_by: session.user.id })
}

export async function getRoomTasks(roomId: string): Promise<DbRoomTask[]> {
  const { data } = await supabase.from('room_tasks').select('*').eq('room_id', roomId).order('created_at')
  return (data ?? []) as DbRoomTask[]
}

export async function toggleRoomTask(taskId: string, done: boolean) {
  return supabase.from('room_tasks').update({ done }).eq('id', taskId)
}

export async function advanceRoomStage(roomId: string, currentStage: number) {
  if (currentStage >= 6) return
  return supabase.from('rooms').update({ current_stage: currentStage + 1 }).eq('id', roomId)
}

export async function signRoomSplit(roomId: string, userId: string) {
  return supabase.from('room_members').update({ has_signed: true }).match({ room_id: roomId, user_id: userId })
}

// ============================================================
// DIRECT MESSAGES
// ============================================================
export async function getDmThread(otherUserId: string): Promise<DbDirectMessage[]> {
  const session = await getSession(); if (!session) return []
  const me = session.user.id
  const { data } = await supabase
    .from('direct_messages')
    .select('*')
    .or(`and(from_user_id.eq.${me},to_user_id.eq.${otherUserId}),and(from_user_id.eq.${otherUserId},to_user_id.eq.${me})`)
    .order('created_at', { ascending: true })
  return (data ?? []) as DbDirectMessage[]
}

export async function sendDm(toUserId: string, text: string) {
  const session = await getSession(); if (!session) return
  return supabase.from('direct_messages').insert({ from_user_id: session.user.id, to_user_id: toUserId, text })
}

export async function markDmsRead(fromUserId: string) {
  const session = await getSession(); if (!session) return
  return supabase.from('direct_messages')
    .update({ read: true })
    .match({ from_user_id: fromUserId, to_user_id: session.user.id, read: false })
}

// ============================================================
// NOTIFICATIONS
// ============================================================
export interface NotificationWithFrom extends DbNotification {
  from_user: DbProfile | null
}

export async function getMyNotifications(): Promise<NotificationWithFrom[]> {
  const session = await getSession(); if (!session) return []
  const { data } = await supabase
    .from('notifications')
    .select('*, from_user:profiles!notifications_from_user_id_fkey(*)')
    .eq('user_id', session.user.id)
    .order('created_at', { ascending: false })
    .limit(50)
  return ((data ?? []) as unknown) as NotificationWithFrom[]
}

export async function markAllNotificationsRead() {
  const session = await getSession(); if (!session) return
  return supabase.from('notifications').update({ read: true }).eq('user_id', session.user.id).eq('read', false)
}

export async function markNotificationRead(notifId: string) {
  return supabase.from('notifications').update({ read: true }).eq('id', notifId)
}

export async function inviteToRoom(roomId: string, userId: string) {
  const session = await getSession()
  if (!session) return { error: new Error('not logged in') }
  const { data: existing } = await supabase
    .from('room_members').select('user_id').match({ room_id: roomId, user_id: userId }).single()
  if (existing) return { error: new Error('already member') }
  const { error } = await supabase.from('notifications').insert({
    user_id: userId,
    from_user_id: session.user.id,
    type: 'room_invite',
    room_id: roomId,
    message: 'הזמינך לחדר',
  })
  return { error }
}

export async function acceptRoomInvite(notifId: string, roomId: string) {
  await joinRoom(roomId)
  return supabase.from('notifications').update({ read: true }).eq('id', notifId)
}

export async function declineRoomInvite(notifId: string) {
  return supabase.from('notifications').update({ read: true }).eq('id', notifId)
}

export async function promoteToAdmin(roomId: string, userId: string) {
  await supabase.from('room_members').update({ is_admin: true }).match({ room_id: roomId, user_id: userId })
  const session = await getSession()
  if (!session) return
  const { data: room } = await supabase.from('rooms').select('name').eq('id', roomId).single()
  await supabase.from('notifications').insert({
    user_id: userId,
    from_user_id: session.user.id,
    type: 'room_admin',
    room_id: roomId,
    message: `הפכת למנהל בחדר "${room?.name ?? ''}"`,
  })
}

export async function revokeAdmin(roomId: string, userId: string) {
  await supabase.from('room_members').update({ is_admin: false }).match({ room_id: roomId, user_id: userId })
  const session = await getSession()
  if (!session) return
  const { data: room } = await supabase.from('rooms').select('name').eq('id', roomId).single()
  await supabase.from('notifications').insert({
    user_id: userId,
    from_user_id: session.user.id,
    type: 'room_admin',
    room_id: roomId,
    message: `הוסרת מהרשאת מנהל בחדר "${room?.name ?? ''}"`,
  })
}

export async function removeMember(roomId: string, userId: string) {
  return supabase.from('room_members').delete().match({ room_id: roomId, user_id: userId })
}

export async function updateMemberRole(roomId: string, userId: string, role: string) {
  return supabase.from('room_members').update({ role }).match({ room_id: roomId, user_id: userId })
}

// ============================================================
// ADMIN
// ============================================================
export async function adminGetStats() {
  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
  const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0)
  const [users, posts, postsToday, rooms, online, newUsers] = await Promise.all([
    supabase.from('profiles').select('*', { count: 'exact', head: true }),
    supabase.from('posts').select('*', { count: 'exact', head: true }),
    supabase.from('posts').select('*', { count: 'exact', head: true }).gte('created_at', todayStart.toISOString()),
    supabase.from('rooms').select('*', { count: 'exact', head: true }).eq('is_active', true),
    supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('is_online', true),
    supabase.from('profiles').select('*', { count: 'exact', head: true }).gte('created_at', weekAgo),
  ])
  return {
    totalUsers: users.count ?? 0,
    totalPosts: posts.count ?? 0,
    postsToday: postsToday.count ?? 0,
    activeRooms: rooms.count ?? 0,
    onlineUsers: online.count ?? 0,
    newUsersWeek: newUsers.count ?? 0,
  }
}

export async function adminGetAllPosts(limit = 100): Promise<PostWithAuthor[]> {
  const { data } = await supabase
    .from('posts')
    .select('*, author:profiles!posts_user_id_fkey(*)')
    .order('created_at', { ascending: false })
    .limit(limit)
  return ((data ?? []) as unknown) as PostWithAuthor[]
}

export async function adminUpdateProfile(id: string, patch: Partial<DbProfile>) {
  return supabase.from('profiles').update(patch).eq('id', id)
}

export async function adminDeleteProfile(id: string) {
  return supabase.from('profiles').delete().eq('id', id)
}

export async function adminGetAllRooms() {
  const { data } = await supabase
    .from('rooms')
    .select('*')
    .order('created_at', { ascending: false })
  return (data ?? []) as DbRoom[]
}

export async function adminDeleteRoom(id: string) {
  return supabase.from('rooms').delete().eq('id', id)
}

// ============================================================
// STORIES
// ============================================================
import type { StoryWithAuthor } from './supabase-types'

export async function getActiveStories(): Promise<StoryWithAuthor[]> {
  const session = await getSession()
  const myId = session?.user.id ?? null

  const { data } = await supabase
    .from('stories')
    .select('*, author:profiles!stories_user_id_fkey(*)')
    .gt('expires_at', new Date().toISOString())
    .order('created_at', { ascending: false })

  if (!data) return []

  // For each story check if viewed by me
  const storyIds = data.map((s: Record<string, unknown>) => s.id as string)
  let viewedIds = new Set<string>()
  if (myId && storyIds.length) {
    const { data: views } = await supabase
      .from('story_views')
      .select('story_id')
      .eq('viewer_id', myId)
      .in('story_id', storyIds)
    viewedIds = new Set((views ?? []).map((v: Record<string, unknown>) => v.story_id as string))
  }

  // Count views per story
  const { data: counts } = await supabase
    .from('story_views')
    .select('story_id')
    .in('story_id', storyIds)
  const countMap: Record<string, number> = {}
  ;(counts ?? []).forEach((v: Record<string, unknown>) => {
    const sid = v.story_id as string
    countMap[sid] = (countMap[sid] ?? 0) + 1
  })

  return data.map((s: Record<string, unknown>) => ({
    ...(s as unknown as StoryWithAuthor),
    view_count: countMap[s.id as string] ?? 0,
    viewed_by_me: viewedIds.has(s.id as string),
  }))
}

export async function createStory(mediaUrl: string, textOverlay?: string): Promise<StoryWithAuthor | null> {
  const session = await getSession()
  if (!session) return null
  const { data } = await supabase
    .from('stories')
    .insert({ user_id: session.user.id, media_url: mediaUrl, text_overlay: textOverlay ?? null })
    .select('*, author:profiles!stories_user_id_fkey(*)')
    .single()
  if (!data) return null
  return { ...(data as unknown as StoryWithAuthor), view_count: 0, viewed_by_me: false }
}

export async function markStoryViewed(storyId: string): Promise<void> {
  const session = await getSession()
  if (!session) return
  await supabase
    .from('story_views')
    .upsert({ story_id: storyId, viewer_id: session.user.id }, { onConflict: 'story_id,viewer_id' })
}

export async function deleteStory(id: string): Promise<void> {
  await supabase.from('stories').delete().eq('id', id)
}

// ============================================================
// DM CONVERSATIONS
// ============================================================
export interface Conversation {
  userId: string
  lastMessage: string
  lastAt: string
  unreadCount: number
}

export async function getConversations(): Promise<Conversation[]> {
  const session = await getSession()
  if (!session) return []
  const me = session.user.id
  const { data } = await supabase
    .from('direct_messages')
    .select('*')
    .or(`from_user_id.eq.${me},to_user_id.eq.${me}`)
    .order('created_at', { ascending: false })
  if (!data) return []
  const seen = new Set<string>()
  const convos: Conversation[] = []
  for (const msg of data) {
    const otherId = msg.from_user_id === me ? msg.to_user_id : msg.from_user_id
    if (seen.has(otherId)) continue
    seen.add(otherId)
    const unreadCount = data.filter(
      (m: typeof msg) => m.from_user_id === otherId && m.to_user_id === me && !m.read
    ).length
    convos.push({ userId: otherId, lastMessage: msg.text, lastAt: msg.created_at, unreadCount })
  }
  return convos
}

// ============================================================
// STORAGE
// ============================================================
export async function uploadFile(file: File, bucket: 'post-media' | 'avatars'): Promise<string | null> {
  const session = await getSession()
  if (!session) return null
  const ext = file.name.split('.').pop() ?? 'bin'
  const path = `${session.user.id}/${Date.now()}.${ext}`
  const { error } = await supabase.storage.from(bucket).upload(path, file, { upsert: true })
  if (error) return null
  const { data } = supabase.storage.from(bucket).getPublicUrl(path)
  return data.publicUrl
}

export async function createNotification(opts: {
  userId:     string
  fromUserId?: string
  type:       NotificationType
  postId?:    string
  roomId?:    string
  message?:   string
}) {
  return supabase.from('notifications').insert({
    user_id:      opts.userId,
    from_user_id: opts.fromUserId ?? null,
    type:         opts.type,
    post_id:      opts.postId ?? null,
    room_id:      opts.roomId ?? null,
    message:      opts.message ?? '',
  })
}
