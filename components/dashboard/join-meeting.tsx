"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { api, ApiError } from "@/lib/api"

interface JoinMeetingProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function JoinMeeting({ open, onOpenChange }: JoinMeetingProps) {
  const [meetingId, setMeetingId] = useState("")
  const [displayName, setDisplayName] = useState("")
  const [error, setError] = useState("")
  const [isValidating, setIsValidating] = useState(false)
  const router = useRouter()

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (!displayName.trim()) {
      setError("Please enter a display name.")
      return
    }

    let cleanId = meetingId.trim()
    // Extract meeting ID from full invite URL if pasted (e.g. http://localhost:3000/meeting/6028563377)
    if (cleanId.includes("/meeting/")) {
      const match = cleanId.match(/\/meeting\/([a-zA-Z0-9_-]+)/)
      if (match && match[1]) {
        cleanId = match[1]
      }
    } else {
      cleanId = cleanId.replace(/\s/g, "")
    }

    if (!cleanId) {
      setError("Please enter a valid Meeting ID or invite link.")
      return
    }

    try {
      setIsValidating(true)
      // Step 1: Validate meeting exists via GET /api/meetings/{meeting_code}
      try {
        await api.getMeeting(cleanId)
        // Step 2: Register participant via POST /api/meetings/{meeting_code}/join
        await api.joinMeeting(cleanId, displayName.trim())
      } catch (err: any) {
        if (err instanceof ApiError && err.status === 404) {
          setError("Meeting not found. Please verify the Meeting ID.")
          setIsValidating(false)
          return
        }
        if (err?.message === "Meeting not found") {
          setError("Meeting not found. Please verify the Meeting ID.")
          setIsValidating(false)
          return
        }
        // If server is unreachable, log warning and let client enter demo mode
        console.warn("Could not complete backend join check, proceeding:", err)
      }

      // Step 3: Navigate to meeting room
      router.push(`/meeting/${cleanId}?name=${encodeURIComponent(displayName.trim())}`)
      onOpenChange(false)
    } catch (err: any) {
      setError(err?.message || "Failed to join meeting. Please try again.")
    } finally {
      setIsValidating(false)
    }
  }

  // Clear errors when modal closes
  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen) setError("")
    onOpenChange(isOpen)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="text-center text-xl font-bold">Join Meeting</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleJoin} className="flex flex-col gap-6 py-4">
          {error && (
            <div className="rounded-xl bg-red-50 p-3 text-sm font-medium text-red-600">
              {error}
            </div>
          )}
          <div className="flex flex-col gap-2">
            <Label htmlFor="meetingId" className="sr-only">
              Meeting ID or Personal Link Name
            </Label>
            <Input
              id="meetingId"
              placeholder="Meeting ID or Personal Link Name"
              value={meetingId}
              onChange={(e) => setMeetingId(e.target.value)}
              className="text-center text-lg h-12"
              required
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="displayName" className="sr-only">
              Your Name
            </Label>
            <Input
              id="displayName"
              placeholder="Your Name"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="text-center text-lg h-12"
              required
            />
          </div>
          <Button
            type="submit"
            disabled={isValidating}
            className="h-12 text-lg font-bold bg-zoom-blue hover:bg-zoom-blue/90 w-full rounded-xl"
          >
            {isValidating ? "Validating & Joining..." : "Join"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}
