'use client'
import { useState, useRef } from 'react'
import Link from 'next/link'
import { useStore } from '@/lib/store'
import { USERS, getUserById } from '@/lib/data'
import Avatar from '@/components/Avatar'
import AudioPlayer from '@/components/AudioPlayer'
import VerifiedBadge from '@/components/VerifiedBadge'
import ProfileHoverCard from '@/components/ProfileHoverCard'
import {
  Heart, MessageCircle, Share2, Send, Zap, Users as UsersIcon,
  Paperclip, Hash, X, Image, Music, Smile, MapPin, Globe, Lock, Users2,
  ThumbsUp, ThumbsDown, ChevronDown, ChevronUp, AtSign, Plus,
} from 'lucide-react'

// ─── Hashtag pool ────────────────────────────────────────────────────────────
const HASHTAG_POOL = [
  '#פופ', '#R&B', '#היפהופ', '#אלקטרוני', '#מזרחי', '#גאז', '#רוק', '#אינדי',
  '#ביט', '#מיקס', '#מאסטר', '#הפקה', '#שיתוף', '#דמו', '#ביטרקווסט',
  '#כתיבה', '#וקאלים', '#גיטרה', '#פסנתר', '#תופים', '#סטודיו', '#שיר',
]

const KEYWORD_MAP: Record<string, string[]> = {
  'ביט':     ['#ביט', '#הפקה', '#אלקטרוני'],
  'beat':    ['#ביט', '#הפקה'],
  'מיקס':    ['#מיקס', '#מאסטר', '#הפקה'],
  'mix':     ['#מיקס', '#מאסטר'],
  'פופ':     ['#פופ', '#R&B', '#אינדי'],
  'pop':     ['#פופ', '#R&B'],
  'גיטר':    ['#גיטרה', '#רוק'],
  'תופ':     ['#תופים', '#הפקה'],
  'פסנת':    ['#פסנתר'],
  'אלקטר':   ['#אלקטרוני', '#ביט'],
  'R&B':     ['#R&B', '#פופ'],
  'היפ':     ['#היפהופ', '#ביט'],
  'מזרח':    ['#מזרחי', '#שיתוף'],
  'רוק':     ['#רוק', '#גיטרה'],
  'ראפ':     ['#היפהופ', '#כתיבה'],
  'דמו':     ['#דמו', '#הפקה', '#שיתוף'],
  'שיתוף':   ['#שיתוף'],
  'שיר':     ['#שיר', '#הפקה'],
  'הפק':     ['#הפקה', '#ביט', '#מיקס'],
  'סקיצ':    ['#דמו', '#הפקה'],
  'וקאל':    ['#וקאלים', '#שיר'],
  'זמר':     ['#וקאלים', '#שיתוף'],
  'כתב':     ['#כתיבה', '#מילים'],
  'מאסטר':   ['#מאסטר', '#מיקס'],
  'סטודיו':  ['#סטודיו', '#הפקה'],
  'jazz':    ['#גאז'],
  'rock':    ['#רוק'],
}

function getContextHashtags(text: string, filter: string): string[] {
  const lower = text.toLowerCase()
  const suggested = new Set<string>()
  Object.entries(KEYWORD_MAP).forEach(([kw, tags]) => {
    if (lower.includes(kw.toLowerCase())) tags.forEach(t => suggested.add(t))
  })
  const pool = suggested.size > 0 ? [...suggested] : [...HASHTAG_POOL]
  return pool.filter(h => !filter || h.slice(1).toLowerCase().includes(filter.toLowerCase())).slice(0, 14)
}

const MOODS = ['😊 שמח', '🔥 נלהב', '🎵 יצירתי', '💪 מוכן', '🤔 חושב', '😌 רגוע', '🚀 מוטיבציה', '❤️ אסיר תודה']

const PRIVACY_OPTIONS = [
  { value: 'public', label: 'ציבורי', icon: Globe },
  { value: 'friends', label: 'חברים', icon: Users2 },
  { value: 'private', label: 'פרטי', icon: Lock },
]

export default function FeedPage() {
  const { currentUser, posts, likePost, addComment, likeComment, dislikeComment, addPost, showToast } = useStore()
  const user = currentUser || USERS[0]

  // Compose state
  const [newPost, setNewPost] = useState('')
  const [attachedFile, setAttachedFile] = useState<File | null>(null)
  const [showHashtags, setShowHashtags] = useState(false)
  const [hashtagFilter, setHashtagFilter] = useState('')
  const [showMentions, setShowMentions] = useState(false)
  const [mentionFilter, setMentionFilter] = useState('')
  const [mood, setMood] = useState('')
  const [location, setLocation] = useState('')
  const [privacy, setPrivacy] = useState('public')
  const [showMoodPicker, setShowMoodPicker] = useState(false)
  const [showLocationInput, setShowLocationInput] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Mobile compose
  const [mobileComposeOpen, setMobileComposeOpen] = useState(false)

  // Comment state per post
  const [commentTexts, setCommentTexts] = useState<Record<string, string>>({})
  const [expandedComments, setExpandedComments] = useState<Record<string, boolean>>({})

  // Apply modal
  const [applyPostId, setApplyPostId] = useState<string | null>(null)
  const [applyBio, setApplyBio] = useState('')
  const [applyQuestion, setApplyQuestion] = useState('')

  const suggested = USERS.filter(u => u.id !== user.id).slice(0, 4)
  const filteredMentions = USERS.filter(u =>
    !mentionFilter || u.name.includes(mentionFilter)
  ).slice(0, 6)
  const contextHashtags = getContextHashtags(newPost, hashtagFilter)

  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value
    setNewPost(val)
    const words = val.split(/\s+/)
    const last = words[words.length - 1]
    if (last === '#' || (last.startsWith('#') && last.length >= 1)) {
      setHashtagFilter(last.startsWith('#') ? last.slice(1) : '')
      setShowHashtags(true)
      setShowMentions(false)
    } else if (last === '@' || (last.startsWith('@') && last.length >= 1)) {
      setMentionFilter(last.startsWith('@') ? last.slice(1) : '')
      setShowMentions(true)
      setShowHashtags(false)
    } else {
      setShowHashtags(false)
      setShowMentions(false)
    }
  }

  const insertHashtag = (tag: string) => {
    const words = newPost.split(/\s+/)
    words[words.length - 1] = tag
    setNewPost(words.join(' ') + ' ')
    setShowHashtags(false)
    textareaRef.current?.focus()
  }

  const insertMention = (name: string) => {
    const words = newPost.split(/\s+/)
    words[words.length - 1] = `@${name}`
    setNewPost(words.join(' ') + ' ')
    setShowMentions(false)
    textareaRef.current?.focus()
  }

  const submitPost = () => {
    if (!newPost.trim() && !attachedFile) return
    let content = newPost
    if (mood) content += `\n\n${mood}`
    if (location) content += `\n📍 ${location}`
    addPost({
      id: Date.now().toString(),
      userId: user.id,
      content,
      type: 'text',
      likes: 0,
      comments: [],
      createdAt: 'עכשיו',
      isLiked: false,
    })
    setNewPost('')
    setAttachedFile(null)
    setMood('')
    setLocation('')
    setShowMoodPicker(false)
    setShowLocationInput(false)
    setShowHashtags(false)
    setShowMentions(false)
    showToast('הפוסט פורסם! 🎉', 'success')
  }

  const submitComment = (postId: string) => {
    const text = commentTexts[postId] || ''
    if (!text.trim()) return
    addComment(postId, text)
    setCommentTexts(prev => ({ ...prev, [postId]: '' }))
  }

  const handleApply = () => {
    if (!applyBio.trim()) { showToast('אנא כתוב קצת על עצמך', 'error'); return }
    showToast('מועמדות הוגשה בהצלחה! 🎉', 'success')
    setApplyPostId(null)
    setApplyBio('')
    setApplyQuestion('')
  }

  // ── Shared compose body ──────────────────────────────────────────────────
  const composeBody = (
    <>
      <div className="flex gap-3 mb-3">
        <Avatar user={user} size="md" />
        <div className="flex-1 relative">
          <textarea
            ref={textareaRef}
            value={newPost}
            onChange={handleContentChange}
            placeholder={`מה אתה חושב, ${user.name.split(' ')[0]}? שתף סקיצה, מחשבה, רעיון... (#תגית, @תיוג)`}
            rows={3}
            className="w-full bg-bg3 rounded-xl px-4 py-3 text-sm text-text-primary placeholder:text-text-muted resize-none focus:outline-none focus:ring-1 focus:ring-purple border border-border focus:border-purple transition-all"
          />
          {showHashtags && contextHashtags.length > 0 && (
            <div className="absolute top-full mt-1 right-0 left-0 z-[150] rounded-xl overflow-hidden"
              style={{ background: '#0d0d22', border: '1px solid rgba(168,85,247,0.35)', boxShadow: '0 8px 32px rgba(0,0,0,0.7)' }}>
              <p className="text-xs text-text-muted px-3 pt-2.5 pb-1">תגיות מומלצות</p>
              <div className="flex flex-wrap gap-1.5 px-3 pb-3 max-h-32 overflow-y-auto">
                {contextHashtags.map(tag => (
                  <button key={tag} onClick={() => insertHashtag(tag)}
                    className="px-2.5 py-1 text-purple rounded-lg text-xs hover:text-white active:scale-95 transition-all"
                    style={{ background: 'rgba(168,85,247,0.15)', border: '1px solid rgba(168,85,247,0.3)' }}
                    onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(168,85,247,0.35)' }}
                    onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(168,85,247,0.15)' }}>
                    {tag}
                  </button>
                ))}
              </div>
            </div>
          )}
          {showMentions && filteredMentions.length > 0 && (
            <div className="absolute top-full mt-1 right-0 left-0 z-[150] rounded-xl overflow-hidden"
              style={{ background: '#0d0d22', border: '1px solid rgba(168,85,247,0.35)', boxShadow: '0 8px 32px rgba(0,0,0,0.7)' }}>
              <p className="text-xs text-text-muted px-3 pt-2.5 pb-1">תיוג משתמש</p>
              <div className="max-h-48 overflow-y-auto">
                {filteredMentions.map(u => (
                  <button key={u.id} onClick={() => insertMention(u.name)}
                    className="w-full flex items-center gap-2.5 px-3 py-2 hover:bg-bg3 transition-colors text-right">
                    <Avatar user={u} size="sm" />
                    <div className="flex-1 min-w-0 text-right">
                      <p className="text-sm font-medium text-text-primary">{u.name}</p>
                      <p className="text-xs text-text-muted">{u.role}</p>
                    </div>
                    {u.isVerified && <VerifiedBadge size={13} />}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {(mood || location) && (
        <div className="flex flex-wrap gap-2 mb-3 px-1">
          {mood && (
            <span className="flex items-center gap-1.5 px-3 py-1 bg-purple/10 border border-purple/20 rounded-full text-sm text-purple">
              {mood}
              <button onClick={() => setMood('')} className="hover:text-danger transition-colors"><X size={12} /></button>
            </span>
          )}
          {location && (
            <span className="flex items-center gap-1.5 px-3 py-1 bg-info/10 border border-info/20 rounded-full text-sm text-info">
              <MapPin size={12} /> {location}
              <button onClick={() => setLocation('')} className="hover:text-danger transition-colors"><X size={12} /></button>
            </span>
          )}
        </div>
      )}

      {attachedFile && (
        <div className="flex items-center gap-2 mb-3 px-2 py-2 bg-bg3 rounded-xl border border-border">
          <Paperclip size={13} className="text-purple flex-shrink-0" />
          <span className="text-xs text-text-secondary flex-1 truncate">{attachedFile.name}</span>
          <button onClick={() => setAttachedFile(null)} className="text-text-muted hover:text-danger transition-colors">
            <X size={14} />
          </button>
        </div>
      )}

      {showMoodPicker && (
        <div className="mb-3 p-3 bg-bg3 rounded-xl border border-border">
          <p className="text-xs text-text-muted mb-2">איך אתה מרגיש?</p>
          <div className="flex flex-wrap gap-1.5">
            {MOODS.map(m => (
              <button key={m} onClick={() => { setMood(m); setShowMoodPicker(false) }}
                className="px-2.5 py-1.5 bg-bg2 rounded-lg text-xs hover:bg-purple/20 hover:text-purple active:scale-95 transition-all border border-border hover:border-purple/30">
                {m}
              </button>
            ))}
          </div>
        </div>
      )}

      {showLocationInput && (
        <div className="mb-3">
          <input
            placeholder="הוסף מיקום (עיר, סטודיו...)"
            onChange={e => setLocation(e.target.value)}
            className="w-full bg-bg3 border border-border rounded-xl px-4 py-2.5 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-purple transition-colors"
          />
        </div>
      )}

      <input ref={fileInputRef} type="file" accept="audio/*,video/*,image/*,.pdf" className="hidden"
        onChange={e => { if (e.target.files?.[0]) setAttachedFile(e.target.files[0]); e.target.value = '' }} />

      <div className="flex items-center gap-1 justify-between flex-wrap gap-y-2">
        <div className="flex gap-1 flex-wrap">
          {[
            { icon: Image, label: 'תמונה', action: () => fileInputRef.current?.click(), color: 'text-success' },
            { icon: Music, label: 'אודיו', action: () => fileInputRef.current?.click(), color: 'text-purple' },
            { icon: Smile, label: 'תחושה', action: () => { setShowMoodPicker(p => !p); setShowLocationInput(false) }, color: 'text-warning' },
            { icon: MapPin, label: 'מיקום', action: () => { setShowLocationInput(p => !p); setShowMoodPicker(false) }, color: 'text-info' },
            { icon: Hash, label: 'תגית', action: () => { setHashtagFilter(''); setShowHashtags(p => !p); setShowMentions(false); textareaRef.current?.focus() }, color: 'text-purple' },
            { icon: AtSign, label: 'תיוג', action: () => { setMentionFilter(''); setShowMentions(p => !p); setShowHashtags(false); textareaRef.current?.focus() }, color: 'text-pink' },
          ].map(({ icon: Icon, label, action, color }) => (
            <button key={label} onClick={action} title={label}
              className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium border bg-bg3 border-border ${color} hover:bg-bg2 hover:border-purple/30 active:scale-95 transition-all`}>
              <Icon size={13} />
              <span className="hidden sm:inline">{label}</span>
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <select value={privacy} onChange={e => setPrivacy(e.target.value)}
            className="bg-bg3 border border-border rounded-lg px-2 py-1.5 text-xs text-text-secondary focus:outline-none focus:border-purple cursor-pointer">
            {PRIVACY_OPTIONS.map(o => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
          <button onClick={submitPost} disabled={!newPost.trim() && !attachedFile}
            className="flex items-center gap-2 px-4 py-2 bg-brand-gradient rounded-xl text-xs font-semibold text-white hover:opacity-90 active:scale-95 transition-all disabled:opacity-40 shadow-glow-sm">
            <Send size={13} />
            פרסם
          </button>
        </div>
      </div>
    </>
  )

  return (
    <div className="max-w-6xl mx-auto px-3 sm:px-4 py-3 sm:py-6 flex gap-6">

      {/* Apply modal */}
      {applyPostId && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 modal-backdrop"
          onClick={() => setApplyPostId(null)}>
          <div className="bg-bg1 rounded-2xl p-6 w-full max-w-md shadow-surface-lg modal-card"
            onClick={e => e.stopPropagation()}>
            <div className="flex items-start justify-between mb-4">
              <div>
                <h2 className="font-bold text-lg">הגש מועמדות</h2>
                <p className="text-text-muted text-sm mt-0.5">ספר על עצמך ועל מה שאתה מביא לשולחן</p>
              </div>
              <button onClick={() => setApplyPostId(null)} className="text-text-muted hover:text-text-primary transition-colors p-1">
                <X size={18} />
              </button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-text-secondary mb-1.5">קצת עליי *</label>
                <textarea value={applyBio} onChange={e => setApplyBio(e.target.value)}
                  placeholder="ניסיון, סגנון מוזיקלי, מה אני יכול לתרום לפרויקט..."
                  rows={4} autoFocus
                  className="w-full bg-bg3 border border-border rounded-xl px-4 py-3 text-sm text-text-primary placeholder:text-text-muted resize-none focus:outline-none focus:border-purple transition-colors" />
              </div>
              <div>
                <label className="block text-xs font-medium text-text-secondary mb-1.5">שאלה לפני שמגישים (אופציונלי)</label>
                <input value={applyQuestion} onChange={e => setApplyQuestion(e.target.value)}
                  placeholder="למשל: מה הסאונד הרצוי? מה הטיימליין?"
                  className="w-full bg-bg3 border border-border rounded-xl px-4 py-3 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-purple transition-colors" />
              </div>
            </div>
            <div className="flex gap-3 mt-5">
              <button onClick={handleApply}
                className="flex-1 py-3 bg-brand-gradient rounded-xl text-sm font-semibold text-white hover:opacity-90 active:scale-95 transition-all shadow-glow-sm">
                שלח מועמדות
              </button>
              <button onClick={() => setApplyPostId(null)}
                className="flex-1 py-3 bg-bg3 border border-border rounded-xl text-sm text-text-secondary hover:text-text-primary hover:border-purple/30 transition-all">
                ביטול
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Mobile compose bottom sheet */}
      {mobileComposeOpen && (
        <div
          className="md:hidden fixed inset-0 z-[100] flex items-end modal-backdrop"
          style={{ background: 'rgba(0,0,0,0.55)' }}
          onClick={() => setMobileComposeOpen(false)}
        >
          <div
            className="w-full bg-bg1 rounded-t-3xl overflow-hidden"
            style={{ animation: 'slide-up 0.28s cubic-bezier(0.34,1.2,0.64,1) forwards', maxHeight: '90dvh' }}
            onClick={e => e.stopPropagation()}
          >
            {/* Drag handle */}
            <div className="flex justify-center pt-3 pb-1">
              <div className="w-10 h-1 rounded-full bg-border" />
            </div>
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-2 border-b border-border">
              <button
                onClick={() => setMobileComposeOpen(false)}
                className="p-2 -mr-2 text-text-muted hover:text-text-primary transition-colors"
              >
                <X size={20} />
              </button>
              <span className="text-sm font-semibold">פוסט חדש</span>
              <button
                onClick={() => { submitPost(); setMobileComposeOpen(false) }}
                disabled={!newPost.trim() && !attachedFile}
                className="px-3 py-1.5 text-sm font-semibold text-purple disabled:text-text-muted transition-colors"
              >
                פרסם
              </button>
            </div>
            {/* Body */}
            <div className="p-4 overflow-y-auto" style={{ maxHeight: 'calc(90dvh - 80px)' }}>
              {composeBody}
            </div>
          </div>
        </div>
      )}

      {/* ── Main feed ─────────────────────────────────────────────────────── */}
      <div className="flex-1 min-w-0 space-y-3">

        {/* ── Stories bar ───────────────────────────────────────────────── */}
        <div className="bg-bg1 rounded-2xl shadow-surface">
          <div className="flex gap-4 px-4 py-3 overflow-x-auto no-scrollbar">
            {/* My story */}
            <button
              onClick={() => showToast('פונקציית סטורי בקרוב!', 'info')}
              className="flex flex-col items-center gap-1.5 flex-shrink-0 active:scale-90 transition-transform"
            >
              <div className="relative">
                <div className="w-14 h-14 rounded-full ring-2 ring-dashed ring-purple/40 overflow-hidden">
                  <Avatar user={user} size="lg" />
                </div>
                <div className="absolute -bottom-0.5 -right-0.5 w-5 h-5 bg-brand-gradient rounded-full flex items-center justify-center border-2 border-bg1">
                  <Plus size={10} className="text-white" />
                </div>
              </div>
              <span className="text-[10px] text-text-muted w-14 text-center leading-tight">הסטורי שלי</span>
            </button>

            {USERS.filter(u => u.id !== user.id).slice(0, 10).map((su, i) => (
              <button
                key={su.id}
                onClick={() => showToast(`הסטורי של ${su.name.split(' ')[0]}`, 'info')}
                className="flex flex-col items-center gap-1.5 flex-shrink-0 active:scale-90 transition-transform"
              >
                <div className={`w-14 h-14 rounded-full p-[2.5px] ${i < 7 ? 'bg-brand-gradient' : 'bg-bg3'}`}>
                  <div className="w-full h-full rounded-full bg-bg1 p-[2px] overflow-hidden">
                    <Avatar user={su} size="lg" />
                  </div>
                </div>
                <span className="text-[10px] text-text-muted w-14 text-center truncate leading-tight">{su.name.split(' ')[0]}</span>
              </button>
            ))}
          </div>
        </div>

        {/* ── Mobile compact compose trigger ────────────────────────────── */}
        <div
          className="md:hidden bg-bg1 rounded-2xl shadow-surface p-3 flex items-center gap-3 cursor-pointer active:opacity-75 transition-opacity"
          onClick={() => setMobileComposeOpen(true)}
        >
          <Avatar user={user} size="sm" />
          <div className="flex-1 bg-bg3 rounded-full px-4 py-2.5 text-sm text-text-muted select-none">
            מה חדש, {user.name.split(' ')[0]}? 🎵
          </div>
          <div className="flex items-center gap-3 pl-1">
            <Music size={18} className="text-purple flex-shrink-0" />
            <Image size={18} className="text-success flex-shrink-0" />
          </div>
        </div>

        {/* ── Desktop full compose ───────────────────────────────────────── */}
        <div className="hidden md:block bg-bg1 rounded-2xl shadow-surface p-4 transition-all">
          {composeBody}
        </div>

        {/* ── Posts ───────────────────────────────────────────────────────── */}
        {posts.map(post => {
          const author = getUserById(post.userId)
          if (!author) return null

          const allComments = [...(post.comments || [])].sort((a, b) => (b.likes || 0) - (a.likes || 0))
          const isOpen = expandedComments[post.id] || false
          const visibleComments = allComments

          return (
            <div key={post.id} className="bg-bg1 rounded-2xl shadow-surface overflow-hidden fade-in hover:shadow-glow transition-all duration-200">
              <div className="p-4">
                {/* Header */}
                <div className="flex items-start gap-3 mb-3">
                  <Link href={`/profile/${author.id}`}>
                    <Avatar user={author} size="md" showOnline />
                  </Link>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <ProfileHoverCard userId={author.id}>
                        <Link href={`/profile/${author.id}`}
                          className="font-semibold text-sm hover:text-purple transition-colors">
                          {author.name}
                        </Link>
                      </ProfileHoverCard>
                      {author.isVerified && <VerifiedBadge size={14} />}
                      <span className="text-text-muted text-xs">{author.role}</span>
                      <span className="text-text-muted text-xs">·</span>
                      <span className="text-text-muted text-xs">{post.createdAt}</span>
                    </div>
                  </div>
                  {post.type === 'collab' && (
                    <span className="px-2.5 py-1 bg-purple/15 border border-purple/30 rounded-lg text-xs text-purple font-medium flex-shrink-0">
                      🤝 מחפש שיתוף
                    </span>
                  )}
                </div>

                {/* Content */}
                <p className="text-sm text-text-primary leading-relaxed mb-3 whitespace-pre-line">
                  {post.content.split(/(\s+)/).map((word, i) =>
                    word.startsWith('#')
                      ? <span key={i} className="text-purple hover:text-pink cursor-pointer transition-colors">{word}</span>
                      : word.startsWith('@')
                        ? <span key={i} className="text-info cursor-pointer hover:underline">{word}</span>
                        : <span key={i}>{word}</span>
                  )}
                </p>

                {/* Audio */}
                {post.audioUrl && (
                  <div className="mb-3">
                    <AudioPlayer url={post.audioUrl} duration={post.audioDuration} />
                  </div>
                )}

                {/* Collab CTA */}
                {(post.type === 'collab' || post.collabRole) && (
                  <div className="bg-purple/8 border border-purple/20 rounded-xl p-3 mb-3 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Zap size={14} className="text-purple" />
                      <span className="text-xs text-text-secondary">מחפש: <span className="text-purple font-medium">{post.collabRole}</span></span>
                    </div>
                    <button onClick={() => setApplyPostId(post.id)}
                      className="px-3 py-1.5 bg-brand-gradient rounded-lg text-xs font-semibold text-white hover:opacity-90 active:scale-95 transition-all">
                      הגש מועמדות
                    </button>
                  </div>
                )}

                {/* Actions — larger tap targets on mobile */}
                <div className="flex items-center gap-1 sm:gap-5 pt-2 border-t border-border/50">
                  <button onClick={() => likePost(post.id)}
                    className={`flex items-center gap-1.5 text-xs transition-all active:scale-90 py-2 px-3 sm:px-0 rounded-lg sm:rounded-none hover:bg-bg3 sm:hover:bg-transparent
                      ${post.isLiked ? 'text-pink' : 'text-text-muted hover:text-pink'}`}>
                    <Heart size={17} fill={post.isLiked ? 'currentColor' : 'none'} />
                    <span>{post.likes}</span>
                  </button>
                  <button
                    onClick={() => setExpandedComments(prev => ({ ...prev, [post.id]: !isOpen }))}
                    className="flex items-center gap-1.5 text-xs text-text-muted hover:text-info active:scale-95 transition-all py-2 px-3 sm:px-0 rounded-lg sm:rounded-none hover:bg-bg3 sm:hover:bg-transparent">
                    <MessageCircle size={17} />
                    <span>{allComments.length}</span>
                  </button>
                  <button onClick={() => { navigator.clipboard?.writeText(`${window.location.origin}/posts/${post.id}`); showToast('הקישור הועתק', 'info') }}
                    className="flex items-center gap-1.5 text-xs text-text-muted hover:text-success active:scale-95 transition-all py-2 px-3 sm:px-0 rounded-lg sm:rounded-none hover:bg-bg3 sm:hover:bg-transparent">
                    <Share2 size={17} />
                    <span className="hidden sm:inline">שתף</span>
                  </button>
                </div>
              </div>

              {/* ── Inline comments (toggle via comment icon) ─────────────── */}
              {isOpen && allComments.length > 0 && (
                <div className="border-t border-border/40 bg-bg2/40 px-4 pt-3 pb-2 space-y-2.5">
                  {visibleComments.map(c => {
                    const cu = getUserById(c.userId)
                    if (!cu) return null
                    return (
                      <div key={c.id} className="flex items-start gap-2 fade-in">
                        <Link href={`/profile/${cu.id}`}>
                          <Avatar user={cu} size="sm" />
                        </Link>
                        <div className="flex-1">
                          <div className="bg-bg3 rounded-xl px-3 py-2 inline-block max-w-full">
                            <ProfileHoverCard userId={cu.id}>
                              <Link href={`/profile/${cu.id}`}
                                className="text-xs font-semibold text-text-primary hover:text-purple transition-colors ml-2">
                                {cu.name}
                              </Link>
                            </ProfileHoverCard>
                            <span className="text-xs text-text-secondary">{c.text}</span>
                          </div>
                          <div className="flex items-center gap-3 mt-1 px-1">
                            <button onClick={() => likeComment(post.id, c.id)}
                              className="flex items-center gap-1 text-xs text-text-muted hover:text-success transition-all active:scale-90">
                              <ThumbsUp size={11} />
                              {c.likes || 0}
                            </button>
                            <button onClick={() => dislikeComment(post.id, c.id)}
                              className="flex items-center gap-1 text-xs text-text-muted hover:text-danger transition-all active:scale-90">
                              <ThumbsDown size={11} />
                              {c.dislikes || 0}
                            </button>
                            <span className="text-xs text-text-muted">{c.createdAt}</span>
                          </div>
                        </div>
                      </div>
                    )
                  })}

                  <button
                    onClick={() => setExpandedComments(prev => ({ ...prev, [post.id]: false }))}
                    className="flex items-center gap-1 text-xs text-purple hover:text-pink transition-colors py-1">
                    <ChevronUp size={13} /> הסתר תגובות
                  </button>
                </div>
              )}

              {/* Comment input — only when expanded */}
              {isOpen && (
              <div className="border-t border-border/40 bg-bg2/20 px-4 py-3 flex items-center gap-2">
                <Avatar user={user} size="sm" />
                <input
                  value={commentTexts[post.id] || ''}
                  onChange={e => setCommentTexts(prev => ({ ...prev, [post.id]: e.target.value }))}
                  onKeyDown={e => e.key === 'Enter' && submitComment(post.id)}
                  placeholder="הוסף תגובה..."
                  className="flex-1 bg-bg3 border border-border/60 rounded-xl px-3 py-2.5 text-xs text-text-primary placeholder:text-text-muted focus:outline-none focus:border-purple transition-colors"
                />
                <button onClick={() => submitComment(post.id)}
                  className="p-2.5 bg-purple/20 hover:bg-purple/35 active:scale-90 rounded-lg transition-all">
                  <Send size={13} className="text-purple" />
                </button>
              </div>
              )}
            </div>
          )
        })}
      </div>

      {/* ── Sidebar ──────────────────────────────────────────────────────── */}
      <div className="hidden lg:block w-72 space-y-4">
        {/* My profile card */}
        <div className="bg-bg1 rounded-2xl shadow-surface p-4">
          <Link href={`/profile/${user.id}`} className="flex items-center gap-3 hover:opacity-85 transition-opacity">
            <Avatar user={user} size="lg" showOnline />
            <div>
              <div className="flex items-center gap-1.5">
                <p className="font-semibold text-sm">{user.name}</p>
                {user.isVerified && <VerifiedBadge size={14} />}
              </div>
              <p className="text-text-muted text-xs">{user.role} · {user.location}</p>
              <div className="flex items-center gap-1 mt-1">
                <span className="text-success text-xs font-medium">{user.trustScore}</span>
                <span className="text-text-muted text-xs">ציון אמון</span>
              </div>
            </div>
          </Link>
          <div className="grid grid-cols-3 gap-2 mt-3 pt-3 border-t border-border text-center">
            {[['שירים', user.songs], ['שיתופים', user.collabs], ['עוקבים', user.followers]].map(([l, v]) => (
              <div key={l}>
                <p className="font-bold text-sm">{v}</p>
                <p className="text-text-muted text-xs">{l}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Suggested */}
        <div className="bg-bg1 rounded-2xl shadow-surface p-4">
          <div className="flex items-center gap-2 mb-4">
            <Zap size={14} className="text-purple" />
            <p className="text-sm font-semibold">מוצע עבורך</p>
          </div>
          <div className="space-y-3">
            {suggested.map(u => (
              <div key={u.id} className="flex items-center gap-2">
                <Link href={`/profile/${u.id}`}>
                  <Avatar user={u} size="sm" showOnline />
                </Link>
                <div className="flex-1 min-w-0">
                  <ProfileHoverCard userId={u.id}>
                    <Link href={`/profile/${u.id}`} className="text-xs font-medium hover:text-purple transition-colors truncate block">{u.name}</Link>
                  </ProfileHoverCard>
                  <p className="text-text-muted text-xs truncate">{u.role}</p>
                </div>
                <Link href={`/profile/${u.id}`}
                  className="text-xs text-purple border border-purple/30 rounded-lg px-2 py-1 hover:bg-purple/10 active:scale-95 transition-all flex-shrink-0">
                  צפה
                </Link>
              </div>
            ))}
          </div>
          <Link href="/discover"
            className="mt-4 flex items-center justify-center gap-2 text-xs text-text-muted hover:text-purple transition-colors pt-3 border-t border-border">
            <UsersIcon size={13} />
            גלה עוד יוצרים
          </Link>
        </div>
      </div>
    </div>
  )
}
