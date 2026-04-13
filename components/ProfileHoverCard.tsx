'use client'
import { useState, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'
import Link from 'next/link'
import { getUserById } from '@/lib/data'
import Avatar from './Avatar'
import VerifiedBadge from './VerifiedBadge'
import { MapPin, Star, Music2 } from 'lucide-react'

interface Props {
  userId: string
  children: React.ReactNode
}

export default function ProfileHoverCard({ userId, children }: Props) {
  const [mounted, setMounted] = useState(false)
  const [show, setShow] = useState(false)
  const [pos, setPos] = useState({ top: 0, left: 0 })
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const containerRef = useRef<HTMLSpanElement>(null)
  const user = getUserById(userId)

  // Mark as mounted (client-only) so portal doesn't cause hydration mismatch
  useEffect(() => { setMounted(true) }, [])

  // Clean up timer on unmount
  useEffect(() => () => { if (timer.current) clearTimeout(timer.current) }, [])

  const open = () => {
    if (timer.current) clearTimeout(timer.current)
    timer.current = setTimeout(() => {
      if (!containerRef.current) return
      const rect = containerRef.current.getBoundingClientRect()
      const cardW = 256  // w-64
      const cardH = 260  // approximate card height
      const vw = window.innerWidth
      const vh = window.innerHeight
      const margin = 8

      // Horizontal: prefer aligning right edge with element (RTL), flip if would overflow
      let left = rect.right - cardW
      if (left < margin) left = rect.left  // flip to left-align
      left = Math.min(left, vw - cardW - margin)
      left = Math.max(left, margin)

      // Vertical: below by default, flip above if would overflow bottom
      let top = rect.bottom + 8
      if (top + cardH > vh - margin) top = rect.top - cardH - 8

      setPos({ top, left })
      setShow(true)
    }, 350)
  }

  const close = () => {
    if (timer.current) clearTimeout(timer.current)
    timer.current = setTimeout(() => setShow(false), 150)
  }

  if (!user) return <>{children}</>

  const card = show ? (
    <div
      className="fixed z-[9999] w-64 fade-in"
      style={{ top: pos.top, left: pos.left }}
      onMouseEnter={open}
      onMouseLeave={close}
    >
      <div className="bg-bg2 rounded-2xl p-4"
        style={{ boxShadow: '0 0 0 1px rgba(255,255,255,0.07), 0 16px 48px rgba(0,0,0,0.9)' }}>
        <div className="flex items-start gap-3 mb-3">
          <Avatar user={user} size="lg" showOnline />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <Link href={`/profile/${user.id}`}
                className="font-bold text-sm hover:text-purple transition-colors">
                {user.name}
              </Link>
              {user.isVerified && <VerifiedBadge size={14} />}
            </div>
            <span className="block text-text-muted text-xs mt-0.5">{user.role}</span>
            {user.location && (
              <span className="flex items-center gap-1 text-text-muted text-xs mt-1">
                <MapPin size={10} />
                {user.location}
              </span>
            )}
          </div>
        </div>

        <p className="text-text-secondary text-xs leading-relaxed mb-3 line-clamp-2">{user.bio}</p>

        <div className="grid grid-cols-3 gap-2 text-center mb-3">
          {[
            { label: 'שירים', val: user.songs, icon: <Music2 size={11} /> },
            { label: 'עוקבים', val: user.followers, icon: null },
            { label: 'דירוג', val: user.rating.toFixed(1), icon: <Star size={11} className="text-warning inline" /> },
          ].map(({ label, val, icon }) => (
            <div key={label} className="bg-bg3 rounded-xl py-2">
              <div className="flex items-center justify-center gap-0.5 font-bold text-sm">
                {icon}{val}
              </div>
              <span className="block text-text-muted text-xs">{label}</span>
            </div>
          ))}
        </div>

        <Link href={`/profile/${user.id}`}
          className="block py-2 bg-brand-gradient rounded-xl text-xs font-semibold text-white text-center hover:opacity-90 transition-opacity shadow-glow-sm">
          צפה בפרופיל
        </Link>
      </div>
    </div>
  ) : null

  return (
    <span ref={containerRef} className="relative inline-block" onMouseEnter={open} onMouseLeave={close}>
      {children}
      {mounted && createPortal(card, document.body)}
    </span>
  )
}
