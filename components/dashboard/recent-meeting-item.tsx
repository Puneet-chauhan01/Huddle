import { ChevronRight, Video } from 'lucide-react'
import type { RecentMeeting } from '@/lib/meetings'

export function RecentMeetingItem({ meeting }: { meeting: RecentMeeting }) {
  return (
    <li className="flex items-center gap-4 py-4">
      <span
        aria-hidden="true"
        className="flex size-11 shrink-0 items-center justify-center rounded-full bg-zoom-blue-soft text-zoom-blue"
      >
        <Video className="size-5" />
      </span>

      <div className="min-w-0 flex-1">
        <h3 className="truncate text-[18px] font-bold text-zoom-ink">
          {meeting.title}
        </h3>
        <p className="mt-0.5 text-[15px] text-zoom-muted">{meeting.dateTime}</p>
        <p className="mt-0.5 text-[14px] text-zoom-muted">
          {meeting.duration} · {meeting.participants} participants · Host:{' '}
          {meeting.host}
        </p>
      </div>

      <button
        type="button"
        aria-label={`View details for ${meeting.title}`}
        className="rounded-full p-2 text-zoom-muted transition-colors hover:bg-zoom-surface hover:text-zoom-ink"
      >
        <ChevronRight className="size-5" aria-hidden="true" />
      </button>
    </li>
  )
}
