import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const adminClient = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

export async function POST(req: NextRequest) {
  try {
    const { userId } = await req.json()
    if (!userId) return NextResponse.json({ error: 'missing userId' }, { status: 400 })

    // Get user email from auth
    const { data: user, error: getErr } = await adminClient.auth.admin.getUserById(userId)
    if (getErr || !user?.user?.email) {
      return NextResponse.json({ error: 'user not found' }, { status: 404 })
    }

    // Send password reset email
    const { error } = await adminClient.auth.resetPasswordForEmail(user.user.email, {
      redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL ?? 'https://flowroom.onrender.com'}/reset-password`,
    })
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    return NextResponse.json({ ok: true })
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
