'use client'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

interface AutoRefreshProps {
  children: React.ReactNode
  interval?: number
}

export default function AutoRefresh({ children, interval = 5000 }: AutoRefreshProps) {
  const router = useRouter()

  useEffect(() => {
    const id = setInterval(() => router.refresh(), interval)
    return () => clearInterval(id)
  }, [router, interval])

  return <>{children}</>
}
