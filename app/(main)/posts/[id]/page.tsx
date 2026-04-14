'use client'
import { use, useState } from 'react'
import Link from 'next/link'
import { useStore } from '@/lib/store'
import { getUserById } from '@/lib/data'
import Avatar from '@/components/Avatar'
import AudioPlayer from '@/components/AudioPlayer'
import VerifiedBadge from '@/components/VerifiedBadge'
import ProfileHoverCard from '@/components/ProfileHoverCard'
import { Heart, MessageCircle, Share2, Send, ThumbsUp, ThumbsDown, ArrowRight } from 'lucide-react'

export default function SinglePostPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const { posts, currentUser, users, likePost, addComment, likeComment, dislikeComment, showToast } = useStore()
  const post = posts.find(p => p.id === id)
  const user = currentUser || users[0]
  const [commentText, setCommentText] = useState('')

  if (!post) {
    return (
      <div className="max-w-2xl mx-auto px-4 pt-20 text-center">
        <h1 className="text-2xl font-bold mb-2">הפוסט לא נמצא</h1>
        <p className="text-text-muted mb-6">ייתכן שהפוסט נמחק או שהקישור שגוי</p>
        <Link href="/feed" className="inline-flex items-center gap-2 px-4 py-2 bg-brand-gradient rounded-xl text-sm font-semibold text-white">
          <ArrowRight size={16} /> חזרה לפיד
        </Link>
      </div>
    )
  }

  const author = getUserById(post.userId)
  if (!author) return null

  const allComments = [...(post.comments || [])].sort((a, b) => (b.likes || 0) - (a.likes || 0))

  const submitComment = () => {
    if (!commentText.trim()) return
    addComment(post.id, commentText.trim())
    setCommentText('')
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <Link href="/feed" className="inline-flex items-center gap-2 text-sm text-text-secondary hover:text-text-primary mb-4">
        <ArrowRight size={16} /> חזרה לפיד
      </Link>

      <div className="bg-bg1 rounded-2xl shadow-surface overflow-hidden">
        <div className="p-4">
          <div className="flex items-start gap-3 mb-3">
            <Link href={`/profile/${author.id}`}>
              <Avatar user={author} size="md" showOnline />
            </Link>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <ProfileHoverCard userId={author.id}>
                  <Link href={`/profile/${author.id}`} className="font-semibold text-sm hover:text-purple transition-colors">
                    {author.name}
                  </Link>
                </ProfileHoverCard>
                {author.isVerified && <VerifiedBadge size={14} />}
                <span className="text-text-muted text-xs">{author.role}</span>
                <span className="text-text-muted text-xs">·</span>
                <span className="text-text-muted text-xs">{post.createdAt}</span>
              </div>
            </div>
          </div>

          <p className="text-sm text-text-primary leading-relaxed mb-3 whitespace-pre-line">{post.content}</p>

          {post.audioUrl && (
            <div className="mb-3">
              <AudioPlayer url={post.audioUrl} duration={post.audioDuration} />
            </div>
          )}

          <div className="flex items-center gap-5 pt-2 border-t border-border/50">
            <button onClick={() => likePost(post.id)}
              className={`flex items-center gap-1.5 text-xs transition-all active:scale-90 py-2
                ${post.isLiked ? 'text-pink' : 'text-text-muted hover:text-pink'}`}>
              <Heart size={17} fill={post.isLiked ? 'currentColor' : 'none'} />
              <span>{post.likes}</span>
            </button>
            <div className="flex items-center gap-1.5 text-xs text-text-muted py-2">
              <MessageCircle size={17} />
              <span>{allComments.length}</span>
            </div>
            <button onClick={() => { navigator.clipboard?.writeText(window.location.href); showToast('הקישור הועתק', 'info') }}
              className="flex items-center gap-1.5 text-xs text-text-muted hover:text-success active:scale-95 transition-all py-2">
              <Share2 size={17} /> שתף
            </button>
          </div>
        </div>

        {allComments.length > 0 && (
          <div className="border-t border-border/40 bg-bg2/40 px-4 pt-3 pb-2 space-y-2.5">
            {allComments.map(c => {
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
                        <Link href={`/profile/${cu.id}`} className="text-xs font-semibold text-text-primary hover:text-purple transition-colors ml-2">
                          {cu.name}
                        </Link>
                      </ProfileHoverCard>
                      <span className="text-xs text-text-secondary">{c.text}</span>
                    </div>
                    <div className="flex items-center gap-3 mt-1 px-1">
                      <button onClick={() => likeComment(post.id, c.id)}
                        className="flex items-center gap-1 text-xs text-text-muted hover:text-success transition-all active:scale-90">
                        <ThumbsUp size={11} /> {c.likes || 0}
                      </button>
                      <button onClick={() => dislikeComment(post.id, c.id)}
                        className="flex items-center gap-1 text-xs text-text-muted hover:text-danger transition-all active:scale-90">
                        <ThumbsDown size={11} /> {c.dislikes || 0}
                      </button>
                      <span className="text-xs text-text-muted">{c.createdAt}</span>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        <div className="border-t border-border/40 bg-bg2/20 px-4 py-3 flex items-center gap-2">
          <Avatar user={user} size="sm" />
          <input
            value={commentText}
            onChange={e => setCommentText(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && submitComment()}
            placeholder="הוסף תגובה..."
            className="flex-1 bg-bg3 border border-border/60 rounded-xl px-3 py-2.5 text-xs text-text-primary placeholder:text-text-muted focus:outline-none focus:border-purple transition-colors"
          />
          <button onClick={submitComment}
            className="p-2.5 bg-purple/20 hover:bg-purple/35 active:scale-90 rounded-lg transition-all">
            <Send size={13} className="text-purple" />
          </button>
        </div>
      </div>
    </div>
  )
}
