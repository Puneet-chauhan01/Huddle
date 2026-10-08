"use client"

import { use, useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { AlertCircle, Loader2 } from "lucide-react"
import { api, BackendMeetingDetail } from "@/lib/api"
import { useLiveKitRoom } from "@/hooks/use-livekit-room"
import { PreJoinScreen } from "@/components/meeting/pre-join-screen"
import { MeetingRoom } from "@/components/meeting/meeting-room"

export default function MeetingPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const initialName = searchParams.get("name") || "Puneet Chauhan"
  const { id } = use(params)

  const [hasJoined, setHasJoined] = useState(false)
  const [name, setName] = useState(initialName)
  const [isMuted, setIsMuted] = useState(false)
  const [isVideoOff, setIsVideoOff] = useState(false)
  const [stream, setStream] = useState<MediaStream | null>(null)

  const [meetingData, setMeetingData] = useState<BackendMeetingDetail | null>(null)
  const [notFound, setNotFound] = useState(false)
  const [isLoadingMeeting, setIsLoadingMeeting] = useState(true)

  // Initialize LiveKit Hook
  const {
    room,
    isConnected,
    isConnecting,
    error: livekitError,
    isHost,
    isMuted: livekitMuted,
    isVideoOff: livekitVideoOff,
    participants,
    connect,
    toggleMicrophone,
    toggleCamera,
    muteAll,
    removeParticipant,
    leaveRoom,
  } = useLiveKitRoom({
    meetingCode: id,
    displayName: name,
    initialMuted: isMuted,
    initialVideoOff: isVideoOff,
    onDisconnected: () => {
      router.push("/")
    },
  })

  // Pre-join camera/microphone permissions & preview
  useEffect(() => {
    let activeStream: MediaStream | null = null

    if (!hasJoined) {
      navigator.mediaDevices?.getUserMedia({ video: true, audio: true })
        .then((s) => {
          activeStream = s
          setStream(s)
        })
        .catch((err) => {
          console.warn("Camera or microphone permission not granted for pre-join preview:", err)
        })
    }

    return () => {
      if (activeStream) {
        activeStream.getTracks().forEach((track) => track.stop())
      }
    }
  }, [hasJoined])

  // Validate meeting on backend
  useEffect(() => {
    async function validateMeeting() {
      try {
        setIsLoadingMeeting(true)
        const data = await api.getMeeting(id)
        setMeetingData(data)
      } catch (err: any) {
        if (err?.message === "Meeting not found" || err?.status === 404) {
          setNotFound(true)
        } else {
          console.warn("Could not reach backend to validate meeting, permitting demo mode:", err)
        }
      } finally {
        setIsLoadingMeeting(false)
      }
    }

    validateMeeting()
  }, [id])

  const handleJoin = async () => {
    if (!name.trim()) return

    // 1. Release pre-join preview stream tracks before LiveKit takes over
    if (stream) {
      stream.getTracks().forEach((track) => track.stop())
      setStream(null)
    }

    // 2. Register participant in SQLite database
    try {
      await api.joinMeeting(id, name.trim())
    } catch (e) {
      console.warn("Application join registration failed, proceeding with LiveKit connection:", e)
    }

    // 3. Connect to LiveKit SFU
    await connect()
    setHasJoined(true)
  }

  const handleLeave = async () => {
    await leaveRoom()
    try {
      await api.leaveMeeting(id, name.trim())
    } catch {}
    router.push("/")
  }

  // Loading Screen
  if (isLoadingMeeting) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-zoom-surface">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="size-10 animate-spin text-zoom-blue" />
          <p className="text-sm font-semibold text-zoom-ink">Connecting to meeting...</p>
        </div>
      </div>
    )
  }

  // 404 Screen
  if (notFound) {
    return (
      <div className="flex h-screen w-full flex-col items-center justify-center bg-zoom-surface p-4">
        <div className="w-full max-w-md rounded-3xl bg-white p-8 text-center shadow-xl border border-zoom-surface/40">
          <div className="mx-auto mb-4 flex size-14 items-center justify-center rounded-full bg-red-100 text-red-600">
            <AlertCircle size={28} />
          </div>
          <h2 className="text-2xl font-bold text-zoom-ink">Meeting Not Found</h2>
          <p className="mt-2 text-sm text-zoom-muted">
            The meeting ID <span className="font-semibold text-zoom-ink">{id}</span> does not exist or has ended.
          </p>
          <div className="mt-6 flex flex-col gap-3">
            <button
              type="button"
              onClick={() => router.push("/")}
              className="rounded-xl bg-zoom-blue py-3 font-bold text-white hover:bg-zoom-blue/90 transition-colors"
            >
              Back to Dashboard
            </button>
            <button
              type="button"
              onClick={() => setNotFound(false)}
              className="rounded-xl border border-zoom-surface py-2.5 text-sm font-medium text-zoom-muted hover:text-zoom-ink hover:bg-zoom-surface/50 transition-colors"
            >
              Continue anyway (Demo Mode)
            </button>
          </div>
        </div>
      </div>
    )
  }

  // Pre-Join Screen
  if (!hasJoined) {
    return (
      <PreJoinScreen
        name={name}
        setName={setName}
        isMuted={isMuted}
        setIsMuted={setIsMuted}
        isVideoOff={isVideoOff}
        setIsVideoOff={setIsVideoOff}
        meetingTitle={meetingData?.title}
        stream={stream}
        isJoining={isConnecting}
        onJoin={handleJoin}
      />
    )
  }

  // Connected Meeting Room
  return (
    <MeetingRoom
      meetingCode={id}
      meetingTitle={meetingData?.title}
      participants={participants}
      isHost={isHost}
      isMuted={livekitMuted}
      isVideoOff={livekitVideoOff}
      onToggleMicrophone={toggleMicrophone}
      onToggleCamera={toggleCamera}
      onMuteAll={muteAll}
      onRemoveParticipant={removeParticipant}
      onLeave={handleLeave}
    />
  )
}
