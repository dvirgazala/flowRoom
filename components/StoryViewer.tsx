'use client'
import { useEffect, useRef, useState, useCallback } from 'react'
import { X, ChevronRight, ChevronLeft, Eye, Trash2 } from 'lucide-react'
import type { StoryWithAuthor } from '@/lib/supabase-types'
import { markStoryViewed, deleteStory } from '@/lib/db'
import Avatar from './Avatar'
import { profileToUser } from '@/lib/profile-utils'
import { relativeTime } from '@/lib/profile-utils'

// Group stories by user
export interface StoryGroup {
  userId: string
  userName: string
  userAvatar?: string
  stories: StoryWithAuthor[]
}

interface Props {
  groups: StoryGroup[]
  startGroupIndex: number
  myUserId: string
  onClose: () => void
  onStoryDeleted?: (storyId: string) => void
}

const STORY_DURATION = 5000

export default function StoryViewer({ groups, startGroupIndex, myUserId, onClose, onStoryDeleted }: Props) {
  const [groupIdx, setGroupIdx] = useState(startGroupIndex)
  const [storyIdx, setStoryIdx] = useState(0)
  const [progress, setProgress] = useState(0)
  const [paused, setPaused] = useState(false)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const startRef = useRef(Date.now())
  const elapsedRef = useRef(0)

  const group = groups[groupIdx]
  const story = group?.stories[storyIdx]
  const isMyStory = story?.user_id === myUserId

  const goNext = useCallback(() => {
    if (!group) return
    if (storyIdx < group.stories.length - 1) {
      setStoryIdx(i => i + 1)
      setProgress(0)
      elapsedRef.current = 0
    } else if (groupIdx < groups.length - 1) {
      setGroupIdx(i => i + 1)
      setStoryIdx(0)
      setProgress(0)
      elapsedRef.current = 0
    } else {
      onClose()
    }
  }, [group, storyIdx, groupIdx, groups.length, onClose])

  const goPrev = useCallback(() => {
    if (storyIdx > 0) {
      setStoryIdx(i => i - 1)
      setProgress(0)
      elapsedRef.current = 0
    } else if (groupIdx > 0) {
      setGroupIdx(i => i - 1)
      setStoryIdx(0)
      setProgress(0)
      elapsedRef.current = 0
    }
  }, [storyIdx, groupIdx])

  // Mark viewed
  useEffect(() => {
    if (story && !story.viewed_by_me && story.user_id !== myUserId) {
      markStoryViewed(story.id)
    }
  }, [story, myUserId])

  // Progress timer
  useEffect(() => {
    if (paused) return
    startRef.current = Date.now() - elapsedRef.current
    timerRef.current = setInterval(() => {
      const elapsed = Date.now() - startRef.current
      elapsedRef.current = elapsed
      const pct = Math.min((elapsed / STORY_DURATION) * 100, 100)
      setProgress(pct)
      if (elapsed >= STORY_DURATION) {
        clearInterval(timerRef.current!)
        goNext()
      }
    }, 50)
    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  }, [storyIdx, groupIdx, paused, goNext])

  // Keyboard navigation
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
        e.key === 'ArrowRight' ? goPrev() : goNext()
      }
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [goNext, goPrev, onClose])

  const handleDelete = async () => {
    if (!story) return
    await deleteStory(story.id)
    onStoryDeleted?.(story.id)
    goNext()
  }

  if (!group || !story) return null
  const user = profileToUser(group.stories[0].author)

  return (
    <div className="fixed inset-0 z-[200] bg-black flex items-center justify-center" onClick={onClose}>
      <div className="relative w-full h-full max-w-sm mx-auto" onClick={e => e.stopPropagation()}>

        {/* Progress bars */}
        <div className="absolute top-0 inset-x-0 z-10 flex gap-1 p-3 pt-safe">
          {group.stories.map((_, i) => (
            <div key={i} className="flex-1 h-0.5 bg-white/30 rounded-full overflow-hidden">
              <div
                className="h-full bg-white rounded-full transition-none"
                style={{ width: i < storyIdx ? '100%' : i === storyIdx ? `${progress}%` : '0%' }}
              />
            </div>
          ))}
        </div>

        {/* Header */}
        <div className="absolute top-6 inset-x-0 z-10 flex items-center gap-3 px-4">
          <div className="w-9 h-9 rounded-full ring-2 ring-white/60 overflow-hidden flex-shrink-0">
            {user.avatarUrl
              ? <img src={user.avatarUrl} alt="" className="w-full h-full object-cover" />
              : <Avatar user={user} size="sm" />
            }
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white text-sm font-semibold leading-tight truncate">{user.name}</p>
            <p className="text-white/60 text-xs">{relativeTime(story.created_at)}</p>
          </div>
          {isMyStory && (
            <div className="flex items-center gap-1 text-white/70 text-xs">
              <Eye size={13} />
              <span>{story.view_count}</span>
            </div>
          )}
          {isMyStory && (
            <button onClick={handleDelete} className="p-1.5 rounded-full bg-black/30 text-white/80 hover:text-danger transition-colors">
              <Trash2 size={15} />
            </button>
          )}
          <button onClick={onClose} className="p-1.5 rounded-full bg-black/30 text-white transition-colors">
            <X size={18} />
          </button>
        </div>

        {/* Story image */}
        <div className="w-full h-full bg-black"
          onMouseDown={() => { setPaused(true); elapsedRef.current = Date.now() - startRef.current }}
          onMouseUp={() => setPaused(false)}
          onTouchStart={() => { setPaused(true); elapsedRef.current = Date.now() - startRef.current }}
          onTouchEnd={() => setPaused(false)}
        >
          <img
            src={story.media_url}
            alt=""
            className="w-full h-full object-contain"
            draggable={false}
          />
        </div>

        {/* Text overlay */}
        {story.text_overlay && (
          <div className="absolute bottom-24 inset-x-0 flex justify-center px-6 z-10">
            <div className="bg-black/60 backdrop-blur-sm rounded-2xl px-5 py-3 max-w-xs text-center">
              <p className="text-white text-base font-medium leading-snug">{story.text_overlay}</p>
            </div>
          </div>
        )}

        {/* Tap zones */}
        <button onClick={goPrev}
          className="absolute right-0 top-16 bottom-0 w-1/3 z-10 flex items-center justify-start pl-2"
          aria-label="הקודם">
          {(storyIdx > 0 || groupIdx > 0) && <ChevronRight size={28} className="text-white/50" />}
        </button>
        <button onClick={goNext}
          className="absolute left-0 top-16 bottom-0 w-1/3 z-10 flex items-center justify-end pr-2"
          aria-label="הבא">
          <ChevronLeft size={28} className="text-white/50" />
        </button>

        {/* Group navigation dots */}
        {groups.length > 1 && (
          <div className="absolute bottom-6 inset-x-0 flex justify-center gap-1.5 z-10">
            {groups.map((_, i) => (
              <button key={i} onClick={() => { setGroupIdx(i); setStoryIdx(0); setProgress(0); elapsedRef.current = 0 }}
                className={`w-1.5 h-1.5 rounded-full transition-all ${i === groupIdx ? 'bg-white scale-125' : 'bg-white/40'}`} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
