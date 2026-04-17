'use client'
import { useEffect, useRef } from 'react'
import { useStore } from '@/lib/store'

export default function ThemeApplier() {
  const theme = useStore(s => s.theme)
  const firstRun = useRef(true)

  useEffect(() => {
    const html = document.documentElement
    const current = html.getAttribute('data-theme')
    if (current === theme) {
      firstRun.current = false
      return
    }
    if (firstRun.current) {
      html.setAttribute('data-theme', theme)
      firstRun.current = false
      return
    }
    html.classList.add('theme-switching')
    html.setAttribute('data-theme', theme)
    const t = window.setTimeout(() => html.classList.remove('theme-switching'), 260)
    return () => window.clearTimeout(t)
  }, [theme])

  return null
}
