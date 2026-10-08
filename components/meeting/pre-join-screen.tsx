"use client"

import { useEffect, useRef } from "react"
import { Mic, MicOff, Video, VideoOff } from "lucide-react"

interface PreJoinScreenProps {
  name: string
  setName: (name: string) => void
  isMuted: boolean
  setIsMuted: (muted: boolean) => void
  isVideoOff: boolean
  setIsVideoOff: (videoOff: boolean) => void
  meetingTitle?: string
  stream: MediaStream | null
  isJoining: boolean
  onJoin: () => void
}

export function PreJoinScreen({
  name,
  setName,
  isMuted,
  setIsMuted,
  isVideoOff,
  setIsVideoOff,
  meetingTitle,
  stream,
  isJoining,
  onJoin,
}: PreJoinScreenProps) {
  const videoRef = useRef<HTMLVideoElement>(null)

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = isVideoOff ? null : stream
    }
  }, [stream, isVideoOff])

  const initial = name ? name.trim().charAt(0).toUpperCase() : "U"

  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-zoom-surface p-4">
      <div className="w-full max-w-3xl rounded-3xl bg-white p-6 sm:p-8 shadow-xl border border-zoom-surface/40">
        <h1 className="text-center text-3xl font-black text-zoom-ink mb-1">Ready to join?</h1>
        {meetingTitle && (
          <p className="text-center text-sm font-medium text-zoom-muted mb-6">{meetingTitle}</p>
        )}

        <div className="flex flex-col md:flex-row gap-8 mt-4">
          {/* Camera Preview Box */}
          <div className="flex-1 relative aspect-video rounded-2xl bg-black overflow-hidden flex items-center justify-center border-4 border-zoom-surface">
            {!isVideoOff && stream ? (
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="size-full object-cover mirror"
              />
            ) : (
              <div className="flex size-24 items-center justify-center rounded-full bg-zoom-teal text-white text-4xl font-bold shadow-lg">
                {initial}
              </div>
            )}

            {/* Media Overlay Controls */}
            <div className="absolute bottom-4 flex w-full justify-center gap-4">
              <button
                type="button"
                onClick={() => setIsMuted(!isMuted)}
                className={`flex size-12 items-center justify-center rounded-full ${
                  isMuted ? "bg-red-500 text-white" : "bg-white/20 text-white hover:bg-white/30"
                } backdrop-blur-sm transition-colors`}
                aria-label={isMuted ? "Unmute microphone" : "Mute microphone"}
              >
                {isMuted ? <MicOff size={20} /> : <Mic size={20} />}
              </button>
              <button
                type="button"
                onClick={() => setIsVideoOff(!isVideoOff)}
                className={`flex size-12 items-center justify-center rounded-full ${
                  isVideoOff ? "bg-red-500 text-white" : "bg-white/20 text-white hover:bg-white/30"
                } backdrop-blur-sm transition-colors`}
                aria-label={isVideoOff ? "Turn on camera" : "Turn off camera"}
              >
                {isVideoOff ? <VideoOff size={20} /> : <Video size={20} />}
              </button>
            </div>
          </div>

          {/* User Display Name Form */}
          <div className="w-full md:w-72 flex flex-col justify-center gap-4">
            <div className="flex flex-col gap-2">
              <label htmlFor="display-name" className="text-sm font-bold text-zoom-ink">
                Your Display Name
              </label>
              <input
                id="display-name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter your name"
                className="rounded-xl border border-zoom-surface p-3 text-lg outline-none focus:border-zoom-blue focus:ring-1 focus:ring-zoom-blue"
                required
              />
            </div>

            <button
              type="button"
              onClick={onJoin}
              disabled={!name.trim() || isJoining}
              className="rounded-xl bg-zoom-blue py-3.5 text-lg font-bold text-white transition-colors hover:bg-zoom-blue/90 disabled:opacity-50 active:scale-98"
            >
              {isJoining ? "Connecting..." : "Join Meeting"}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
