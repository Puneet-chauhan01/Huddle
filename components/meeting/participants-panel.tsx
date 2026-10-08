"use client"

import { Mic, MicOff, Video, VideoOff, UserX } from "lucide-react"
import { RoomParticipantInfo } from "@/hooks/use-livekit-room"

interface ParticipantsPanelProps {
  participants: RoomParticipantInfo[]
  isHost: boolean
  onClose: () => void
  onMuteAll: () => void
  onRemoveParticipant: (identity: string) => void
}

export function ParticipantsPanel({
  participants,
  isHost,
  onClose,
  onMuteAll,
  onRemoveParticipant,
}: ParticipantsPanelProps) {
  return (
    <div className="flex h-full w-80 flex-col bg-white border-l border-zoom-surface/20 z-30 shadow-2xl">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-zoom-surface/20 px-4 py-3">
        <h3 className="font-bold text-zoom-ink">Participants ({participants.length})</h3>
        <button
          type="button"
          onClick={onClose}
          className="text-zoom-muted hover:text-zoom-ink p-1 font-bold text-base transition-colors"
          aria-label="Close participants panel"
        >
          ✕
        </button>
      </div>

      {/* Participant List */}
      <ul className="flex-1 overflow-y-auto divide-y divide-zoom-surface/40">
        {participants.map((p) => {
          const initial = p.name ? p.name.trim().charAt(0).toUpperCase() : "U"

          return (
            <li
              key={p.identity}
              className="flex items-center justify-between px-4 py-3 hover:bg-zoom-surface/50 transition-colors"
            >
              <div className="flex items-center gap-3 min-w-0 flex-1 mr-2">
                <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-zoom-teal text-white font-bold text-sm">
                  {initial}
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="truncate text-sm font-bold text-zoom-ink">
                    {p.name} {p.isLocal && "(You)"}
                  </span>
                  {p.isHost && <span className="text-[11px] font-medium text-zoom-muted">Host</span>}
                </div>
              </div>

              {/* Status Icons & Host Controls */}
              <div className="flex items-center gap-2 shrink-0">
                <div className="flex gap-1.5 text-zoom-muted">
                  {p.isMuted ? <MicOff size={16} className="text-red-500" /> : <Mic size={16} />}
                  {p.isVideoOff ? <VideoOff size={16} className="text-red-500" /> : <Video size={16} />}
                </div>

                {isHost && !p.isLocal && (
                  <button
                    type="button"
                    onClick={() => onRemoveParticipant(p.identity)}
                    title="Remove participant"
                    className="p-1 text-zoom-muted hover:text-red-600 transition-colors rounded"
                  >
                    <UserX size={15} />
                  </button>
                )}
              </div>
            </li>
          )
        })}
      </ul>

      {/* Footer Host Actions */}
      {isHost && (
        <div className="border-t border-zoom-surface/20 p-4 bg-zoom-surface/30">
          <button
            type="button"
            onClick={onMuteAll}
            className="w-full rounded-xl bg-zoom-blue/10 py-2.5 text-sm font-bold text-zoom-blue hover:bg-zoom-blue/20 transition-colors"
          >
            Mute All
          </button>
        </div>
      )}
    </div>
  )
}
