"use client"

import { Clock } from 'lucide-react'
import { useMeetingContext } from './meeting-provider'
import { RecentMeetingItem } from './recent-meeting-item'

export function RecentMeetings() {
  const { recentMeetings, isLoading } = useMeetingContext()

  return (
    <section
      aria-labelledby="recent-heading"
      className="rounded-3xl bg-white p-8 shadow-[0_2px_18px_rgba(15,23,42,0.07)]"
    >
      <h2 id="recent-heading" className="text-[28px] font-black text-zoom-ink">
        Recent Meetings
      </h2>
      {!isLoading && recentMeetings.length === 0 ? (
        <div className="mt-6 flex flex-col items-center justify-center rounded-2xl bg-zoom-surface p-8 text-center">
          <Clock className="size-10 text-zoom-muted/60 mb-2" />
          <p className="text-[17px] font-bold text-zoom-ink">No recent meetings</p>
          <p className="text-sm text-zoom-muted mt-1">Meetings you complete will appear here.</p>
        </div>
      ) : (
        <ul className="mt-4 divide-y divide-zoom-ink/[0.08] border-t border-zoom-ink/[0.08]">
          {recentMeetings.map((meeting) => (
            <RecentMeetingItem key={meeting.id} meeting={meeting} />
          ))}
        </ul>
      )}
    </section>
  )
}
