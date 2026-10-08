"use client"

import { RefreshCw, CalendarX } from 'lucide-react'
import { useMeetingContext } from './meeting-provider'
import { UpcomingMeetingCard } from './upcoming-meeting-card'

export function UpcomingMeetings() {
  const { upcomingMeetings, isLoading, error, refreshMeetings } = useMeetingContext()

  return (
    <section
      aria-labelledby="upcoming-heading"
      className="rounded-3xl bg-white p-8 shadow-[0_2px_18px_rgba(15,23,42,0.07)]"
    >
      <div className="flex items-baseline justify-between gap-4">
        <h2
          id="upcoming-heading"
          className="text-[28px] font-black text-zoom-ink"
        >
          Upcoming Meetings
        </h2>
        <div className="flex items-center gap-3">
          {isLoading && (
            <span className="flex items-center gap-1.5 text-xs text-zoom-muted">
              <RefreshCw className="size-3 animate-spin text-zoom-blue" />
              Syncing...
            </span>
          )}
          <a href="#" className="text-[17px] font-bold text-zoom-blue hover:underline">
            View all
          </a>
        </div>
      </div>

      {error && upcomingMeetings.length === 0 ? (
        <div className="mt-6 flex flex-col items-center justify-center rounded-2xl bg-red-50/60 p-6 text-center">
          <p className="text-sm font-medium text-red-600">{error}</p>
          <button
            type="button"
            onClick={() => refreshMeetings()}
            className="mt-3 rounded-lg bg-white px-4 py-1.5 text-xs font-bold text-red-600 shadow-sm border border-red-200 hover:bg-red-50"
          >
            Retry
          </button>
        </div>
      ) : !isLoading && upcomingMeetings.length === 0 ? (
        <div className="mt-6 flex flex-col items-center justify-center rounded-2xl bg-zoom-surface p-8 text-center">
          <CalendarX className="size-10 text-zoom-muted/60 mb-2" />
          <p className="text-[17px] font-bold text-zoom-ink">No upcoming meetings</p>
          <p className="text-sm text-zoom-muted mt-1">Schedule a meeting or start an instant meeting to see it here.</p>
        </div>
      ) : (
        <ul className="mt-6 flex flex-col gap-3">
          {upcomingMeetings.map((meeting, index) => (
            <UpcomingMeetingCard
              key={meeting.id}
              meeting={meeting}
              featured={index === 0}
            />
          ))}
        </ul>
      )}
    </section>
  )
}
