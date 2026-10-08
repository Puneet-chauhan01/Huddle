import type { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

type MeetingActionCardProps = {
  label: string
  icon: LucideIcon
  tone: 'blue' | 'orange'
  onClick?: () => void
}

export function MeetingActionCard({
  label,
  icon: Icon,
  tone,
  onClick,
}: MeetingActionCardProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group flex flex-col items-center gap-3 rounded-2xl p-1 outline-none focus-visible:ring-2 focus-visible:ring-zoom-blue/40"
    >
      <span
        className={cn(
          'flex size-[62px] items-center justify-center rounded-2xl text-white transition-transform group-hover:scale-105',
          tone === 'blue' ? 'bg-zoom-blue' : 'bg-zoom-orange',
        )}
      >
        <Icon className="size-7" strokeWidth={2.5} aria-hidden="true" />
      </span>
      <span className="text-[15px] font-bold text-zoom-muted">{label}</span>
    </button>
  )
}
