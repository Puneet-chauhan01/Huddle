"use client"

import { CalendarDays, Clock, Hash, Timer } from 'lucide-react'
import { useRouter } from 'next/navigation'
import type { UpcomingMeeting } from '@/lib/meetings'
import { user } from '@/lib/meetings'
import { cn } from '@/lib/utils'

export function UpcomingMeetingCard({
  meeting,
  featured = false,
}: {
  meeting: UpcomingMeeting
  featured?: boolean
}) {
  const router = useRouter()

  const handleAction = () => {
    const cleanId = meeting.meetingId.replace(/\s/g, '')
    router.push(`/meeting/${cleanId}?name=${encodeURIComponent(user.name)}`)
  }

  return (
    <li className="flex flex-col gap-4 rounded-2xl bg-zoom-surface p-5 sm:flex-row sm:items-center sm:gap-5">
      <div
        aria-hidden="true"
        className="flex size-16 shrink-0 flex-col items-center justify-center rounded-xl bg-white shadow-[0_1px_6px_rgba(15,23,42,0.08)]"
      >
        <span className="text-[12px] font-black uppercase tracking-wider text-zoom-blue">
          {meeting.month}
        </span>
        <span className="text-[26px] font-black leading-none text-zoom-ink">
          {meeting.day}
        </span>
      </div>

      <div className="min-w-0 flex-1">
        <h3 className="truncate text-[20px] font-bold text-zoom-ink">
          {meeting.title}
        </h3>
        <dl className="mt-2 flex flex-wrap gap-x-5 gap-y-1.5 text-[15px] text-zoom-muted">
          <MetaItem icon={CalendarDays} label="Date" value={meeting.dateLabel} />
          <MetaItem icon={Clock} label="Time" value={meeting.time} />
          <MetaItem icon={Timer} label="Duration" value={meeting.duration} />
          <MetaItem icon={Hash} label="Meeting ID" value={meeting.meetingId} />
        </dl>
      </div>

      <button
        type="button"
        onClick={handleAction}
        className={cn(
          'h-11 shrink-0 rounded-xl px-6 text-[17px] font-bold transition-colors sm:min-w-[96px]',
          featured
            ? 'bg-zoom-blue text-white hover:bg-zoom-blue/90'
            : 'bg-zoom-blue-soft text-zoom-blue hover:bg-zoom-blue/15',
        )}
      >
        {meeting.action}
      </button>
    </li>
  )
}

function MetaItem({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Clock
  label: string
  value: string
}) {
  return (
    <div className="flex items-center gap-1.5">
      <Icon className="size-4 shrink-0" aria-hidden="true" />
      <dt className="sr-only">{label}</dt>
      <dd className="tabular-nums">{value}</dd>
    </div>
  )
}
