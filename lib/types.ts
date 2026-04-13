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
