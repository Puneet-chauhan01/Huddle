"use client"

import { useState } from "react"
import {
  Mic,
  MicOff,
  Video,
  VideoOff,
  Users,
  ScreenShare,
  Copy,
  Check,
  Settings,
} from "lucide-react"

interface MeetingControlsProps {
  isMuted: boolean
  isVideoOff: boolean
  participantCount: number
  showParticipants: boolean
  meetingCode: string
  onToggleMicrophone: () => void
  onToggleCamera: () => void
  onToggleParticipants: () => void
  onLeave: () => void
}

export function MeetingControls({
  isMuted,
  isVideoOff,
  participantCount,
  showParticipants,
  meetingCode,
  onToggleMicrophone,
  onToggleCamera,
  onToggleParticipants,
  onLeave,
}: MeetingControlsProps) {
  const [copied, setCopied] = useState(false)

  const handleCopyLink = () => {
    const inviteUrl = `${window.location.origin}/meeting/${meetingCode}`
    navigator.clipboard?.writeText(inviteUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <footer className="flex h-[88px] shrink-0 items-center justify-between bg-black/95 px-4 sm:px-6 z-20 border-t border-white/5">
      {/* Left Media Controls */}
      <div className="flex items-center gap-1.5 sm:gap-2">
        <button
          type="button"
          onClick={onToggleMicrophone}
          className={`flex w-14 sm:w-16 flex-col items-center justify-center gap-1.5 rounded-xl py-2 text-[11px] transition-colors hover:bg-white/10 ${
            isMuted ? "text-red-500" : "text-white"
          }`}
          aria-label={isMuted ? "Unmute microphone" : "Mute microphone"}
        >
          <div className="flex size-6 items-center justify-center">
            {isMuted ? <MicOff size={22} /> : <Mic size={22} />}
          </div>
          <span className="font-medium">{isMuted ? "Unmute" : "Mute"}</span>
        </button>

        <button
          type="button"
          onClick={onToggleCamera}
          className={`flex w-14 sm:w-16 flex-col items-center justify-center gap-1.5 rounded-xl py-2 text-[11px] transition-colors hover:bg-white/10 ${
            isVideoOff ? "text-red-500" : "text-white"
          }`}
          aria-label={isVideoOff ? "Start video camera" : "Stop video camera"}
        >
          <div className="flex size-6 items-center justify-center">
            {isVideoOff ? <VideoOff size={22} /> : <Video size={22} />}
          </div>
          <span className="font-medium">{isVideoOff ? "Start Video" : "Stop Video"}</span>
        </button>
      </div>

      {/* Center Actions */}
      <div className="flex items-center gap-1.5 sm:gap-2">
        <button
          type="button"
          onClick={onToggleParticipants}
          className={`flex w-16 sm:w-20 flex-col items-center justify-center gap-1.5 rounded-xl py-2 text-[11px] transition-colors ${
            showParticipants
              ? "bg-white/15 text-white"
              : "text-white/80 hover:bg-white/10 hover:text-white"
          }`}
        >
          <div className="relative flex size-6 items-center justify-center">
            <Users size={22} />
            <span className="absolute -right-2 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-zoom-blue px-1 text-[10px] font-bold text-white">
              {participantCount}
            </span>
          </div>
          <span className="font-medium">Participants</span>
        </button>

        <button
          type="button"
          onClick={handleCopyLink}
          className="flex w-16 sm:w-20 flex-col items-center justify-center gap-1.5 rounded-xl py-2 text-[11px] text-white/80 transition-colors hover:bg-white/10 hover:text-white"
        >
          <div className="flex size-6 items-center justify-center">
            {copied ? <Check size={20} className="text-green-500" /> : <Copy size={20} />}
          </div>
          <span className="font-medium">{copied ? "Copied!" : "Invite Link"}</span>
        </button>
      </div>

      {/* Right End Actions */}
      <div className="flex items-center">
        <button
          type="button"
          onClick={onLeave}
          className="rounded-xl bg-red-600 px-5 sm:px-6 py-2.5 text-sm font-bold text-white transition-colors hover:bg-red-700 active:scale-95"
        >
          Leave
        </button>
      </div>
    </footer>
  )
}
