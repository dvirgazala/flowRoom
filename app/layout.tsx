import type { Metadata, Viewport } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'FlowRoom — הבית של יוצרי המוזיקה',
  description: 'פלטפורמה חברתית-מקצועית ליוצרים מוזיקליים',
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
}

const themeInitScript = `
(function(){try{
  var s=localStorage.getItem('flowroom-store');
  var t='light';
  if(s){var d=JSON.parse(s); if(d && d.state && d.state.theme) t=d.state.theme;}
  document.documentElement.setAttribute('data-theme',t);
}catch(e){document.documentElement.setAttribute('data-theme','light');}})();
`

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="he" dir="rtl" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body className="min-h-screen">{children}</body>
    </html>
  )
}
