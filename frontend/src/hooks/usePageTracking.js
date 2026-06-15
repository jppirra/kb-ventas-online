import { useEffect, useRef } from 'react'
import { useLocation } from 'react-router-dom'
import { track } from '../utils/track'

export function usePageTracking() {
  const location = useLocation()
  const startRef = useRef(Date.now())
  const prevPathRef = useRef(null)

  useEffect(() => {
    const prevPath = prevPathRef.current
    const now = Date.now()

    if (prevPath !== null) {
      track('PAGE_LEAVE', { page: prevPath, durationMs: now - startRef.current })
    }

    startRef.current = now
    prevPathRef.current = location.pathname
    track('PAGE_VIEW', { page: location.pathname })
  }, [location.pathname])
}
