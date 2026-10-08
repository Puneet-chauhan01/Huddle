"use client"

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { CalendarPlus, Check, Copy, Plus, Video } from 'lucide-react'
import { user } from '@/lib/meetings'
import { api } from '@/lib/api'
import { MeetingActionCard } from './meeting-action-card'
import { JoinMeeting } from './join-meeting'
import { ScheduleMeeting } from './schedule-meeting'

export function MeetingActions() {
  const router = useRouter()
  const [isJoinOpen, setIsJoinOpen] = useState(false)
  const [isScheduleOpen, setIsScheduleOpen] = useState(false)
  const [isCreating, setIsCreating] = useState(false)
  const [copiedPmi, setCopiedPmi] = useState(false)

  const handleNewMeeting = async () => {
    try {
      setIsCreating(true)
      const meeting = await api.createInstantMeeting("Instant Meeting", 60)
      router.push(`/meeting/${meeting.meeting_code}?name=${encodeURIComponent(user.name)}`)
    } catch (err) {
      console.warn("Failed to create instant meeting via backend API, using fallback code:", err)
      const fallbackId = Math.random().toString().slice(2, 12)
      router.push(`/meeting/${fallbackId}?name=${encodeURIComponent(user.name)}`)
    } finally {
      setIsCreating(false)
    }
  }

  const handleCopyPmi = () => {
    navigator.clipboard?.writeText(user.personalMeetingId.replace(/\s/g, ''))
    setCopiedPmi(true)
    setTimeout(() => setCopiedPmi(false), 2000)
  }

  return (
    <section
      aria-labelledby="actions-heading"
      className="rounded-3xl bg-white px-8 pb-9 pt-8 shadow-[0_2px_18px_rgba(15,23,42,0.07)]"
    >
      <h2 id="actions-heading" className="sr-only">
        Meeting actions
      </h2>

      <div className="flex items-start justify-between">
        <MeetingActionCard 
          label={isCreating ? "Starting..." : "New Meeting"} 
          icon={Video} 
          tone="orange" 
          onClick={handleNewMeeting} 
        />
        <MeetingActionCard label="Join" icon={Plus} tone="blue" onClick={() => setIsJoinOpen(true)} />
        <MeetingActionCard label="Schedule" icon={CalendarPlus} tone="blue" onClick={() => setIsScheduleOpen(true)} />
      </div>

      <div className="mt-8 text-center">
        <h3 className="text-[20px] font-bold text-zoom-ink">
          Personal Meeting ID
        </h3>
        <p className="mt-2 flex items-center justify-center gap-3 text-[18px] text-zoom-ink">
          <span className="tabular-nums">{user.personalMeetingId}</span>
          <button
            type="button"
            onClick={handleCopyPmi}
            aria-label="Copy personal meeting ID"
            className="rounded-md p-1 text-zoom-muted transition-colors hover:bg-zoom-surface hover:text-zoom-ink"
          >
            {copiedPmi ? (
              <Check className="size-[18px] text-green-600" aria-hidden="true" />
            ) : (
              <Copy className="size-[18px]" aria-hidden="true" />
            )}
          </button>
        </p>
      </div>

      <JoinMeeting open={isJoinOpen} onOpenChange={setIsJoinOpen} />
      <ScheduleMeeting open={isScheduleOpen} onOpenChange={setIsScheduleOpen} />
    </section>
  )
}
