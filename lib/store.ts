'use client'
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { User, FeedPost, Room } from './types'
import { USERS, FEED_POSTS, ROOMS } from './data'

interface AppState {
  // Hydration
  _hasHydrated: boolean
  _setHasHydrated: () => void

  // Auth
  currentUser: User | null
  login: (userId: string) => void
  logout: () => void

  // Users (mutable copy for admin actions)
  users: User[]
  deleteUser: (id: string) => void
  warnUser: (id: string) => void
  suspendUser: (id: string) => void
  unsuspendUser: (id: string) => void
  verifyUser: (id: string) => void

  // Feed
  posts: FeedPost[]
  likePost: (id: string) => void
  addComment: (postId: string, text: string) => void
  likeComment: (postId: string, commentId: string) => void
  dislikeComment: (postId: string, commentId: string) => void
  addPost: (post: FeedPost) => void
  deletePost: (id: string) => void

  // Rooms
  rooms: Room[]
  addRoom: (name: string, genre: string, description: string) => string
  updateTaskDone: (roomId: string, taskId: string, done: boolean) => void
  addStem: (roomId: string, name: string, audioUrl: string) => void
  advanceStage: (roomId: string) => void
  signSplit: (roomId: string, userId: string) => void
  addChatMessage: (roomId: string, text: string) => void

  // Theme
  theme: 'dark' | 'light'
  setTheme: (t: 'dark' | 'light') => void

  // Toast
  toast: { message: string; type: 'success' | 'error' | 'info' } | null
  showToast: (message: string, type?: 'success' | 'error' | 'info') => void
  clearToast: () => void

  // Admin logs
  adminLogs: { id: string; action: string; targetUser?: string; createdAt: string }[]
  addAdminLog: (action: string, targetUser?: string) => void
}

export const useStore = create<AppState>()(
  persist(
    (set, get) => ({
      _hasHydrated: false,
      _setHasHydrated: () => set({ _hasHydrated: true }),

      currentUser: null,
      users: USERS,
      posts: FEED_POSTS,
      rooms: ROOMS,
      theme: 'light',
      toast: null,
      adminLogs: [
        { id: 'al1', action: 'משתמש חדש נרשם — גיל אבן', targetUser: 'u12', createdAt: '2026-04-14 09:15' },
        { id: 'al2', action: 'אזהרה נשלחה — נועם פלד', targetUser: 'u6', createdAt: '2026-04-13 14:30' },
        { id: 'al3', action: 'אזהרה נשלחה — גיל אבן', targetUser: 'u12', createdAt: '2026-04-12 11:00' },
        { id: 'al4', action: 'פרופיל אומת — עומר מור', targetUser: 'u8', createdAt: '2026-04-11 16:45' },
      ],

      login: (userId) => {
        const user = get().users.find(u => u.id === userId)
        if (user) set({ currentUser: user })
      },

      logout: () => set({ currentUser: null }),

      deleteUser: (id) => {
        set(s => ({ users: s.users.filter(u => u.id !== id) }))
        get().addAdminLog(`משתמש נמחק`, id)
        get().showToast('המשתמש נמחק בהצלחה', 'success')
      },

      warnUser: (id) => {
        set(s => ({
          users: s.users.map(u => u.id === id ? { ...u, warnings: u.warnings + 1 } : u)
        }))
        get().addAdminLog(`אזהרה נשלחה`, id)
        get().showToast('אזהרה נשלחה למשתמש', 'info')
      },

      suspendUser: (id) => {
        set(s => ({
          users: s.users.map(u => u.id === id ? { ...u, isSuspended: true } : u)
        }))
        get().addAdminLog(`חשבון הושעה`, id)
        get().showToast('החשבון הושעה', 'error')
      },

      unsuspendUser: (id) => {
        set(s => ({
          users: s.users.map(u => u.id === id ? { ...u, isSuspended: false } : u)
        }))
        get().addAdminLog(`השעיה בוטלה`, id)
        get().showToast('החשבון שוחרר', 'success')
      },

      verifyUser: (id) => {
        set(s => ({
          users: s.users.map(u => u.id === id ? { ...u, isVerified: true } : u)
        }))
        get().addAdminLog(`פרופיל אומת`, id)
        get().showToast('הפרופיל אומת', 'success')
      },

      likePost: (id) => {
        set(s => ({
          posts: s.posts.map(p =>
            p.id === id ? { ...p, isLiked: !p.isLiked, likes: p.isLiked ? p.likes - 1 : p.likes + 1 } : p
          )
        }))
      },

      addComment: (postId, text) => {
        const user = get().currentUser || get().users[0]
        if (!user) return
        const comment = { id: Date.now().toString(), userId: user.id, text, createdAt: 'עכשיו', likes: 0, dislikes: 0 }
        set(s => ({
          posts: s.posts.map(p => p.id === postId ? { ...p, comments: [...(p.comments || []), comment] } : p)
        }))
        get().showToast('תגובה נוספה', 'success')
      },

      likeComment: (postId, commentId) => {
        set(s => ({
          posts: s.posts.map(p => p.id === postId ? {
            ...p,
            comments: (p.comments || []).map(c => c.id === commentId ? { ...c, likes: (c.likes || 0) + 1 } : c)
          } : p)
        }))
      },

      dislikeComment: (postId, commentId) => {
        set(s => ({
          posts: s.posts.map(p => p.id === postId ? {
            ...p,
            comments: (p.comments || []).map(c => c.id === commentId ? { ...c, dislikes: (c.dislikes || 0) + 1 } : c)
          } : p)
        }))
      },

      addPost: (post) => set(s => ({ posts: [post, ...s.posts] })),

      deletePost: (id) => {
        set(s => ({ posts: s.posts.filter(p => p.id !== id) }))
        get().addAdminLog(`פוסט נמחק`, id)
        get().showToast('הפוסט נמחק', 'success')
      },

      addRoom: (name, genre, description) => {
        const user = get().currentUser || get().users[0]
        const now = new Date().toLocaleDateString('he-IL')
        const room: Room = {
          id: `room-${Date.now()}`,
          name,
          description: description || '',
          currentStage: 0,
          genre: genre || 'כללי',
          isActive: true,
          createdAt: now,
          updatedAt: now,
          members: [{ userId: user.id, role: 'מפיק', split: 100, joinedAt: now, hasSigned: false }],
          stems: [],
          activity: [{ id: `ac-${Date.now()}`, userId: user.id, action: 'יצר את החדר', time: 'עכשיו', type: 'join' }],
          tasks: [],
          chatMessages: [],
        }
        set(s => ({ rooms: [room, ...s.rooms] }))
        get().showToast(`חדר "${name}" נוצר!`, 'success')
        return room.id
      },

      updateTaskDone: (roomId, taskId, done) => {
        set(s => ({
          rooms: s.rooms.map(r =>
            r.id === roomId
              ? { ...r, tasks: r.tasks.map(t => t.id === taskId ? { ...t, done } : t) }
              : r
          )
        }))
      },

      addStem: (roomId, name, audioUrl) => {
        const user = get().currentUser
        const stem = {
          id: Date.now().toString(),
          name,
          size: '—',
          uploadedBy: user?.id || 'u1',
          uploadedAt: 'עכשיו',
          audioUrl,
        }
        set(s => ({
          rooms: s.rooms.map(r => r.id === roomId ? { ...r, stems: [...r.stems, stem] } : r)
        }))
        get().showToast('הקובץ הועלה בהצלחה', 'success')
      },

      advanceStage: (roomId) => {
        set(s => ({
          rooms: s.rooms.map(r =>
            r.id === roomId && r.currentStage < 6 ? { ...r, currentStage: r.currentStage + 1 } : r
          )
        }))
        get().showToast('עברת לשלב הבא!', 'success')
      },

      addChatMessage: (roomId, text) => {
        const user = get().currentUser || get().users[0]
        if (!user || !text.trim()) return
        const msg = { id: `cm-${Date.now()}`, userId: user.id, text, createdAt: 'עכשיו' }
        set(s => ({
          rooms: s.rooms.map(r =>
            r.id === roomId ? { ...r, chatMessages: [...(r.chatMessages ?? []), msg] } : r
          )
        }))
      },

      signSplit: (roomId, userId) => {
        set(s => ({
          rooms: s.rooms.map(r =>
            r.id === roomId
              ? { ...r, members: r.members.map(m => m.userId === userId ? { ...m, hasSigned: true } : m) }
              : r
          )
        }))
        get().showToast('חתמת על ההסכם!', 'success')
      },

      setTheme: (t) => set({ theme: t }),

      showToast: (message, type = 'info') => {
        set({ toast: { message, type } })
        setTimeout(() => set({ toast: null }), 3500)
      },

      clearToast: () => set({ toast: null }),

      addAdminLog: (action, targetUser) => {
        const log = { id: Date.now().toString(), action, targetUser, createdAt: new Date().toLocaleString('he-IL') }
        set(s => ({ adminLogs: [log, ...s.adminLogs] }))
      },
    }),
    {
      name: 'flowroom-store',
      partialize: (s) => ({ currentUser: s.currentUser, users: s.users, posts: s.posts, rooms: s.rooms, adminLogs: s.adminLogs, theme: s.theme }),
      onRehydrateStorage: () => (state) => { state?._setHasHydrated() },
    }
  )
)
