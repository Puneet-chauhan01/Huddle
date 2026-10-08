"use client"

import { useEffect, useRef } from "react"
import { MicOff, User as UserIcon } from "lucide-react"
import { RoomParticipantInfo } from "@/hooks/use-livekit-room"

interface VideoTileProps {
  participant: RoomParticipantInfo
}

export function VideoTile({ participant }: VideoTileProps) {
  const videoRef = useRef<HTMLVideoElement>(null)

  useEffect(() => {
    const videoEl = videoRef.current
    const track = participant.videoTrack

    if (videoEl && track && !participant.isVideoOff) {
      track.attach(videoEl)
      return () => {
        track.detach(videoEl)
      }
    }
  }, [participant.videoTrack, participant.isVideoOff])

  const initial = participant.name ? participant.name.trim().charAt(0).toUpperCase() : "U"

  return (
    <div className="relative aspect-video flex items-center justify-center rounded-2xl bg-black/90 border border-white/10 overflow-hidden shadow-lg select-none">
      {/* Video Element */}
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted={participant.isLocal}
        className={`size-full object-cover ${participant.isLocal ? "mirror" : ""} ${
          participant.isVideoOff || !participant.videoTrack ? "hidden" : "block"
        }`}
      />

      {/* Fallback Avatar when camera is off */}
      {(participant.isVideoOff || !participant.videoTrack) && (
        <div className="flex size-20 sm:size-24 items-center justify-center rounded-full bg-zoom-teal text-2xl sm:text-3xl font-bold text-white shadow-md">
          {initial}
        </div>
      )}

      {/* Bottom Name & Status Badge */}
      <div className="absolute bottom-3 left-3 flex items-center gap-2 rounded-lg bg-black/60 px-3 py-1.5 text-xs sm:text-sm font-medium backdrop-blur-md text-white">
        {participant.isMuted && <MicOff size={14} className="text-red-500" />}
        <span className="truncate max-w-[150px] sm:max-w-[200px]">
          {participant.name} {participant.isLocal && "(You)"}
        </span>
        {participant.isHost && (
          <span className="rounded bg-zoom-blue/80 px-1.5 py-0.5 text-[10px] font-bold text-white">
            Host
          </span>
        )}
      </div>
    </div>
  )
}
