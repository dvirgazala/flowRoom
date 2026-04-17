import Navbar from '@/components/Navbar'
import BottomNav from '@/components/BottomNav'
import Toast from '@/components/Toast'
import ThemeApplier from '@/components/ThemeApplier'
import SupabaseProvider from '@/components/SupabaseProvider'

export default function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <SupabaseProvider>
      <div className="min-h-screen bg-bg0 relative">
        {/* Ambient background glows */}
        <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
          <div className="absolute -top-60 -right-60 w-[600px] h-[600px] bg-purple/5 rounded-full blur-3xl" />
          <div className="absolute top-1/2 -left-40 w-96 h-96 bg-pink/4 rounded-full blur-3xl" />
        </div>
        <div className="relative z-10">
          <Navbar />
          <main className="pt-16 pb-mobile-nav md:pb-0">{children}</main>
        </div>
        <BottomNav />
        <Toast />
        <ThemeApplier />
      </div>
    </SupabaseProvider>
  )
}
