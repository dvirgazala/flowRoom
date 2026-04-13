'use client'
import { useEffect } from 'react'
import { useStore } from '@/lib/store'

export default function ThemeApplier() {
  const { theme } = useStore()

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
  }, [theme])

  return null
}
