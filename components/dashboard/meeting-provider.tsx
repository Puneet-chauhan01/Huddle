"use client"

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import {
  upcomingMeetings as initialUpcoming,
  recentMeetings as initialRecent,
  UpcomingMeeting,
  RecentMeeting,
  formatBackendToUpcoming,
  formatBackendToRecent,
} from '@/lib/meetings'
import { api } from '@/lib/api'

interface MeetingContextType {
  upcomingMeetings: UpcomingMeeting[]
  recentMeetings: RecentMeeting[]
  isLoading: boolean
  error: string | null
  refreshMeetings: () => Promise<void>
  addMeeting: (meeting: UpcomingMeeting) => void
}

const MeetingContext = createContext<MeetingContextType | undefined>(undefined)

export function MeetingProvider({ children }: { children: React.ReactNode }) {
  const [upcomingMeetings, setUpcomingMeetings] = useState<UpcomingMeeting[]>(initialUpcoming)
  const [recentMeetings, setRecentMeetings] = useState<RecentMeeting[]>(initialRecent)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refreshMeetings = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)
      const [backendUpcoming, backendRecent] = await Promise.allSettled([
        api.getUpcomingMeetings(),
        api.getRecentMeetings(),
      ])

      if (backendUpcoming.status === 'fulfilled') {
        setUpcomingMeetings(backendUpcoming.value.map(formatBackendToUpcoming))
      } else {
        console.warn('Could not fetch upcoming meetings from backend:', backendUpcoming.reason)
      }

      if (backendRecent.status === 'fulfilled') {
        setRecentMeetings(backendRecent.value.map(formatBackendToRecent))
      } else {
        console.warn('Could not fetch recent meetings from backend:', backendRecent.reason)
      }

      if (backendUpcoming.status === 'rejected' && backendRecent.status === 'rejected') {
        setError('Unable to connect to backend server. Showing cached meetings.')
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to sync meetings')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    refreshMeetings()
  }, [refreshMeetings])

  const addMeeting = (meeting: UpcomingMeeting) => {
    setUpcomingMeetings((prev) => [meeting, ...prev])
  }

  return (
    <MeetingContext.Provider
      value={{
        upcomingMeetings,
        recentMeetings,
        isLoading,
        error,
        refreshMeetings,
        addMeeting,
      }}
    >
      {children}
    </MeetingContext.Provider>
  )
}

export function useMeetingContext() {
  const context = useContext(MeetingContext)
  if (!context) {
    throw new Error('useMeetingContext must be used within a MeetingProvider')
  }
  return context
}
