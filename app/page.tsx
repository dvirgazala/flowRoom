import { redirect } from 'next/navigation'

// Server component — no JS, no loops.
// Login page handles the "already logged in → /feed" redirect on the client.
export default function Home() {
  redirect('/login')
}
