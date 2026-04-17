export type Role = 'מפיק' | 'זמר/ת' | 'כותב/ת' | 'נגן/ת' | 'מיקס' | 'עורך וידאו' | 'שיווק'

export interface User {
  id: string
  name: string
  email: string
  role: Role
  bio: string
  location: string
  avatarColor: string
  initials: string
  genres: string[]
  trustScore: number
  songs: number
  collabs: number
  followers: number
  rating: number
  completionRate: number
  portfolio: PortfolioItem[]
  media?: MediaItem[]
  isOnline: boolean
  joinedAt: string
  warnings: number
  isSuspended: boolean
  isVerified: boolean
}

export type MediaType = 'image' | 'video' | 'reel'

export interface MediaItem {
  id: string
  type: MediaType
  url: string
  thumbnail: string
  title: string
  caption?: string
  likes: number
  views: number
  createdAt: string
}

export interface PortfolioItem {
  id: string
  title: string
  genre: string
  bpm: number
  key: string
  plays: number
  duration: string
  audioUrl: string
  createdAt: string
}

export interface ChatMessage {
  id: string
  userId: string
  text: string
  createdAt: string
}

export interface Room {
  id: string
  name: string
  description: string
  currentStage: number
  members: RoomMember[]
  createdAt: string
  updatedAt: string
  isActive: boolean
  genre: string
  stems: Stem[]
  activity: ActivityItem[]
  tasks: Task[]
  chatMessages: ChatMessage[]
}

export interface RoomMember {
  userId: string
  role: string
  split: number
  joinedAt: string
  hasSigned: boolean
}

export interface Stem {
  id: string
  name: string
  size: string
  uploadedBy: string
  uploadedAt: string
  audioUrl: string
}

export interface ActivityItem {
  id: string
  userId: string
  action: string
  time: string
  type: 'upload' | 'comment' | 'update' | 'join' | 'sign'
}

export interface Task {
  id: string
  text: string
  done: boolean
  assignedTo: string
  stage: number
}

export interface FeedPost {
  id: string
  userId: string
  content: string
  type: 'audio' | 'text' | 'collab'
  audioUrl?: string
  audioDuration?: string
  likes: number
  comments: FeedComment[]
  createdAt: string
  isLiked: boolean
  collabRole?: string
}

export interface FeedComment {
  id: string
  userId: string
  text: string
  createdAt: string
  likes?: number
  dislikes?: number
}

export interface Product {
  id: string
  title: string
  sellerId: string
  price: number
  type: 'ביט' | 'מיקס' | 'מילים' | 'קורס' | 'מאסטר' | 'שיווק' | 'פרימיום'
  rating: number
  sales: number
  audioUrl?: string
  description: string
  isPremium: boolean
}

export interface AdminLog {
  id: string
  action: string
  targetUser?: string
  adminId: string
  createdAt: string
}

/* ── Rights & Royalties ─────────────────────────────────────────────────────
   A split sheet covers three independent royalty streams. Each must total
   100% on its own; they are NOT interchangeable.

   - publishing → מחבר/מלחין — collected by אקו"ם (ACUM) in Israel
   - master     → בעל ההקלטה — collected by הפיל (PIL)
   - producer   → נקודות מפיק (producer points) — carved out of master share

   Once every participant across all three categories signs, the sheet is
   locked and becomes the legal source of truth for the track.
*/

export type SplitCategory = 'publishing' | 'master' | 'producer'

export type PublishingRole = 'lyrics' | 'composition' | 'arrangement'
export type MasterRole = 'performer' | 'featured' | 'label' | 'owner'
export type ProducerRole = 'producer' | 'co-producer' | 'engineer'
export type SplitRole = PublishingRole | MasterRole | ProducerRole

export interface SplitParticipant {
  userId: string
  sharePct: number
  role?: SplitRole
  hasSigned: boolean
  signedAt?: string
}

export type SplitSheetStatus = 'draft' | 'pending_signatures' | 'locked'

export interface SplitSheet {
  id: string
  roomId: string
  trackTitle: string
  isrc?: string
  iswc?: string
  publishing: SplitParticipant[]
  master: SplitParticipant[]
  producer: SplitParticipant[]
  status: SplitSheetStatus
  version: number
  createdBy: string
  createdAt: string
  lockedAt?: string
  registrations?: Registration[]
}

/* ── Rights registration ────────────────────────────────────────────────────
   Every split sheet can be registered at up to 5 external bodies. FlowRoom
   doesn't (yet) call external APIs — we track status + pre-fill submission
   forms for the user to paste into each body's portal.
*/

export type RegistrationBody = 'acum' | 'pil' | 'eshkolot' | 'distributor' | 'youtube-cid'
export type RegistrationStatus = 'not_registered' | 'pending' | 'registered' | 'rejected'

export interface Registration {
  body: RegistrationBody
  status: RegistrationStatus
  reference?: string
  submittedAt?: string
  registeredAt?: string
  notes?: string
}

/* ── Earnings Inbox ─────────────────────────────────────────────────────────
   Users upload payout statements from each royalty body. Every line represents
   a single payout row (per-track, per-platform, per-period). Lines group into
   batches that preserve the original upload for audit.
*/

export type EarningsSource = RegistrationBody | 'other'
export type Currency = 'ILS' | 'USD' | 'EUR'
export type PayoutStatus = 'received' | 'pending'

export interface EarningsLine {
  id: string
  batchId: string
  source: EarningsSource
  sheetId?: string
  trackTitle: string
  isrc?: string
  iswc?: string
  period: string
  platform?: string
  territory?: string
  units?: number
  amount: number
  currency: Currency
  payoutStatus: PayoutStatus
}

export interface EarningsBatch {
  id: string
  source: EarningsSource
  filename: string
  uploadedAt: string
  uploadedBy: string
  period: string
  totalAmount: number
  currency: Currency
  lineCount: number
  matchedCount: number
}
