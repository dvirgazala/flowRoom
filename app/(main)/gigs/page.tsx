'use client'
import { useState, useMemo, useRef, useEffect } from 'react'
import Link from 'next/link'
import { USERS } from '@/lib/data'
import { useStore } from '@/lib/store'
import Avatar from '@/components/Avatar'
import DmChatModal from '@/components/DmChatModal'
import PaymentModal from '@/components/PaymentModal'
import VerifiedBadge from '@/components/VerifiedBadge'
import {
  Briefcase, Search, Star, Clock, Plus, Zap,
  Mic2, Music2, Wand2, FileText, Headphones, Megaphone, BookOpen,
  X, Check, ChevronRight, Send, Loader2,
  Shield, Users, TrendingUp,
  ArrowRight, CheckCircle2,
} from 'lucide-react'
import type { User } from '@/lib/types'

// ─── Types ────────────────────────────────────────────────────────────────────

interface Gig {
  id: string; userId: string; title: string; category: string; desc: string
  longDesc: string; price: number; priceStandard: number; pricePremium: number
  delivery: number; deliveryStandard: number; deliveryPremium: number
  rating: number; reviews: number; tags: string[]
  badge: string | null; revisions: number
  includes: string[]
}

interface Job {
  id: string; userId: string; title: string; category: string; desc: string
  budget: string; budgetType: string; posted: string; proposals: number; skills: string[]
}

// ─── Static seed data ─────────────────────────────────────────────────────────

const CATEGORIES = ['הכל', 'מיקס ומאסטר', 'הפקה', 'ווקאל', 'כתיבה', 'עיצוב סאונד', 'מיתוג', 'הוראה']

const CAT_ICONS: Record<string, React.ReactNode> = {
  'מיקס ומאסטר': <Wand2 size={14} />,
  'הפקה': <Music2 size={14} />,
  'ווקאל': <Mic2 size={14} />,
  'כתיבה': <FileText size={14} />,
  'עיצוב סאונד': <Headphones size={14} />,
  'מיתוג': <Megaphone size={14} />,
  'הוראה': <BookOpen size={14} />,
}

const SEED_GIGS: Gig[] = [
  {
    id: 'g1', userId: 'u1', title: 'מיקס ומאסטר מקצועי לשיר', category: 'מיקס ומאסטר',
    desc: 'מיקס ומאסטר ברמה A-list. 3 סבבי תיקונים, תוצר מוכן להפצה.',
    longDesc: 'אני מציע שירות מיקס ומאסטר מקצועי עם ניסיון של 8 שנים בתעשייה. עבדתי עם אמנים מובילים ברחבי הארץ. השירות כולל מיקס מקצועי, עיבוד ווקאל, ומאסטר מוכן ל-Spotify/Apple Music/יוטיוב. אני עובד עם Pro Tools ו-Logic Pro עם פלאגינים מקצועיים (Waves, Neve, SSL).',
    price: 350, priceStandard: 550, pricePremium: 900,
    delivery: 3, deliveryStandard: 5, deliveryPremium: 7,
    rating: 4.9, reviews: 87, revisions: 3,
    tags: ['Pro Tools', 'SSL', 'Waves', 'Streaming'],
    badge: 'מומחה',
    includes: ['מיקס מלא', 'מאסטר', 'Stems נפרדים', 'WAV + MP3', 'תיקונים'],
  },
  {
    id: 'g2', userId: 'u2', title: 'כתיבת טקסט לשיר פופ / R&B', category: 'כתיבה',
    desc: 'כתיבת בית, פזמון והוק. סגנונות: פופ, R&B, סול. כולל 2 דראפטים.',
    longDesc: 'כותב טקסטים עם ניסיון של מעל 10 שנים. כתבתי לאמנים מובילים בישראל. מתמחה בפופ, R&B, סול ומוזיקה עברית. כל שיר מגיע עם 2 גרסאות ואפשרות לשינויים.',
    price: 200, priceStandard: 350, pricePremium: 600,
    delivery: 2, deliveryStandard: 4, deliveryPremium: 6,
    rating: 4.7, reviews: 53, revisions: 2,
    tags: ['עברית', 'אנגלית', 'הוק', 'פופ', 'R&B'],
    badge: null,
    includes: ['טקסט מלא', '2 דראפטים', 'תיאום מוזיקלי', 'תיקונים'],
  },
  {
    id: 'g3', userId: 'u3', title: 'הקלטת ווקאל מקצועי', category: 'ווקאל',
    desc: 'הקלטה בסטודיו ביתי מקצועי. קול נשי — פופ, ג\'אז, R&B.',
    longDesc: 'זמרת מקצועית עם ניסיון של 6 שנים. מוקלט בסטודיו ביתי אקוסטי עם מיקרופון Neumann U87. אני מציעה ביצוע מקצועי, עריכת ווקאל, וקובץ WAV איכותי מוכן למיקס.',
    price: 280, priceStandard: 450, pricePremium: 750,
    delivery: 4, deliveryStandard: 6, deliveryPremium: 10,
    rating: 5.0, reviews: 41, revisions: 3,
    tags: ['פופ', 'ג\'אז', 'R&B', 'Neumann', 'Wav'],
    badge: 'Top Rated',
    includes: ['הקלטה מלאה', 'עריכת ווקאל', 'WAV 24bit', 'מנגינה + פזמון'],
  },
  {
    id: 'g4', userId: 'u4', title: 'הפקת ביט טראפ / דריל', category: 'הפקה',
    desc: 'ביט מקורי בסגנון שתבחר. Stems מלאים כולל רישיון.',
    longDesc: 'מפיק עם 5 שנות ניסיון בטראפ, דריל ואלקטרוניקה. כל ביט בנוי מאפס, עם מלודיה, בס, ו-808 מקצועי. מגיע עם Stems מלאים ורישיון מסחרי.',
    price: 500, priceStandard: 800, pricePremium: 1400,
    delivery: 5, deliveryStandard: 7, deliveryPremium: 10,
    rating: 4.8, reviews: 120, revisions: 2,
    tags: ['Trap', 'Drill', 'FL Studio', 'Stems', 'License'],
    badge: 'מומחה',
    includes: ['ביט מקורי', 'Stems מלאים', 'רישיון מסחרי', 'BPM + Key'],
  },
  {
    id: 'g5', userId: 'u5', title: 'עיצוב סאונד ואפקטים', category: 'עיצוב סאונד',
    desc: 'יצירת סאונד ייחודי, patches, presets ו-SFX לפי הצרכים שלך.',
    longDesc: 'מעצב סאונד עם ניסיון בטלוויזיה, גיימינג ומוזיקה. עובד עם Serum, Massive, Ableton Live ו-Max/MSP. אספק presets מקצועיים, SFX, ו-sound design לפי הדרישות שלך.',
    price: 180, priceStandard: 300, pricePremium: 500,
    delivery: 3, deliveryStandard: 5, deliveryPremium: 7,
    rating: 4.6, reviews: 29, revisions: 2,
    tags: ['Serum', 'Massive', 'Ableton', 'SFX', 'Presets'],
    badge: null,
    includes: ['Presets', 'SFX Pack', 'קבצי מקור', 'הנחיות שימוש'],
  },
  {
    id: 'g6', userId: 'u6', title: 'שיעורי הפקה מוזיקלית', category: 'הוראה',
    desc: 'שיעורים אישיים ב-Ableton / FL Studio. מתחילים עד מתקדמים.',
    longDesc: 'מלמד הפקה מוזיקלית כבר 4 שנים. עבדתי עם מעל 200 תלמידים. השיעורים מתקיימים בזום, מותאמים לרמת הנוכחית ולמטרות שלך. כולל תיעוד וחומרים ללמידה עצמאית.',
    price: 150, priceStandard: 250, pricePremium: 400,
    delivery: 1, deliveryStandard: 1, deliveryPremium: 1,
    rating: 4.9, reviews: 64, revisions: 0,
    tags: ['Ableton', 'FL Studio', 'זום', 'מתחילים', 'מתקדמים'],
    badge: null,
    includes: ['שיעור אישי', 'הקלטת השיעור', 'חומרי לימוד', 'תמיכה בווטסאפ'],
  },
  {
    id: 'g7', userId: 'u7', title: 'קמפיין שיווק לשיר חדש', category: 'מיתוג',
    desc: 'אסטרטגיית שיווק ל-Spotify, TikTok ואינסטגרם. כולל פיץ\' לפלייליסטים.',
    longDesc: 'מומחה שיווק מוזיקה עם ניסיון של 3 שנים. ביצעתי קמפיינים ששיגרו שירים ל-100K+ סטרימינגים. אני מטפל בפיץ\' לפלייליסטים, פרסום ממומן, ובניית קהל.',
    price: 420, priceStandard: 700, pricePremium: 1200,
    delivery: 7, deliveryStandard: 14, deliveryPremium: 30,
    rating: 4.7, reviews: 38, revisions: 1,
    tags: ['Spotify', 'TikTok', 'PR', 'פלייליסטים', 'אינסטגרם'],
    badge: null,
    includes: ['פיץ\' ל-20 פלייליסטים', 'פרסום ממומן', 'דוח תוצאות', 'אסטרטגיה'],
  },
  {
    id: 'g8', userId: 'u8', title: 'הפקת מוזיקה לסינמה / פרסומות', category: 'הפקה',
    desc: 'מוזיקה מקורית לפרסומות, יוטיוב, ריאליטי. עבודה עם תקציב גמיש.',
    longDesc: 'מלחין ומפיק עם ניסיון נרחב בסינק לסרטים, פרסומות ותוכניות טלוויזיה. עבדתי עם מותגים כמו יוניליוור, HOT ו-YES. כל יצירה מגיעה עם רישיון sync ו-stems מלאים.',
    price: 800, priceStandard: 1400, pricePremium: 2500,
    delivery: 7, deliveryStandard: 10, deliveryPremium: 14,
    rating: 4.9, reviews: 55, revisions: 3,
    tags: ['Cinematic', 'Sync', 'License', 'TV', 'Ads'],
    badge: 'Top Rated',
    includes: ['יצירה מקורית', 'Stems מלאים', 'רישיון Sync', 'גרסאות עריכה'],
  },
]

const SEED_JOBS: Job[] = [
  { id: 'j1', userId: 'u9',  title: 'מחפש מפיק לאלבום דבות 8 שירים', category: 'הפקה',        desc: 'צריך מפיק שיודע לעבוד עם ווקאל חי. סגנון: פופ-ישראלי עם נגיעות אלקטרוניות. תקציב גמיש לאיש הנכון.', budget: '3,000–8,000 ₪', budgetType: 'פרויקט', posted: 'לפני 2 שעות', proposals: 4, skills: ['הפקה', 'פופ', 'ווקאל חי'] },
  { id: 'j2', userId: 'u10', title: 'דרוש מהנדס מיקס לסינגל דחוף', category: 'מיקס ומאסטר', desc: 'הסינגל צריך לצאת עוד שבוע. יש Stems מוכנים, צריך מיקס ומאסטר מקצועי. תוצר ל-Spotify.', budget: '400–600 ₪', budgetType: 'קבוע', posted: 'לפני 5 שעות', proposals: 7, skills: ['מיקס', 'מאסטר', 'Streaming'] },
  { id: 'j3', userId: 'u11', title: 'כותב/ת טקסטים לאפליקציית AI', category: 'כתיבה',        desc: 'מחפשים מישהו שיכתוב קאפי לאפליקציה מוזיקלית. ניסיון בכתיבה לקהל צעיר — יתרון.', budget: '150 ₪/שעה', budgetType: 'שעתי', posted: 'אתמול', proposals: 12, skills: ['קופירייטינג', 'UX Writing', 'מוזיקה'] },
  { id: 'j4', userId: 'u12', title: 'ווקאליסט/ית לסינגל R&B', category: 'ווקאל',             desc: 'מחפשים קול נשי חזק לשיר R&B. יש מנגינה מוכנה, צריך ביצוע מקצועי. כולל הקלטה בסטודיו.', budget: '500–1,200 ₪', budgetType: 'פרויקט', posted: 'לפני 3 ימים', proposals: 9, skills: ['R&B', 'ווקאל', 'הקלטה'] },
  { id: 'j5', userId: 'u1',  title: 'מחפש מנהל/ת מדיה חברתית למותג מוזיקה', category: 'מיתוג', desc: 'לייבל קטן מחפש מישהו שינהל אינסטגרם ו-TikTok. 3–4 פוסטים בשבוע. עבודה מרחוק.', budget: '1,500 ₪/חודש', budgetType: 'חודשי', posted: 'לפני שבוע', proposals: 18, skills: ['Instagram', 'TikTok', 'שיווק'] },
]

type Mode = 'gigs' | 'jobs'
type Sort = 'popular' | 'price-low' | 'price-high' | 'rating'

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function GigsPage() {
  const { showToast, currentUser } = useStore()
  const [mode, setMode] = useState<Mode>('gigs')
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('הכל')
  const [sort, setSort] = useState<Sort>('popular')

  // dynamic data
  const [gigs, setGigs] = useState<Gig[]>(SEED_GIGS)
  const [jobs, setJobs] = useState<Job[]>(SEED_JOBS)

  // modals
  const [selectedGig, setSelectedGig] = useState<Gig | null>(null)
  const [selectedJob, setSelectedJob] = useState<Job | null>(null)
  const [dmUserId, setDmUserId] = useState<string | null>(null)
  const [payGig, setPayGig] = useState<{ title: string; price: number } | null>(null)
  const [showPostGig, setShowPostGig] = useState(false)
  const [showPostJob, setShowPostJob] = useState(false)

  const filteredGigs = useMemo(() => {
    let list = gigs
    if (search.trim()) {
      const q = search.toLowerCase()
      list = list.filter(g => g.title.toLowerCase().includes(q) || g.desc.toLowerCase().includes(q))
    }
    if (category !== 'הכל') list = list.filter(g => g.category === category)
    return [...list].sort((a, b) => {
      if (sort === 'popular') return b.reviews - a.reviews
      if (sort === 'price-low') return a.price - b.price
      if (sort === 'price-high') return b.price - a.price
      return b.rating - a.rating
    })
  }, [gigs, search, category, sort])

  const filteredJobs = useMemo(() => {
    let list = jobs
    if (search.trim()) {
      const q = search.toLowerCase()
      list = list.filter(j => j.title.toLowerCase().includes(q) || j.desc.toLowerCase().includes(q))
    }
    if (category !== 'הכל') list = list.filter(j => j.category === category)
    return list
  }, [jobs, search, category])

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">

      {/* Modals */}
      {selectedGig && (
        <GigDetailModal
          gig={selectedGig}
          onClose={() => setSelectedGig(null)}
          onContact={(uid) => { setSelectedGig(null); setDmUserId(uid) }}
          onOrder={(title, price) => { setSelectedGig(null); setPayGig({ title, price }) }}
        />
      )}
      {selectedJob && (
        <ProposalModal
          job={selectedJob}
          onClose={() => setSelectedJob(null)}
          onSubmit={(jobTitle) => {
            setJobs(prev => prev.map(j => j.id === selectedJob.id ? { ...j, proposals: j.proposals + 1 } : j))
            setSelectedJob(null)
            showToast(`הצעתך ל"${jobTitle}" נשלחה! 🎯`, 'success')
          }}
        />
      )}
      {dmUserId && <DmChatModal userId={dmUserId} onClose={() => setDmUserId(null)} />}
      {payGig && (
        <PaymentModal
          productTitle={payGig.title}
          productPrice={payGig.price}
          onClose={() => setPayGig(null)}
          onSuccess={() => { setPayGig(null); showToast(`הזמנת "${payGig.title}" בוצעה בהצלחה! 🎉`, 'success') }}
        />
      )}
      {showPostGig && (
        <PostGigModal
          onClose={() => setShowPostGig(false)}
          onSubmit={(gig) => {
            setGigs(prev => [gig, ...prev])
            setShowPostGig(false)
            showToast('הגיג שלך פורסם! 🚀', 'success')
          }}
          currentUser={currentUser}
        />
      )}
      {showPostJob && (
        <PostJobModal
          onClose={() => setShowPostJob(false)}
          onSubmit={(job) => {
            setJobs(prev => [job, ...prev])
            setShowPostJob(false)
            showToast('המשרה פורסמה! 📢', 'success')
          }}
          currentUser={currentUser}
        />
      )}

      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Briefcase size={22} className="text-purple" />
              גיגים
            </h1>
            <p className="text-text-muted text-sm mt-1">מצא בעלי מקצוע או פרסם עבודה לקהילה</p>
          </div>
          <button
            onClick={() => mode === 'gigs' ? setShowPostGig(true) : setShowPostJob(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-brand-gradient rounded-xl text-sm font-semibold text-white hover:opacity-90 transition-opacity shadow-glow-sm active:scale-95"
          >
            <Plus size={15} />
            {mode === 'gigs' ? 'פרסם גיג' : 'פרסם עבודה'}
          </button>
        </div>
      </div>

      {/* Mode toggle */}
      <div className="flex gap-2 mb-6 p-1 bg-bg2 rounded-xl w-fit">
        <button
          onClick={() => setMode('gigs')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition-all
            ${mode === 'gigs' ? 'bg-bg1 text-text-primary shadow-surface' : 'text-text-muted hover:text-text-secondary'}`}
        >
          <Zap size={15} className={mode === 'gigs' ? 'text-purple' : ''} />
          מציעי שירות
          <span className="text-xs bg-purple/15 text-purple px-1.5 py-0.5 rounded-md">{gigs.length}</span>
        </button>
        <button
          onClick={() => setMode('jobs')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition-all
            ${mode === 'jobs' ? 'bg-bg1 text-text-primary shadow-surface' : 'text-text-muted hover:text-text-secondary'}`}
        >
          <Briefcase size={15} className={mode === 'jobs' ? 'text-purple' : ''} />
          עבודות פתוחות
          <span className="text-xs bg-pink/15 text-pink px-1.5 py-0.5 rounded-md">{jobs.length}</span>
        </button>
      </div>

      {/* Filters */}
      <div className="bg-bg1 rounded-2xl shadow-surface p-4 mb-6">
        <div className="flex gap-3 mb-4">
          <div className="flex-1 relative">
            <Search size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder={mode === 'gigs' ? 'חפש שירות, מיקס, ווקאל...' : 'חפש עבודה, פרויקט...'}
              className="w-full bg-bg3 border border-border rounded-xl pr-10 pl-4 py-2.5 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-purple transition-colors"
            />
          </div>
          {mode === 'gigs' && (
            <select
              value={sort}
              onChange={e => setSort(e.target.value as Sort)}
              className="bg-bg3 border border-border rounded-xl px-3 py-2 text-sm text-text-secondary focus:outline-none focus:border-purple cursor-pointer"
            >
              <option value="popular">הכי פופולרי</option>
              <option value="rating">דירוג</option>
              <option value="price-low">מחיר: נמוך לגבוה</option>
              <option value="price-high">מחיר: גבוה לנמוך</option>
            </select>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          {CATEGORIES.map(cat => (
            <button key={cat} onClick={() => setCategory(cat)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all
                ${category === cat ? 'bg-purple/20 border-purple text-purple' : 'bg-bg3 border-border text-text-secondary hover:border-purple/50'}`}>
              {cat !== 'הכל' && CAT_ICONS[cat]}
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      {mode === 'gigs'
        ? <GigsGrid gigs={filteredGigs} onSelect={setSelectedGig} />
        : <JobsList jobs={filteredJobs} onApply={setSelectedJob} onContact={setDmUserId} />
      }
    </div>
  )
}

// ─── Gigs Grid ────────────────────────────────────────────────────────────────

function GigsGrid({ gigs, onSelect }: { gigs: Gig[]; onSelect: (g: Gig) => void }) {
  if (gigs.length === 0)
    return <div className="text-center py-16"><Briefcase size={40} className="text-text-muted mx-auto mb-3" /><p className="text-text-muted">לא נמצאו שירותים</p></div>

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {gigs.map(gig => {
        const user = USERS.find(u => u.id === gig.userId)
        if (!user) return null
        return (
          <div key={gig.id} onClick={() => onSelect(gig)}
            className="bg-bg1 rounded-2xl shadow-surface hover:shadow-glow-sm transition-all group overflow-hidden flex flex-col cursor-pointer">
            {/* Banner */}
            <div className="h-24 relative overflow-hidden"
              style={{ background: 'linear-gradient(135deg, rgba(168,85,247,0.18), rgba(236,72,153,0.12))' }}>
              <div className="absolute inset-0 flex items-center justify-center opacity-15">
                <span className="text-purple" style={{ transform: 'scale(4)' }}>{CAT_ICONS[gig.category]}</span>
              </div>
              {gig.badge && (
                <span className={`absolute top-3 right-3 text-xs font-semibold px-2 py-0.5 rounded-full
                  ${gig.badge === 'Top Rated' ? 'bg-warning/20 text-warning border border-warning/30' : 'bg-purple/20 text-purple border border-purple/30'}`}>
                  {gig.badge === 'Top Rated' ? '⭐ Top Rated' : '✦ ' + gig.badge}
                </span>
              )}
            </div>

            <div className="p-4 flex flex-col flex-1">
              {/* User */}
              <div className="flex items-center gap-2.5 mb-3 -mt-8 relative">
                <div className="ring-2 ring-bg1 rounded-full" onClick={e => e.stopPropagation()}>
                  <Link href={`/profile/${user.id}`}><Avatar user={user} size="md" showOnline /></Link>
                </div>
                <div className="mt-6">
                  <div className="flex items-center gap-1">
                    <p className="text-sm font-semibold leading-tight">{user.name}</p>
                    {user.isVerified && <VerifiedBadge size={12} />}
                  </div>
                  <p className="text-xs text-text-muted">{user.role}</p>
                </div>
              </div>

              <h3 className="font-semibold text-sm leading-snug mb-2 group-hover:text-purple transition-colors line-clamp-2">{gig.title}</h3>
              <p className="text-xs text-text-muted leading-relaxed line-clamp-2 mb-3">{gig.desc}</p>

              <div className="flex flex-wrap gap-1.5 mb-4">
                {gig.tags.slice(0, 3).map(tag => (
                  <span key={tag} className="text-xs px-2 py-0.5 bg-bg3 border border-border rounded-md text-text-muted">{tag}</span>
                ))}
              </div>

              <div className="mt-auto">
                <div className="flex items-center gap-3 text-xs text-text-muted mb-3">
                  <span className="flex items-center gap-1">
                    <Star size={11} className="text-warning fill-warning" />
                    <span className="text-warning font-medium">{gig.rating}</span>
                    <span>({gig.reviews})</span>
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock size={11} />
                    {gig.delivery} ימים
                  </span>
                </div>
                <div className="flex items-center justify-between pt-3 border-t border-border">
                  <div>
                    <p className="text-xs text-text-muted">החל מ</p>
                    <p className="font-bold text-lg">₪{gig.price}</p>
                  </div>
                  <span className="px-4 py-2 bg-purple/15 border border-purple/30 text-purple text-sm font-semibold rounded-xl group-hover:bg-purple/25 transition-all">
                    פרטים
                  </span>
                </div>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ─── Jobs List ────────────────────────────────────────────────────────────────

function JobsList({ jobs, onApply, onContact }: { jobs: Job[]; onApply: (j: Job) => void; onContact: (uid: string) => void }) {
  if (jobs.length === 0)
    return <div className="text-center py-16"><Briefcase size={40} className="text-text-muted mx-auto mb-3" /><p className="text-text-muted">לא נמצאו עבודות</p></div>

  return (
    <div className="flex flex-col gap-4">
      {jobs.map(job => {
        const poster = USERS.find(u => u.id === job.userId)
        if (!poster) return null
        return (
          <div key={job.id} className="bg-bg1 rounded-2xl shadow-surface hover:shadow-glow-sm transition-all p-5 group">
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-2">
                  <span className="flex items-center gap-1 text-xs px-2 py-0.5 bg-bg3 border border-border rounded-lg text-text-muted">
                    {CAT_ICONS[job.category]}{job.category}
                  </span>
                  <span className="text-xs text-text-muted">{job.posted}</span>
                </div>
                <h3 className="font-semibold mb-2 group-hover:text-purple transition-colors">{job.title}</h3>
                <p className="text-sm text-text-muted leading-relaxed mb-3 line-clamp-2">{job.desc}</p>
                <div className="flex flex-wrap gap-1.5 mb-3">
                  {job.skills.map(skill => (
                    <span key={skill} className="text-xs px-2.5 py-1 bg-purple/10 border border-purple/20 text-purple rounded-lg">{skill}</span>
                  ))}
                </div>
                <div className="flex items-center gap-4 text-xs text-text-muted">
                  <button onClick={() => onContact(poster.id)} className="flex items-center gap-1.5 hover:text-text-primary transition-colors">
                    <Avatar user={poster} size="sm" />
                    {poster.name}
                  </button>
                  <span className="flex items-center gap-1"><Users size={11} />{job.proposals} הצעות</span>
                </div>
              </div>
              <div className="flex flex-col items-end gap-3 flex-shrink-0">
                <div className="text-right">
                  <p className="text-xs text-text-muted">{job.budgetType}</p>
                  <p className="font-bold text-lg">{job.budget}</p>
                </div>
                <button onClick={() => onApply(job)}
                  className="px-5 py-2.5 bg-brand-gradient rounded-xl text-sm font-semibold text-white hover:opacity-90 transition-opacity shadow-glow-sm active:scale-95">
                  הגש הצעה
                </button>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ─── Gig Detail Modal (Fiverr style) ─────────────────────────────────────────

type GigPackage = 'basic' | 'standard' | 'premium'

function GigDetailModal({ gig, onClose, onContact, onOrder }: {
  gig: Gig
  onClose: () => void
  onContact: (uid: string) => void
  onOrder: (title: string, price: number) => void
}) {
  const user = USERS.find(u => u.id === gig.userId)
  const [pkg, setPkg] = useState<GigPackage>('basic')
  if (!user) return null

  const pkgPrice  = pkg === 'basic' ? gig.price : pkg === 'standard' ? gig.priceStandard : gig.pricePremium
  const pkgDays   = pkg === 'basic' ? gig.delivery : pkg === 'standard' ? gig.deliveryStandard : gig.deliveryPremium

  const MOCK_REVIEWS = [
    { name: 'דנה מ.', rating: 5, text: 'עבודה מדהימה! מקצועי, מדויק, ועומד בזמנים. ממליצה בחום.', time: 'לפני שבוע' },
    { name: 'עמית כ.', rating: 5, text: 'תוצאה מצוינת. הסאונד יצא בדיוק כמו שרציתי.', time: 'לפני חודש' },
    { name: 'לירון ש.', rating: 4, text: 'שירות טוב, תקשורת מהירה. אחזור שוב.', time: 'לפני חודשיים' },
  ]

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[300] flex items-start justify-center p-4 overflow-y-auto modal-backdrop" onClick={onClose}>
      <div className="bg-bg1 rounded-2xl w-full max-w-3xl my-4 modal-card overflow-hidden"
        style={{ boxShadow: '0 0 0 1px rgba(255,255,255,0.07), 0 24px 80px rgba(0,0,0,0.9)' }}
        onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <span className="flex items-center gap-1.5 text-xs px-2.5 py-1 bg-bg3 border border-border rounded-lg text-text-muted">
            {CAT_ICONS[gig.category]}{gig.category}
          </span>
          <button onClick={onClose} className="p-2 text-text-muted hover:text-text-primary rounded-lg hover:bg-bg3 transition-all">
            <X size={16} />
          </button>
        </div>

        <div className="flex flex-col lg:flex-row gap-0">
          {/* Left: content */}
          <div className="flex-1 p-6 overflow-y-auto" style={{ maxHeight: '75vh' }}>

            {/* Title */}
            <h2 className="text-xl font-bold mb-4 leading-snug">{gig.title}</h2>

            {/* Seller */}
            <div className="flex items-center gap-3 mb-6 p-4 bg-bg2 rounded-xl">
              <Link href={`/profile/${user.id}`} onClick={onClose}>
                <Avatar user={user} size="lg" showOnline />
              </Link>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-0.5">
                  <Link href={`/profile/${user.id}`} onClick={onClose} className="font-semibold hover:text-purple transition-colors">
                    {user.name}
                  </Link>
                  {user.isVerified && <VerifiedBadge size={13} />}
                  {gig.badge && (
                    <span className="text-xs px-2 py-0.5 bg-purple/15 text-purple border border-purple/25 rounded-full">{gig.badge}</span>
                  )}
                </div>
                <p className="text-text-muted text-xs mb-2">{user.role} · {user.location}</p>
                <div className="flex items-center gap-4 text-xs text-text-muted">
                  <span className="flex items-center gap-1"><Star size={11} className="text-warning fill-warning" /><span className="text-warning font-medium">{gig.rating}</span> ({gig.reviews} ביקורות)</span>
                  <span className="flex items-center gap-1"><TrendingUp size={11} />{user.completionRate}% השלמה</span>
                </div>
              </div>
              <button onClick={() => onContact(user.id)}
                className="px-4 py-2 bg-bg3 border border-border rounded-xl text-sm text-text-secondary hover:text-purple hover:border-purple/40 transition-all flex-shrink-0">
                צור קשר
              </button>
            </div>

            {/* About */}
            <div className="mb-6">
              <h3 className="font-semibold mb-2 text-sm">על השירות</h3>
              <p className="text-text-muted text-sm leading-relaxed">{gig.longDesc}</p>
            </div>

            {/* What's included */}
            <div className="mb-6">
              <h3 className="font-semibold mb-3 text-sm">מה כלול</h3>
              <div className="grid grid-cols-1 gap-2">
                {gig.includes.map(item => (
                  <div key={item} className="flex items-center gap-2.5 text-sm">
                    <CheckCircle2 size={15} className="text-success flex-shrink-0" />
                    <span className="text-text-secondary">{item}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Tags */}
            <div className="mb-6">
              <h3 className="font-semibold mb-3 text-sm">תגיות</h3>
              <div className="flex flex-wrap gap-2">
                {gig.tags.map(tag => (
                  <span key={tag} className="text-xs px-3 py-1.5 bg-bg3 border border-border rounded-lg text-text-secondary">{tag}</span>
                ))}
              </div>
            </div>

            {/* Reviews */}
            <div>
              <h3 className="font-semibold mb-3 text-sm flex items-center gap-2">
                ביקורות
                <span className="flex items-center gap-1 text-warning text-xs">
                  <Star size={11} className="fill-warning" />{gig.rating} · {gig.reviews} ביקורות
                </span>
              </h3>
              <div className="space-y-3">
                {MOCK_REVIEWS.map((r, i) => (
                  <div key={i} className="p-4 bg-bg2 rounded-xl">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-purple/20 flex items-center justify-center text-xs text-purple font-semibold">{r.name[0]}</div>
                        <span className="text-sm font-medium">{r.name}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        {Array.from({ length: r.rating }).map((_, j) => <Star key={j} size={11} className="text-warning fill-warning" />)}
                        <span className="text-xs text-text-muted mr-1">{r.time}</span>
                      </div>
                    </div>
                    <p className="text-sm text-text-muted">{r.text}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right: order card */}
          <div className="lg:w-72 flex-shrink-0 p-6 border-t lg:border-t-0 lg:border-r border-border bg-bg2/50">

            {/* Package selector */}
            <div className="flex mb-4 bg-bg3 rounded-xl p-1 gap-1">
              {(['basic', 'standard', 'premium'] as GigPackage[]).map(p => (
                <button key={p} onClick={() => setPkg(p)}
                  className={`flex-1 py-1.5 rounded-lg text-xs font-medium transition-all
                    ${pkg === p ? 'bg-bg1 text-text-primary shadow-surface' : 'text-text-muted hover:text-text-secondary'}`}>
                  {p === 'basic' ? 'בסיסי' : p === 'standard' ? 'סטנדרט' : 'פרימיום'}
                </button>
              ))}
            </div>

            {/* Price */}
            <div className="mb-4">
              <p className="text-3xl font-bold mb-1">₪{pkgPrice}</p>
              <div className="flex items-center gap-3 text-xs text-text-muted">
                <span className="flex items-center gap-1"><Clock size={11} />מסירה תוך {pkgDays} ימים</span>
                {gig.revisions > 0 && <span className="flex items-center gap-1"><ArrowRight size={11} />{gig.revisions} תיקונים</span>}
              </div>
            </div>

            {/* Includes per package */}
            <div className="mb-5 space-y-2">
              {gig.includes.map((item, i) => {
                const included = pkg === 'premium' || (pkg === 'standard' && i < gig.includes.length - 1) || (pkg === 'basic' && i < Math.ceil(gig.includes.length / 2))
                return (
                  <div key={item} className={`flex items-center gap-2 text-xs ${included ? 'text-text-secondary' : 'text-text-muted opacity-50'}`}>
                    {included
                      ? <CheckCircle2 size={13} className="text-success flex-shrink-0" />
                      : <X size={13} className="text-text-muted flex-shrink-0" />
                    }
                    {item}
                  </div>
                )
              })}
            </div>

            {/* CTA buttons */}
            <button onClick={() => onOrder(gig.title, pkgPrice)}
              className="w-full py-3 bg-brand-gradient rounded-xl font-semibold text-white hover:opacity-90 active:scale-95 transition-all shadow-glow-sm mb-3">
              הזמן עכשיו · ₪{pkgPrice}
            </button>
            <button onClick={() => onContact(user.id)}
              className="w-full py-3 bg-bg3 border border-border rounded-xl font-medium text-text-secondary hover:text-text-primary hover:border-purple/30 active:scale-95 transition-all text-sm">
              שאל/י שאלה
            </button>

            {/* Trust signals */}
            <div className="mt-5 pt-4 border-t border-border space-y-2">
              {[
                { icon: <Shield size={13} />, text: 'תשלום מוגן' },
                { icon: <ArrowRight size={13} />, text: 'החזר כספי במידה ולא מסופק' },
                { icon: <CheckCircle2 size={13} />, text: `${user.completionRate}% שביעות רצון` },
              ].map(({ icon, text }) => (
                <div key={text} className="flex items-center gap-2 text-xs text-text-muted">
                  <span className="text-success">{icon}</span>{text}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Proposal Modal (Upwork style) ───────────────────────────────────────────

function ProposalModal({ job, onClose, onSubmit }: {
  job: Job
  onClose: () => void
  onSubmit: (jobTitle: string) => void
}) {
  const [bid, setBid] = useState('')
  const [delivery, setDelivery] = useState('')
  const [letter, setLetter] = useState('')
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)

  const canSubmit = bid.trim() && delivery.trim() && letter.trim().length >= 20

  const handleSubmit = () => {
    if (!canSubmit) return
    setLoading(true)
    setTimeout(() => { setLoading(false); setDone(true) }, 1600)
  }

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[300] flex items-center justify-center p-4 modal-backdrop" onClick={onClose}>
      <div className="bg-bg1 rounded-2xl w-full max-w-lg modal-card overflow-hidden"
        style={{ boxShadow: '0 0 0 1px rgba(255,255,255,0.07), 0 20px 64px rgba(0,0,0,0.9)' }}
        onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <div className="flex items-center gap-2">
            <Briefcase size={16} className="text-purple" />
            <p className="font-semibold text-sm">הגש הצעה</p>
          </div>
          <button onClick={onClose} className="p-1.5 text-text-muted hover:text-text-primary rounded-lg hover:bg-bg3 transition-all"><X size={16} /></button>
        </div>

        <div className="p-6">
          {done ? (
            <div className="text-center py-10">
              <div className="w-16 h-16 bg-success/15 rounded-full flex items-center justify-center mx-auto mb-4">
                <Check size={28} className="text-success" />
              </div>
              <p className="font-bold text-lg mb-1">ההצעה נשלחה!</p>
              <p className="text-text-muted text-sm">המעסיק יצור איתך קשר בהקדם</p>
              <button onClick={() => onSubmit(job.title)} className="mt-6 px-6 py-2.5 bg-brand-gradient rounded-xl text-sm font-semibold text-white hover:opacity-90 transition-opacity">
                סגור
              </button>
            </div>
          ) : (
            <>
              {/* Job summary */}
              <div className="p-4 bg-bg2 rounded-xl mb-5">
                <div className="flex items-center gap-1.5 text-xs text-text-muted mb-1">
                  {CAT_ICONS[job.category]}{job.category}
                </div>
                <p className="font-semibold text-sm mb-1">{job.title}</p>
                <p className="text-xs text-text-muted">תקציב: <span className="text-text-secondary font-medium">{job.budget}</span></p>
              </div>

              {/* Form */}
              <div className="space-y-4">
                <div className="flex gap-3">
                  <div className="flex-1">
                    <label className="text-xs text-text-muted mb-1.5 block">ההצעה שלך (₪)</label>
                    <input
                      value={bid} onChange={e => setBid(e.target.value.replace(/\D/g, ''))}
                      placeholder="לדוג׳ 500"
                      inputMode="numeric"
                      className="w-full bg-bg3 border border-border rounded-xl px-4 py-3 text-sm text-left focus:outline-none focus:border-purple transition-colors placeholder:text-text-muted"
                    />
                  </div>
                  <div className="flex-1">
                    <label className="text-xs text-text-muted mb-1.5 block">זמן אספקה (ימים)</label>
                    <input
                      value={delivery} onChange={e => setDelivery(e.target.value.replace(/\D/g, ''))}
                      placeholder="לדוג׳ 5"
                      inputMode="numeric"
                      className="w-full bg-bg3 border border-border rounded-xl px-4 py-3 text-sm text-left focus:outline-none focus:border-purple transition-colors placeholder:text-text-muted"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs text-text-muted mb-1.5 block">מכתב נלווה <span className="text-text-muted">(מינימום 20 תווים)</span></label>
                  <textarea
                    value={letter} onChange={e => setLetter(e.target.value)}
                    placeholder="ספר/י על הניסיון שלך הרלוונטי לעבודה זו, למה אתה/את הבחירה הנכונה..."
                    rows={5}
                    className="w-full bg-bg3 border border-border rounded-xl px-4 py-3 text-sm resize-none focus:outline-none focus:border-purple transition-colors placeholder:text-text-muted"
                  />
                  <p className={`text-xs mt-1 text-left ${letter.length >= 20 ? 'text-success' : 'text-text-muted'}`}>
                    {letter.length} / 20+ תווים
                  </p>
                </div>
              </div>

              <div className="flex gap-3 mt-5">
                <button onClick={onClose} className="flex-1 py-3 bg-bg3 border border-border rounded-xl text-sm font-medium text-text-secondary hover:text-text-primary transition-all">
                  ביטול
                </button>
                <button onClick={handleSubmit} disabled={!canSubmit || loading}
                  className="flex-1 py-3 bg-brand-gradient rounded-xl text-sm font-semibold text-white hover:opacity-90 active:scale-95 transition-all disabled:opacity-50 shadow-glow-sm flex items-center justify-center gap-2">
                  {loading ? <><Loader2 size={15} className="animate-spin" />שולח...</> : <><Send size={14} />שלח הצעה</>}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Post Gig Modal ───────────────────────────────────────────────────────────

function PostGigModal({ onClose, onSubmit, currentUser }: {
  onClose: () => void
  onSubmit: (gig: Gig) => void
  currentUser: User | null
}) {
  const [title, setTitle] = useState('')
  const [cat, setCat] = useState('')
  const [desc, setDesc] = useState('')
  const [price, setPrice] = useState('')
  const [days, setDays] = useState('')
  const [tagsInput, setTagsInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [step, setStep] = useState<1 | 2>(1)

  const canNext = title.trim().length >= 10 && cat && desc.trim().length >= 30
  const canSubmit = canNext && price && days

  const handleSubmit = () => {
    if (!canSubmit || !currentUser) return
    setLoading(true)
    setTimeout(() => {
      const newGig: Gig = {
        id: 'g-' + Date.now(),
        userId: currentUser.id,
        title: title.trim(),
        category: cat,
        desc: desc.trim().slice(0, 100),
        longDesc: desc.trim(),
        price: Number(price),
        priceStandard: Math.round(Number(price) * 1.6),
        pricePremium: Math.round(Number(price) * 2.6),
        delivery: Number(days),
        deliveryStandard: Number(days) + 2,
        deliveryPremium: Number(days) + 4,
        rating: 5.0,
        reviews: 0,
        revisions: 2,
        tags: tagsInput.split(',').map(t => t.trim()).filter(Boolean).slice(0, 5),
        badge: null,
        includes: ['שירות בסיסי', 'קובץ מסירה', 'תיקונים'],
      }
      onSubmit(newGig)
    }, 1400)
  }

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[300] flex items-center justify-center p-4 modal-backdrop" onClick={onClose}>
      <div className="bg-bg1 rounded-2xl w-full max-w-lg modal-card overflow-hidden"
        style={{ boxShadow: '0 0 0 1px rgba(255,255,255,0.07), 0 20px 64px rgba(0,0,0,0.9)' }}
        onClick={e => e.stopPropagation()}>

        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <div className="flex items-center gap-3">
            <Zap size={16} className="text-purple" />
            <p className="font-semibold text-sm">פרסם גיג חדש</p>
            <div className="flex items-center gap-1.5">
              <div className={`w-6 h-1.5 rounded-full ${step >= 1 ? 'bg-purple' : 'bg-bg3'}`} />
              <div className={`w-6 h-1.5 rounded-full ${step >= 2 ? 'bg-purple' : 'bg-bg3'}`} />
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 text-text-muted hover:text-text-primary rounded-lg hover:bg-bg3 transition-all"><X size={16} /></button>
        </div>

        <div className="p-6">
          {step === 1 ? (
            <div className="space-y-4">
              <p className="text-text-muted text-xs mb-2">שלב 1 מתוך 2 — פרטי השירות</p>
              <div>
                <label className="text-xs text-text-muted mb-1.5 block">כותרת הגיג</label>
                <input value={title} onChange={e => setTitle(e.target.value)} maxLength={80}
                  placeholder="לדוג׳: אמיקס ומאסטר מקצועי לשיר שלך"
                  className="w-full bg-bg3 border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-purple transition-colors placeholder:text-text-muted" />
                <p className="text-xs text-text-muted mt-1 text-left">{title.length}/80</p>
              </div>
              <div>
                <label className="text-xs text-text-muted mb-1.5 block">קטגוריה</label>
                <select value={cat} onChange={e => setCat(e.target.value)}
                  className="w-full bg-bg3 border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-purple transition-colors cursor-pointer">
                  <option value="">בחר קטגוריה...</option>
                  {CATEGORIES.filter(c => c !== 'הכל').map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs text-text-muted mb-1.5 block">תיאור השירות <span className="text-text-muted">(מינימום 30 תווים)</span></label>
                <textarea value={desc} onChange={e => setDesc(e.target.value)} rows={5}
                  placeholder="תאר את השירות שאתה מציע, הניסיון שלך, ומה הלקוח יקבל..."
                  className="w-full bg-bg3 border border-border rounded-xl px-4 py-3 text-sm resize-none focus:outline-none focus:border-purple transition-colors placeholder:text-text-muted" />
                <p className={`text-xs mt-1 text-left ${desc.length >= 30 ? 'text-success' : 'text-text-muted'}`}>{desc.length} / 30+ תווים</p>
              </div>
              <button onClick={() => setStep(2)} disabled={!canNext}
                className="w-full py-3 bg-brand-gradient rounded-xl font-semibold text-white hover:opacity-90 active:scale-95 disabled:opacity-50 transition-all shadow-glow-sm flex items-center justify-center gap-2">
                המשך <ChevronRight size={16} />
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-text-muted text-xs mb-2">שלב 2 מתוך 2 — תמחור ותגיות</p>
              <div className="flex gap-3">
                <div className="flex-1">
                  <label className="text-xs text-text-muted mb-1.5 block">מחיר התחלתי (₪)</label>
                  <input value={price} onChange={e => setPrice(e.target.value.replace(/\D/g, ''))}
                    placeholder="לדוג׳ 300" inputMode="numeric"
                    className="w-full bg-bg3 border border-border rounded-xl px-4 py-3 text-sm text-left focus:outline-none focus:border-purple transition-colors placeholder:text-text-muted" />
                </div>
                <div className="flex-1">
                  <label className="text-xs text-text-muted mb-1.5 block">זמן אספקה (ימים)</label>
                  <input value={days} onChange={e => setDays(e.target.value.replace(/\D/g, ''))}
                    placeholder="לדוג׳ 3" inputMode="numeric"
                    className="w-full bg-bg3 border border-border rounded-xl px-4 py-3 text-sm text-left focus:outline-none focus:border-purple transition-colors placeholder:text-text-muted" />
                </div>
              </div>
              <div>
                <label className="text-xs text-text-muted mb-1.5 block">תגיות <span className="text-text-muted">(מופרדות בפסיק, עד 5)</span></label>
                <input value={tagsInput} onChange={e => setTagsInput(e.target.value)}
                  placeholder="לדוג׳: מיקס, Pro Tools, Waves, סטרימינג"
                  className="w-full bg-bg3 border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-purple transition-colors placeholder:text-text-muted" />
                {tagsInput && (
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {tagsInput.split(',').map(t => t.trim()).filter(Boolean).slice(0, 5).map(t => (
                      <span key={t} className="text-xs px-2 py-0.5 bg-purple/10 border border-purple/20 text-purple rounded-md">{t}</span>
                    ))}
                  </div>
                )}
              </div>
              <div className="flex gap-3">
                <button onClick={() => setStep(1)} className="flex-1 py-3 bg-bg3 border border-border rounded-xl text-sm font-medium text-text-secondary hover:text-text-primary transition-all">
                  חזור
                </button>
                <button onClick={handleSubmit} disabled={!canSubmit || loading}
                  className="flex-1 py-3 bg-brand-gradient rounded-xl text-sm font-semibold text-white hover:opacity-90 active:scale-95 disabled:opacity-50 transition-all shadow-glow-sm flex items-center justify-center gap-2">
                  {loading ? <><Loader2 size={15} className="animate-spin" />מפרסם...</> : <><Zap size={14} />פרסם גיג</>}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Post Job Modal ───────────────────────────────────────────────────────────

function PostJobModal({ onClose, onSubmit, currentUser }: {
  onClose: () => void
  onSubmit: (job: Job) => void
  currentUser: User | null
}) {
  const [title, setTitle] = useState('')
  const [cat, setCat] = useState('')
  const [desc, setDesc] = useState('')
  const [budget, setBudget] = useState('')
  const [budgetType, setBudgetType] = useState('פרויקט')
  const [skillsInput, setSkillsInput] = useState('')
  const [loading, setLoading] = useState(false)

  const canSubmit = title.trim().length >= 10 && cat && desc.trim().length >= 30 && budget.trim()

  const handleSubmit = () => {
    if (!canSubmit || !currentUser) return
    setLoading(true)
    setTimeout(() => {
      const newJob: Job = {
        id: 'j-' + Date.now(),
        userId: currentUser.id,
        title: title.trim(),
        category: cat,
        desc: desc.trim(),
        budget: budget.includes('₪') ? budget : budget + ' ₪',
        budgetType,
        posted: 'עכשיו',
        proposals: 0,
        skills: skillsInput.split(',').map(s => s.trim()).filter(Boolean).slice(0, 5),
      }
      onSubmit(newJob)
    }, 1400)
  }

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[300] flex items-center justify-center p-4 modal-backdrop" onClick={onClose}>
      <div className="bg-bg1 rounded-2xl w-full max-w-lg modal-card overflow-hidden"
        style={{ boxShadow: '0 0 0 1px rgba(255,255,255,0.07), 0 20px 64px rgba(0,0,0,0.9)' }}
        onClick={e => e.stopPropagation()}>

        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <div className="flex items-center gap-2">
            <Briefcase size={16} className="text-purple" />
            <p className="font-semibold text-sm">פרסם עבודה</p>
          </div>
          <button onClick={onClose} className="p-1.5 text-text-muted hover:text-text-primary rounded-lg hover:bg-bg3 transition-all"><X size={16} /></button>
        </div>

        <div className="p-6 space-y-4">
          <div>
            <label className="text-xs text-text-muted mb-1.5 block">כותרת המשרה</label>
            <input value={title} onChange={e => setTitle(e.target.value)} maxLength={80}
              placeholder="לדוג׳: מחפש מפיק לסינגל פופ"
              className="w-full bg-bg3 border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-purple transition-colors placeholder:text-text-muted" />
          </div>
          <div>
            <label className="text-xs text-text-muted mb-1.5 block">קטגוריה</label>
            <select value={cat} onChange={e => setCat(e.target.value)}
              className="w-full bg-bg3 border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-purple transition-colors cursor-pointer">
              <option value="">בחר קטגוריה...</option>
              {CATEGORIES.filter(c => c !== 'הכל').map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs text-text-muted mb-1.5 block">תיאור המשרה</label>
            <textarea value={desc} onChange={e => setDesc(e.target.value)} rows={4}
              placeholder="תאר את הפרויקט, הסגנון המבוקש, ומה אתה מצפה לקבל..."
              className="w-full bg-bg3 border border-border rounded-xl px-4 py-3 text-sm resize-none focus:outline-none focus:border-purple transition-colors placeholder:text-text-muted" />
            <p className={`text-xs mt-1 text-left ${desc.length >= 30 ? 'text-success' : 'text-text-muted'}`}>{desc.length} / 30+ תווים</p>
          </div>
          <div className="flex gap-3">
            <div className="flex-1">
              <label className="text-xs text-text-muted mb-1.5 block">תקציב</label>
              <input value={budget} onChange={e => setBudget(e.target.value)}
                placeholder="לדוג׳: 500–1,000"
                className="w-full bg-bg3 border border-border rounded-xl px-4 py-3 text-sm text-left focus:outline-none focus:border-purple transition-colors placeholder:text-text-muted" />
            </div>
            <div className="w-36">
              <label className="text-xs text-text-muted mb-1.5 block">סוג</label>
              <select value={budgetType} onChange={e => setBudgetType(e.target.value)}
                className="w-full bg-bg3 border border-border rounded-xl px-3 py-3 text-sm focus:outline-none focus:border-purple transition-colors cursor-pointer">
                {['פרויקט', 'שעתי', 'חודשי', 'קבוע'].map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="text-xs text-text-muted mb-1.5 block">מיומנויות נדרשות <span className="text-text-muted">(מופרדות בפסיק)</span></label>
            <input value={skillsInput} onChange={e => setSkillsInput(e.target.value)}
              placeholder="לדוג׳: מיקס, Logic Pro, ווקאל"
              className="w-full bg-bg3 border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-purple transition-colors placeholder:text-text-muted" />
            {skillsInput && (
              <div className="flex flex-wrap gap-1.5 mt-2">
                {skillsInput.split(',').map(s => s.trim()).filter(Boolean).slice(0, 5).map(s => (
                  <span key={s} className="text-xs px-2 py-0.5 bg-purple/10 border border-purple/20 text-purple rounded-md">{s}</span>
                ))}
              </div>
            )}
          </div>
          <div className="flex gap-3 pt-1">
            <button onClick={onClose} className="flex-1 py-3 bg-bg3 border border-border rounded-xl text-sm font-medium text-text-secondary hover:text-text-primary transition-all">
              ביטול
            </button>
            <button onClick={handleSubmit} disabled={!canSubmit || loading}
              className="flex-1 py-3 bg-brand-gradient rounded-xl text-sm font-semibold text-white hover:opacity-90 active:scale-95 disabled:opacity-50 transition-all shadow-glow-sm flex items-center justify-center gap-2">
              {loading ? <><Loader2 size={15} className="animate-spin" />מפרסם...</> : <><Megaphone size={14} />פרסם עבודה</>}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
