'use client'
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type {
  User, FeedPost, Room,
  SplitSheet, SplitCategory, SplitParticipant, SplitRole,
  Registration, RegistrationBody, RegistrationStatus,
  EarningsBatch, EarningsLine, EarningsSource, Currency, PayoutStatus,
} from './types'
import { USERS, FEED_POSTS, ROOMS } from './data'

interface AppState {
  // Hydration
  _hasHydrated: boolean
  _setHasHydrated: () => void

  // Auth — populated either from Supabase session or mock login
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
  updatePost: (id: string, content: string) => void
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

  // Rights & Royalties — split sheets
  splitSheets: SplitSheet[]
  createSplitSheet: (roomId: string, trackTitle: string) => string
  updateSplitShares: (sheetId: string, category: SplitCategory, participants: SplitParticipant[]) => void
  updateSplitMeta: (sheetId: string, meta: { trackTitle?: string; isrc?: string; iswc?: string }) => void
  signSplitSheet: (sheetId: string, userId: string) => void
  lockSplitSheet: (sheetId: string) => void
  getSplitSheetForRoom: (roomId: string) => SplitSheet | undefined
  markRegistrationSubmitted: (sheetId: string, body: RegistrationBody, notes?: string) => void
  markRegistrationRegistered: (sheetId: string, body: RegistrationBody, reference: string) => void
  resetRegistration: (sheetId: string, body: RegistrationBody) => void

  // Earnings Inbox
  earningsBatches: EarningsBatch[]
  earningsLines: EarningsLine[]
  importEarnings: (source: EarningsSource, filename: string) => string
  deleteEarningsBatch: (batchId: string) => void
  markEarningsReceived: (lineId: string) => void
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
      splitSheets: [],
      earningsBatches: [],
      earningsLines: [],

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

      updatePost: (id, content) => {
        set(s => ({ posts: s.posts.map(p => p.id === id ? { ...p, content } : p) }))
        get().showToast('הפוסט עודכן', 'success')
      },

      deletePost: (id) => {
        set(s => ({ posts: s.posts.filter(p => p.id !== id) }))
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

      createSplitSheet: (roomId, trackTitle) => {
        const room = get().rooms.find(r => r.id === roomId)
        const creator = get().currentUser || get().users[0]
        if (!room || !creator) return ''

        const evenShare = room.members.length > 0 ? Math.floor(100 / room.members.length) : 0
        const remainder = 100 - evenShare * room.members.length

        const toParticipants = (defaultRole: SplitRole): SplitParticipant[] =>
          room.members.map((m, i) => ({
            userId: m.userId,
            sharePct: evenShare + (i === 0 ? remainder : 0),
            role: defaultRole,
            hasSigned: false,
          }))

        const defaultRegistrations: Registration[] = [
          { body: 'acum', status: 'not_registered' },
          { body: 'pil', status: 'not_registered' },
          { body: 'eshkolot', status: 'not_registered' },
          { body: 'distributor', status: 'not_registered' },
          { body: 'youtube-cid', status: 'not_registered' },
        ]

        const sheet: SplitSheet = {
          id: `ss-${Date.now()}`,
          roomId,
          trackTitle,
          publishing: toParticipants('composition'),
          master: toParticipants('performer'),
          producer: [
            {
              userId: room.members[0]?.userId || creator.id,
              sharePct: 100,
              role: 'producer',
              hasSigned: false,
            },
          ],
          status: 'draft',
          version: 1,
          createdBy: creator.id,
          createdAt: new Date().toLocaleString('he-IL'),
          registrations: defaultRegistrations,
        }
        set(s => ({ splitSheets: [sheet, ...s.splitSheets] }))
        get().showToast(`Split Sheet נוצר ל־"${trackTitle}"`, 'success')
        return sheet.id
      },

      updateSplitShares: (sheetId, category, participants) => {
        const clamped = participants.map(p => ({
          ...p,
          sharePct: Math.max(0, Math.min(100, Math.round(p.sharePct))),
        }))
        set(s => ({
          splitSheets: s.splitSheets.map(sh => {
            if (sh.id !== sheetId) return sh
            // Any change invalidates existing signatures in that category.
            const resigned = clamped.map(p => {
              const prev = sh[category].find(x => x.userId === p.userId)
              const shareChanged = !prev || prev.sharePct !== p.sharePct || prev.role !== p.role
              return shareChanged ? { ...p, hasSigned: false, signedAt: undefined } : p
            })
            return { ...sh, [category]: resigned, status: 'pending_signatures' as const, version: sh.version + 1 }
          }),
        }))
      },

      updateSplitMeta: (sheetId, meta) => {
        set(s => ({
          splitSheets: s.splitSheets.map(sh => sh.id === sheetId ? { ...sh, ...meta } : sh),
        }))
      },

      signSplitSheet: (sheetId, userId) => {
        const now = new Date().toLocaleString('he-IL')
        set(s => ({
          splitSheets: s.splitSheets.map(sh => {
            if (sh.id !== sheetId) return sh
            const sign = (arr: SplitParticipant[]) =>
              arr.map(p => p.userId === userId ? { ...p, hasSigned: true, signedAt: now } : p)
            const next: SplitSheet = {
              ...sh,
              publishing: sign(sh.publishing),
              master: sign(sh.master),
              producer: sign(sh.producer),
            }
            const allSigned = [...next.publishing, ...next.master, ...next.producer].every(p => p.hasSigned)
            if (allSigned) {
              next.status = 'locked'
              next.lockedAt = now
            } else {
              next.status = 'pending_signatures'
            }
            return next
          }),
        }))
        get().showToast('חתמת על Split Sheet', 'success')
      },

      lockSplitSheet: (sheetId) => {
        const now = new Date().toLocaleString('he-IL')
        set(s => ({
          splitSheets: s.splitSheets.map(sh => sh.id === sheetId ? { ...sh, status: 'locked', lockedAt: now } : sh),
        }))
      },

      getSplitSheetForRoom: (roomId) => {
        return get().splitSheets.find(sh => sh.roomId === roomId)
      },

      markRegistrationSubmitted: (sheetId, body, notes) => {
        const now = new Date().toLocaleString('he-IL')
        set(s => ({
          splitSheets: s.splitSheets.map(sh => {
            if (sh.id !== sheetId) return sh
            const regs = (sh.registrations ?? []).map(r =>
              r.body === body ? { ...r, status: 'pending' as RegistrationStatus, submittedAt: now, notes } : r,
            )
            return { ...sh, registrations: regs }
          }),
        }))
        get().showToast('סומן כהוגש — נעדכן כשהרישום יאושר', 'info')
      },

      markRegistrationRegistered: (sheetId, body, reference) => {
        const now = new Date().toLocaleString('he-IL')
        set(s => ({
          splitSheets: s.splitSheets.map(sh => {
            if (sh.id !== sheetId) return sh
            const regs = (sh.registrations ?? []).map(r =>
              r.body === body ? { ...r, status: 'registered' as RegistrationStatus, registeredAt: now, reference } : r,
            )
            return { ...sh, registrations: regs }
          }),
        }))
        get().showToast('הרישום אושר!', 'success')
      },

      resetRegistration: (sheetId, body) => {
        set(s => ({
          splitSheets: s.splitSheets.map(sh => {
            if (sh.id !== sheetId) return sh
            const regs = (sh.registrations ?? []).map(r =>
              r.body === body ? { body, status: 'not_registered' as RegistrationStatus } : r,
            )
            return { ...sh, registrations: regs }
          }),
        }))
      },

      importEarnings: (source, filename) => {
        const user = get().currentUser || get().users[0]
        const sheets = get().splitSheets
        const batchId = `eb-${Date.now()}`
        const now = new Date()
        const monthStr = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`

        const rand = (min: number, max: number) => Math.round((Math.random() * (max - min) + min) * 100) / 100
        const randInt = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min
        const pick = <T,>(arr: T[]): T => arr[randInt(0, arr.length - 1)]

        const lines: EarningsLine[] = []
        let currency: Currency = 'ILS'
        let platforms: string[] = []
        let territories = ['IL']

        switch (source) {
          case 'acum':
            currency = 'ILS'
            platforms = ['גלגלצ', 'רשת ג', '88FM', 'קול ישראל', 'רדיוס', 'שידור ציבורי', 'הופעה חיה']
            territories = ['IL']
            break
          case 'pil':
            currency = 'ILS'
            platforms = ['רדיו מסחרי', 'אירועים', 'פלייליסט ציבורי', 'טלוויזיה']
            territories = ['IL']
            break
          case 'eshkolot':
            currency = 'ILS'
            platforms = ['זכויות שכנות', 'ביצוע פומבי']
            territories = ['IL']
            break
          case 'distributor':
            currency = 'USD'
            platforms = ['Spotify', 'Apple Music', 'YouTube Music', 'Tidal', 'Amazon Music', 'TikTok']
            territories = ['US', 'IL', 'DE', 'UK', 'FR', 'BR']
            break
          case 'youtube-cid':
            currency = 'USD'
            platforms = ['YouTube UGC', 'YouTube Shorts']
            territories = ['US', 'IL', 'DE', 'UK']
            break
          case 'other':
          default:
            currency = 'ILS'
            platforms = ['מקור לא ידוע']
            territories = ['IL']
        }

        // If user has locked sheets, distribute earnings across them. Otherwise generate a generic "לא משויך" line.
        const targets = sheets.length > 0
          ? sheets
          : [{ id: '', trackTitle: 'טראק ללא Split Sheet', isrc: undefined, iswc: undefined } as Partial<SplitSheet>]

        targets.forEach(sheet => {
          const lineCount = source === 'distributor' ? randInt(2, 5) : randInt(1, 3)
          for (let i = 0; i < lineCount; i++) {
            const amount = currency === 'USD' ? rand(0.8, 45) : rand(40, 620)
            lines.push({
              id: `el-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
              batchId,
              source,
              sheetId: sheet.id || undefined,
              trackTitle: sheet.trackTitle || 'ללא שם',
              isrc: sheet.isrc,
              iswc: sheet.iswc,
              period: monthStr(new Date(now.getFullYear(), now.getMonth() - randInt(0, 3), 1)),
              platform: pick(platforms),
              territory: pick(territories),
              units: source === 'distributor' || source === 'youtube-cid' ? randInt(200, 150000) : undefined,
              amount,
              currency,
              payoutStatus: Math.random() > 0.35 ? 'received' : 'pending' as PayoutStatus,
            })
          }
        })

        const totalAmount = Math.round(lines.reduce((sum, l) => sum + l.amount, 0) * 100) / 100
        const matchedCount = lines.filter(l => l.sheetId).length

        const batch: EarningsBatch = {
          id: batchId,
          source,
          filename,
          uploadedAt: now.toLocaleString('he-IL'),
          uploadedBy: user.id,
          period: monthStr(now),
          totalAmount,
          currency,
          lineCount: lines.length,
          matchedCount,
        }

        set(s => ({
          earningsBatches: [batch, ...s.earningsBatches],
          earningsLines: [...lines, ...s.earningsLines],
        }))
        get().showToast(`יובאו ${lines.length} שורות מתוך "${filename}"`, 'success')
        return batchId
      },

      deleteEarningsBatch: (batchId) => {
        set(s => ({
          earningsBatches: s.earningsBatches.filter(b => b.id !== batchId),
          earningsLines: s.earningsLines.filter(l => l.batchId !== batchId),
        }))
        get().showToast('הדוח הוסר', 'info')
      },

      markEarningsReceived: (lineId) => {
        set(s => ({
          earningsLines: s.earningsLines.map(l =>
            l.id === lineId ? { ...l, payoutStatus: 'received' as PayoutStatus } : l
          ),
        }))
      },
    }),
    {
      name: 'flowroom-store',
      partialize: (s) => ({ currentUser: s.currentUser, users: s.users, posts: s.posts, rooms: s.rooms, adminLogs: s.adminLogs, theme: s.theme, splitSheets: s.splitSheets, earningsBatches: s.earningsBatches, earningsLines: s.earningsLines }),
      onRehydrateStorage: () => (state) => { state?._setHasHydrated() },
    }
  )
)
