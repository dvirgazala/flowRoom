import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'FlowRoom — הבית של יוצרי המוזיקה',
  description: 'פלטפורמה חברתית-מקצועית ליוצרים מוזיקליים',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="he" dir="rtl">
      <body className="min-h-screen">{children}</body>
    </html>
  )
}
