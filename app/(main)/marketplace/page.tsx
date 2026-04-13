'use client'
import { useState, useMemo } from 'react'
import Link from 'next/link'
import { useStore } from '@/lib/store'
import { PRODUCTS, getUserById } from '@/lib/data'
import Avatar from '@/components/Avatar'
import AudioPlayer from '@/components/AudioPlayer'
import PaymentModal from '@/components/PaymentModal'
import { ShoppingBag, Star, Search, Crown, Zap, Filter, Music2, Mic2, FileText, BookOpen, Wand2, Megaphone } from 'lucide-react'

const TYPE_ICONS: Record<string, React.ReactNode> = {
  'ביט': <Music2 size={14} />,
  'מיקס': <Wand2 size={14} />,
  'מילים': <FileText size={14} />,
  'קורס': <BookOpen size={14} />,
  'מאסטר': <Zap size={14} />,
  'שיווק': <Megaphone size={14} />,
  'פרימיום': <Crown size={14} />,
}

const TYPES = ['הכל', 'ביט', 'מיקס', 'מילים', 'קורס', 'מאסטר', 'שיווק', 'פרימיום']

export default function MarketplacePage() {
  const { showToast } = useStore()
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState('הכל')
  const [sortBy, setSortBy] = useState<'popular' | 'price-low' | 'price-high' | 'rating'>('popular')
  const [payProduct, setPayProduct] = useState<{ title: string; price: number } | null>(null)

  const filtered = useMemo(() => {
    let list = PRODUCTS
    if (search.trim()) {
      const q = search.toLowerCase()
      list = list.filter(p => p.title.toLowerCase().includes(q) || p.description.toLowerCase().includes(q))
    }
    if (typeFilter !== 'הכל') {
      list = list.filter(p => p.type === typeFilter)
    }
    return [...list].sort((a, b) => {
      if (sortBy === 'popular') return b.sales - a.sales
      if (sortBy === 'price-low') return a.price - b.price
      if (sortBy === 'price-high') return b.price - a.price
      return b.rating - a.rating
    })
  }, [search, typeFilter, sortBy])

  const premiumProducts = PRODUCTS.filter(p => p.isPremium)
  const regularProducts = filtered.filter(p => !p.isPremium)

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      {payProduct && (
        <PaymentModal
          productTitle={payProduct.title}
          productPrice={payProduct.price}
          onClose={() => setPayProduct(null)}
          onSuccess={() => { setPayProduct(null); showToast(`"${payProduct.title}" נרכש בהצלחה! 🎉`, 'success') }}
        />
      )}
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold">שוק יוצרים</h1>
        <p className="text-text-muted text-sm mt-1">ביטים, שירותי מיקס, קורסים וכלים מקצועיים</p>
      </div>

      {/* Premium banner */}
      <div className="relative overflow-hidden bg-bg1 rounded-2xl p-6 mb-8"
        style={{ background: 'linear-gradient(135deg, rgba(168,85,247,0.15), rgba(236,72,153,0.08))', boxShadow: '0 0 0 1px rgba(168,85,247,0.2), 0 8px 48px rgba(0,0,0,0.7), inset 0 1px 0 rgba(168,85,247,0.1)' }}>
        <div className="absolute -top-8 -left-8 w-32 h-32 bg-purple/20 rounded-full blur-2xl" />
        <div className="absolute -bottom-8 -right-8 w-32 h-32 bg-pink/15 rounded-full blur-2xl" />
        <div className="relative flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-brand-gradient rounded-2xl flex items-center justify-center shadow-glow">
              <Crown size={22} className="text-white" />
            </div>
            <div>
              <h2 className="font-bold text-lg grad-text">FlowRoom Pro</h2>
              <p className="text-text-secondary text-sm">גישה ללא הגבלה לכל הכלים, ביטים, ומשאבים</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-center">
              <p className="text-2xl font-bold">₪49</p>
              <p className="text-text-muted text-xs">לחודש</p>
            </div>
            <button onClick={() => showToast('ברוכים הבאים ל-Pro! 🎉', 'success')}
              className="px-6 py-3 bg-brand-gradient rounded-xl font-semibold text-white hover:opacity-90 transition-opacity shadow-glow-sm">
              שדרג עכשיו
            </button>
          </div>
        </div>
        <div className="relative flex gap-6 mt-4 text-xs text-text-secondary flex-wrap">
          {['✓ ביטים ללא הגבלה', '✓ מיקס AI', '✓ הפצה לכל הפלטפורמות', '✓ ניתוח קהל מתקדם', '✓ תמיכה עדיפותית'].map(f => (
            <span key={f}>{f}</span>
          ))}
        </div>
      </div>

      {/* Filters */}
      <div className="bg-bg1 rounded-2xl shadow-surface p-4 mb-6">
        <div className="flex gap-3 mb-4">
          <div className="flex-1 relative">
            <Search size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted" />
            <input
              value={search} onChange={e => setSearch(e.target.value)}
              placeholder="חפש ביטים, שירותים, קורסים..."
              className="w-full bg-bg3 border border-border rounded-xl pr-10 pl-4 py-2.5 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-purple transition-colors"
            />
          </div>
          <select
            value={sortBy}
            onChange={e => setSortBy(e.target.value as typeof sortBy)}
            className="bg-bg3 border border-border rounded-xl px-3 py-2 text-sm text-text-secondary focus:outline-none focus:border-purple cursor-pointer"
          >
            <option value="popular">פופולרי</option>
            <option value="price-low">מחיר: נמוך לגבוה</option>
            <option value="price-high">מחיר: גבוה לנמוך</option>
            <option value="rating">דירוג</option>
          </select>
        </div>

        <div className="flex flex-wrap gap-2">
          {TYPES.map(t => (
            <button key={t} onClick={() => setTypeFilter(t)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all
                ${typeFilter === t ? 'bg-purple/20 border-purple text-purple' : 'bg-bg3 border-border text-text-secondary hover:border-purple/50'}`}>
              {t !== 'הכל' && TYPE_ICONS[t]}
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* Products grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map(product => {
          const seller = getUserById(product.sellerId)
          if (!seller) return null

          return (
            <div key={product.id} className={`bg-bg1 rounded-2xl overflow-hidden transition-all group
              ${product.isPremium ? 'shadow-glow-sm hover:shadow-glow' : 'shadow-surface hover:shadow-glow-sm'}`}
              style={product.isPremium ? { boxShadow: '0 0 0 1px rgba(168,85,247,0.25), 0 4px 32px rgba(0,0,0,0.6), inset 0 1px 0 rgba(168,85,247,0.08)' } : undefined}>
              {/* Header */}
              <div className={`p-4 ${product.isPremium ? 'bg-gradient-to-br from-purple/15 to-pink/8' : ''}`}>
                <div className="flex items-start justify-between mb-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center
                    ${product.isPremium ? 'bg-brand-gradient shadow-glow-sm' : 'bg-bg3 border border-border'}`}>
                    <span className={product.isPremium ? 'text-white' : 'text-purple'}>
                      {TYPE_ICONS[product.type] || <Music2 size={14} />}
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    {product.isPremium && (
                      <span className="flex items-center gap-1 text-xs px-2 py-0.5 bg-purple/15 text-purple border border-purple/25 rounded-lg">
                        <Crown size={10} />
                        Pro
                      </span>
                    )}
                    <span className="text-xs px-2 py-0.5 bg-bg3 text-text-muted border border-border rounded-lg">
                      {product.type}
                    </span>
                  </div>
                </div>

                <h3 className="font-semibold mb-1 group-hover:text-purple transition-colors">{product.title}</h3>
                <p className="text-text-muted text-xs leading-relaxed line-clamp-2">{product.description}</p>

                {/* Audio preview */}
                {product.audioUrl && (
                  <div className="mt-3">
                    <AudioPlayer url={product.audioUrl} compact />
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="px-4 py-3 border-t border-border flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Link href={`/profile/${seller.id}`}>
                    <Avatar user={seller} size="sm" />
                  </Link>
                  <div>
                    <p className="text-xs font-medium">{seller.name}</p>
                    <div className="flex items-center gap-1">
                      <Star size={10} className="text-warning fill-warning" />
                      <span className="text-xs text-warning">{product.rating}</span>
                      <span className="text-xs text-text-muted">({product.sales})</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-lg">₪{product.price}</span>
                  <button onClick={() => setPayProduct({ title: product.title, price: product.price })}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all hover:opacity-90 active:scale-95
                      ${product.isPremium ? 'bg-brand-gradient text-white shadow-glow-sm' : 'bg-purple/15 border border-purple/30 text-purple hover:bg-purple/25'}`}>
                    קנה
                  </button>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-16">
          <ShoppingBag size={40} className="text-text-muted mx-auto mb-3" />
          <p className="text-text-muted">לא נמצאו מוצרים</p>
          <button onClick={() => { setSearch(''); setTypeFilter('הכל') }}
            className="mt-3 text-purple text-sm hover:underline">נקה חיפוש</button>
        </div>
      )}
    </div>
  )
}
