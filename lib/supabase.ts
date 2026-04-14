'use client'
import { createClient } from '@supabase/supabase-js'

const url  = process.env.NEXT_PUBLIC_SUPABASE_URL  || 'https://placeholder.supabase.co'
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder'

if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
  console.warn('[supabase] env not set — demo mode (mock login only)')
}

export const supabase = createClient(url, anon, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
})

// Helper: upload file to a bucket and return public URL
export async function uploadFile(
  bucket: 'avatars' | 'covers' | 'post-media' | 'stems',
  path: string,
  file: File
): Promise<string | null> {
  const { error } = await supabase.storage.from(bucket).upload(path, file, {
    cacheControl: '3600',
    upsert: true,
  })
  if (error) {
    console.error('[uploadFile]', error)
    return null
  }
  const { data } = supabase.storage.from(bucket).getPublicUrl(path)
  return data.publicUrl
}
