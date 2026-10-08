"use client"

import { RoomParticipantInfo } from "@/hooks/use-livekit-room"
import { VideoTile } from "./video-tile"

interface VideoGridProps {
  participants: RoomParticipantInfo[]
}

export function VideoGrid({ participants }: VideoGridProps) {
  const count = participants.length

  const getGridColsClass = () => {
    if (count <= 1) return "max-w-3xl grid-cols-1"
    if (count === 2) return "max-w-5xl grid-cols-1 md:grid-cols-2"
    if (count <= 4) return "max-w-5xl grid-cols-1 md:grid-cols-2"
    return "max-w-6xl grid-cols-1 md:grid-cols-2 lg:grid-cols-3"
  }

  return (
    <div className="flex-1 p-4 sm:p-6 overflow-y-auto flex items-center justify-center">
      <div className={`grid w-full gap-4 transition-all duration-300 ${getGridColsClass()}`}>
        {participants.map((participant) => (
          <VideoTile key={participant.identity} participant={participant} />
        ))}
      </div>
    </div>
  )
}
