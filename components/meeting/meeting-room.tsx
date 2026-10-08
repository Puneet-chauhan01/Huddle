"use client"

import { useState } from "react"
import { RoomParticipantInfo } from "@/hooks/use-livekit-room"
import { VideoGrid } from "./video-grid"
import { MeetingControls } from "./meeting-controls"
import { ParticipantsPanel } from "./participants-panel"

interface MeetingRoomProps {
  meetingCode: string
  meetingTitle?: string
  participants: RoomParticipantInfo[]
  isHost: boolean
  isMuted: boolean
  isVideoOff: boolean
  onToggleMicrophone: () => void
  onToggleCamera: () => void
  onMuteAll: () => void
  onRemoveParticipant: (identity: string) => void
  onLeave: () => void
}

export function MeetingRoom({
  meetingCode,
  meetingTitle,
  participants,
  isHost,
  isMuted,
  isVideoOff,
  onToggleMicrophone,
  onToggleCamera,
  onMuteAll,
  onRemoveParticipant,
  onLeave,
}: MeetingRoomProps) {
  const [showParticipants, setShowParticipants] = useState(false)

  const formattedId = meetingCode.replace(/(\d{3})(\d{3})(\d{3,4})/, "$1 $2 $3")

  return (
    <div className="flex h-screen w-full bg-zoom-ink text-white overflow-hidden relative">
      {/* Main Room Container */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Top Header Bar */}
        <header className="flex h-12 shrink-0 items-center justify-between px-6 bg-black/40 border-b border-white/5 z-10">
          <div className="flex items-center gap-3 text-xs font-medium text-white/80">
            <span className="font-bold text-white">{meetingTitle || "Zoom Meeting"}</span>
            <span className="text-white/30">|</span>
            <span className="tabular-nums">ID: {formattedId}</span>
          </div>
          <div className="flex items-center gap-2 text-xs font-semibold text-emerald-400">
            <span className="size-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Connected</span>
          </div>
        </header>

        {/* Video Grid */}
        <VideoGrid participants={participants} />

        {/* Bottom Controls Bar */}
        <MeetingControls
          isMuted={isMuted}
          isVideoOff={isVideoOff}
          participantCount={participants.length}
          showParticipants={showParticipants}
          meetingCode={meetingCode}
          onToggleMicrophone={onToggleMicrophone}
          onToggleCamera={onToggleCamera}
          onToggleParticipants={() => setShowParticipants(!showParticipants)}
          onLeave={onLeave}
        />
      </div>

      {/* Participants Sidebar Panel */}
      {showParticipants && (
        <ParticipantsPanel
          participants={participants}
          isHost={isHost}
          onClose={() => setShowParticipants(false)}
          onMuteAll={onMuteAll}
          onRemoveParticipant={onRemoveParticipant}
        />
      )}
    </div>
  )
}
