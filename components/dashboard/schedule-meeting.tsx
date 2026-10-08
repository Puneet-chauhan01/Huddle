"use client"

import { useState } from "react"
import { Copy, Check } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"

import { useMeetingContext } from "./meeting-provider"
import { api } from "@/lib/api"
import { formatBackendToUpcoming } from "@/lib/meetings"

interface ScheduleMeetingProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ScheduleMeeting({ open, onOpenChange }: ScheduleMeetingProps) {
  const { addMeeting, refreshMeetings } = useMeetingContext()
  const [title, setTitle] = useState("My Meeting")
  const [description, setDescription] = useState("")
  const [date, setDate] = useState("")
  const [time, setTime] = useState("")
  const [duration, setDuration] = useState("30")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)
  const [createdCode, setCreatedCode] = useState("")
  const [copiedLink, setCopiedLink] = useState(false)

  const handleSchedule = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setIsLoading(true)

    try {
      const scheduledDateTime = new Date(`${date}T${time}`)
      if (isNaN(scheduledDateTime.getTime())) {
        setError("Please enter a valid date and time.")
        setIsLoading(false)
        return
      }

      let code = ""
      try {
        const created = await api.scheduleMeeting({
          title,
          description: description || undefined,
          duration_minutes: parseInt(duration, 10),
          scheduled_at: scheduledDateTime.toISOString(),
        })

        code = created.meeting_code
        setCreatedCode(code)
        addMeeting(formatBackendToUpcoming(created))
        await refreshMeetings()
      } catch (backendErr) {
        console.warn("Backend schedule failed, falling back to local state:", backendErr)
        code = Math.random().toString().slice(2, 12)
        setCreatedCode(code)
        addMeeting({
          id: Math.random().toString(),
          title,
          month: scheduledDateTime.toLocaleString('en-US', { month: 'short' }),
          day: scheduledDateTime.getDate().toString(),
          dateLabel: scheduledDateTime.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' }),
          time: `${time} - ${parseInt(duration, 10)} min`,
          duration: `${duration} min`,
          meetingId: code,
          action: 'Start'
        })
      }

      setSuccess(true)
    } catch (err: any) {
      setError(err.message || "Failed to schedule meeting.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleCopyLink = () => {
    if (!createdCode) return
    const inviteUrl = `${window.location.origin}/meeting/${createdCode}`
    navigator.clipboard?.writeText(inviteUrl)
    setCopiedLink(true)
    setTimeout(() => setCopiedLink(false), 2000)
  }

  const handleClose = () => {
    setSuccess(false)
    setCreatedCode("")
    setCopiedLink(false)
    setTitle("My Meeting")
    setDescription("")
    setDate("")
    setTime("")
    setDuration("30")
    onOpenChange(false)
  }

  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen) {
      handleClose()
    } else {
      onOpenChange(true)
    }
  }

  const inviteUrl = typeof window !== 'undefined' && createdCode ? `${window.location.origin}/meeting/${createdCode}` : ''

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[450px]">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">Schedule Meeting</DialogTitle>
        </DialogHeader>
        {success ? (
          <div className="flex flex-col items-center justify-center py-4 text-center">
            <div className="mb-3 flex size-12 items-center justify-center rounded-full bg-green-100 text-green-600 font-bold text-xl">
              ✓
            </div>
            <p className="text-xl font-bold text-zoom-ink">Meeting Scheduled!</p>
            <p className="text-sm text-zoom-muted mt-1">It has been added to your upcoming meetings.</p>

            {/* Generated Meeting ID & Shareable Invite Link */}
            <div className="mt-5 w-full rounded-2xl bg-zoom-surface p-4 text-left">
              <div className="flex items-center justify-between text-xs text-zoom-muted font-medium mb-1">
                <span>Meeting ID</span>
                <span className="font-bold text-zoom-ink font-mono text-sm">{createdCode}</span>
              </div>
              <div className="mt-3">
                <span className="text-xs text-zoom-muted font-medium">Invite Link</span>
                <div className="mt-1 flex items-center gap-2 rounded-xl bg-white p-2 border border-zoom-ink/[0.08]">
                  <input
                    type="text"
                    readOnly
                    value={inviteUrl}
                    className="w-full bg-transparent text-xs text-zoom-ink outline-none select-all truncate font-mono"
                  />
                  <button
                    type="button"
                    onClick={handleCopyLink}
                    className="flex shrink-0 items-center gap-1 rounded-lg bg-zoom-blue/10 px-2.5 py-1 text-xs font-bold text-zoom-blue hover:bg-zoom-blue/20 transition-colors"
                  >
                    {copiedLink ? <Check size={13} className="text-green-600" /> : <Copy size={13} />}
                    <span>{copiedLink ? "Copied" : "Copy"}</span>
                  </button>
                </div>
              </div>
            </div>

            <Button
              type="button"
              onClick={handleClose}
              className="mt-6 w-full h-11 font-bold bg-zoom-blue hover:bg-zoom-blue/90 rounded-xl"
            >
              Done
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSchedule} className="flex flex-col gap-4 py-4">
            {error && (
              <div className="rounded-xl bg-red-50 p-3 text-sm font-medium text-red-600">
                {error}
              </div>
            )}
            <div className="flex flex-col gap-2">
              <Label htmlFor="title">Topic</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="description">Description (Optional)</Label>
              <Input
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-2">
                <Label htmlFor="date">Date</Label>
                <Input
                  id="date"
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  required
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="time">Time</Label>
                <Input
                  id="time"
                  type="time"
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  required
                />
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="duration">Duration (minutes)</Label>
              <Input
                id="duration"
                type="number"
                min="15"
                step="15"
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                required
              />
            </div>
            <Button
              type="submit"
              disabled={isLoading}
              className="mt-4 h-11 font-bold bg-zoom-blue hover:bg-zoom-blue/90 rounded-xl"
            >
              {isLoading ? "Scheduling..." : "Save"}
            </Button>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}
