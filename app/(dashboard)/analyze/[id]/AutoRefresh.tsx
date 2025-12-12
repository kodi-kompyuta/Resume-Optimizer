'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

interface AutoRefreshProps {
  resumeId: string
  status: string
}

export function AutoRefresh({ resumeId, status }: AutoRefreshProps) {
  const router = useRouter()
  const [attempts, setAttempts] = useState(0)
  const [isChecking, setIsChecking] = useState(false)
  const [lastCheck, setLastCheck] = useState<Date | null>(null)

  useEffect(() => {
    // Only poll if status is processing
    if (status !== 'processing') return

    let shouldContinue = true
    let intervalId: NodeJS.Timeout
    let checkingRef = false

    const checkStatus = async () => {
      if (checkingRef || !shouldContinue) return // Prevent overlapping requests

      checkingRef = true
      setIsChecking(true)
      setLastCheck(new Date())

      try {
        const response = await fetch(`/api/resume-status/${resumeId}`, {
          cache: 'no-store', // Don't cache status checks
        })

        if (response.ok) {
          const data = await response.json()
          console.log(`[AutoRefresh] Status check: ${data.status}`)

          if (data.status === 'completed' || data.status === 'failed') {
            // Analysis complete, navigate to same page to remount with new status
            console.log('[AutoRefresh] Analysis complete, reloading page...')
            shouldContinue = false
            if (intervalId) clearInterval(intervalId)
            // Use window.location.reload() to force a full reload instead of router.refresh()
            window.location.reload()
            return
          }

          setAttempts(prev => prev + 1)
        } else if (response.status === 404) {
          // Resume not found (possibly deleted), stop polling
          console.error('[AutoRefresh] Resume not found (404), stopping polling')
          shouldContinue = false
          if (intervalId) clearInterval(intervalId)
          // Redirect to upload page
          router.push('/upload')
          return
        } else {
          console.error('[AutoRefresh] Failed to check status:', response.statusText)
        }
      } catch (error) {
        console.error('[AutoRefresh] Error checking resume status:', error)
        // Continue polling even on error (network issues are temporary)
      } finally {
        checkingRef = false
        setIsChecking(false)
      }
    }

    // Check immediately on mount
    console.log('[AutoRefresh] Starting polling for resume:', resumeId)
    checkStatus()

    // Then poll every 3 seconds
    intervalId = setInterval(checkStatus, 3000)

    // Cleanup on unmount
    return () => {
      shouldContinue = false
      if (intervalId) clearInterval(intervalId)
      console.log('[AutoRefresh] Cleanup - stopped polling')
    }
  }, [resumeId, status, router])

  // Optional: render a small indicator (can be hidden with CSS if needed)
  if (process.env.NODE_ENV === 'development') {
    return (
      <div className="fixed bottom-4 right-4 bg-blue-100 border border-blue-300 rounded-lg px-3 py-2 text-xs text-blue-800 shadow-lg">
        <div className="flex items-center space-x-2">
          <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
          <span>Auto-checking... ({attempts} checks)</span>
        </div>
      </div>
    )
  }

  return null
}
