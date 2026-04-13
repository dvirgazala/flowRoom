'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, Music2, Search, ShoppingBag, Briefcase } from 'lucide-react'

const NAV = [
  { href: '/feed',        label: 'פיד',     icon: Home },
  { href: '/rooms',       label: 'חדרים',   icon: Music2 },
  { href: '/discover',    label: 'גלה',     icon: Search },
  { href: '/marketplace', label: 'שוק',     icon: ShoppingBag },
  { href: '/gigs',        label: 'גיגים',   icon: Briefcase },
]

export default function BottomNav() {
  const pathname = usePathname()

  return (
    <nav
      className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-bg0/95 backdrop-blur-xl"
      style={{
        borderTop: '1px solid rgba(255,255,255,0.06)',
        boxShadow: '0 -1px 40px rgba(0,0,0,0.6)',
        paddingBottom: 'env(safe-area-inset-bottom)',
      }}
    >
      <div className="flex items-center justify-around h-16">
        {NAV.map(({ href, label, icon: Icon }) => {
          const active = pathname.startsWith(href)
          return (
            <Link
              key={href}
              href={href}
              className={`flex flex-col items-center gap-0.5 px-3 py-2 transition-all active:scale-90
                ${active ? 'text-purple' : 'text-text-muted'}`}
            >
              <div className={`p-1.5 rounded-xl transition-all ${active ? 'bg-purple/15' : ''}`}>
                <Icon size={21} strokeWidth={active ? 2.5 : 1.8} />
              </div>
              <span className="text-[10px] font-medium leading-none">{label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
