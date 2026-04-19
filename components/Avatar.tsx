'use client'
import { useState } from 'react'
import type { User } from '@/lib/types'

interface Props {
  user: User
  size?: 'sm' | 'md' | 'lg' | 'xl'
  showOnline?: boolean
}

const sizes = { sm: 'w-8 h-8 text-xs', md: 'w-10 h-10 text-sm', lg: 'w-14 h-14 text-base', xl: 'w-20 h-20 text-2xl' }
const dotSizes = { sm: 'w-2 h-2', md: 'w-2.5 h-2.5', lg: 'w-3.5 h-3.5', xl: 'w-4 h-4' }
const imgSizes = { sm: 32, md: 40, lg: 56, xl: 80 }

// Consistent photo per user ID
const PHOTO_MAP: Record<string, string> = {
  u1:  'https://i.pravatar.cc/150?img=3',
  u2:  'https://i.pravatar.cc/150?img=15',
  u3:  'https://i.pravatar.cc/150?img=47',
  u4:  'https://i.pravatar.cc/150?img=12',
  u5:  'https://i.pravatar.cc/150?img=44',
  u6:  'https://i.pravatar.cc/150?img=8',
  u7:  'https://i.pravatar.cc/150?img=56',
  u8:  'https://i.pravatar.cc/150?img=21',
  u9:  'https://i.pravatar.cc/150?img=38',
  u10: 'https://i.pravatar.cc/150?img=52',
  u11: 'https://i.pravatar.cc/150?img=60',
  u12: 'https://i.pravatar.cc/150?img=25',
}

export default function Avatar({ user, size = 'md', showOnline = false }: Props) {
  const [imgFailed, setImgFailed] = useState(false)
  const photoUrl = user.avatarUrl || PHOTO_MAP[user.id]
  const px = imgSizes[size]

  return (
    <div className="relative inline-flex flex-shrink-0">
      {photoUrl && !imgFailed ? (
        <img
          src={photoUrl}
          alt={user.name}
          width={px}
          height={px}
          className={`${sizes[size]} rounded-full object-cover ring-2 ring-bg1`}
          onError={() => setImgFailed(true)}
        />
      ) : (
        <div className={`${sizes[size]} rounded-full bg-gradient-to-br ${user.avatarColor} flex items-center justify-center font-bold text-white`}>
          {user.initials}
        </div>
      )}
      {showOnline && (
        <span className={`absolute bottom-0 left-0 ${dotSizes[size]} rounded-full border-2 border-bg0 ${user.isOnline ? 'bg-success' : 'bg-text-muted'}`} />
      )}
    </div>
  )
}
