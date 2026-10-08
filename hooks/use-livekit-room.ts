"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import {
  Room,
  RoomEvent,
  Track,
  VideoTrack,
  AudioTrack,
  RemoteParticipant,
  LocalParticipant,
  Participant,
  DataPacket_Kind,
} from "livekit-client"
import { api, LiveKitTokenResponse } from "@/lib/api"

export interface RoomParticipantInfo {
  identity: string
  name: string
  isLocal: boolean
  isHost: boolean
  isMuted: boolean
  isVideoOff: boolean
  videoTrack?: Track | null
  audioTrack?: Track | null
}

interface UseLiveKitRoomProps {
  meetingCode: string
  displayName: string
  initialMuted?: boolean
  initialVideoOff?: boolean
  onDisconnected?: () => void
}

export function useLiveKitRoom({
  meetingCode,
  displayName,
  initialMuted = false,
  initialVideoOff = false,
  onDisconnected,
}: UseLiveKitRoomProps) {
  const [room, setRoom] = useState<Room | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const [isConnecting, setIsConnecting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isHost, setIsHost] = useState(false)

  const [isMuted, setIsMuted] = useState(initialMuted)
  const [isVideoOff, setIsVideoOff] = useState(initialVideoOff)
  const [participants, setParticipants] = useState<RoomParticipantInfo[]>([])

  const roomRef = useRef<Room | null>(null)
  const remoteAudioContainerRef = useRef<HTMLDivElement | null>(null)

  // Helper to re-compute all participants
  const updateParticipantsList = useCallback((currentRoom: Room) => {
    const list: RoomParticipantInfo[] = []

    // 1. Local participant
    const local = currentRoom.localParticipant
    if (local) {
      let isHostMeta = false
      try {
        if (local.metadata) {
          const parsed = JSON.parse(local.metadata)
          isHostMeta = !!parsed.is_host
        }
      } catch {}

      const localVideoPub = Array.from(local.videoTrackPublications.values())[0]
      const localAudioPub = Array.from(local.audioTrackPublications.values())[0]

      const localVideoTrack = localVideoPub?.track || null
      const localAudioTrack = localAudioPub?.track || null

      list.push({
        identity: local.identity,
        name: local.name || displayName || "You",
        isLocal: true,
        isHost: isHostMeta || isHost,
        isMuted: localAudioPub ? localAudioPub.isMuted : true,
        isVideoOff: localVideoPub ? (localVideoPub.isMuted || !localVideoTrack) : true,
        videoTrack: localVideoTrack,
        audioTrack: localAudioTrack,
      })
    }

    // 2. Remote participants
    currentRoom.remoteParticipants.forEach((remote: RemoteParticipant) => {
      let isHostMeta = false
      try {
        if (remote.metadata) {
          const parsed = JSON.parse(remote.metadata)
          isHostMeta = !!parsed.is_host
        }
      } catch {}

      const videoPub = Array.from(remote.videoTrackPublications.values())[0]
      const audioPub = Array.from(remote.audioTrackPublications.values())[0]

      const videoTrack = videoPub?.track || null
      const audioTrack = audioPub?.track || null

      list.push({
        identity: remote.identity,
        name: remote.name || remote.identity,
        isLocal: false,
        isHost: isHostMeta,
        isMuted: audioPub ? audioPub.isMuted : true,
        isVideoOff: videoPub ? (videoPub.isMuted || !videoTrack) : true,
        videoTrack: videoTrack,
        audioTrack: audioTrack,
      })
    })

    setParticipants(list)
  }, [displayName, isHost])

  // Connect to the room
  const connect = useCallback(async () => {
    if (roomRef.current || isConnecting) return

    try {
      setIsConnecting(true)
      setError(null)

      // 1. Get LiveKit token from FastAPI backend
      const tokenData: LiveKitTokenResponse = await api.getMeetingToken(
        meetingCode,
        displayName.trim()
      )
      setIsHost(tokenData.is_host)

      // 2. Create LiveKit Room
      const livekitRoom = new Room({
        adaptiveStream: true,
        dynacast: true,
      })

      roomRef.current = livekitRoom
      setRoom(livekitRoom)

      // 3. Register Event Listeners
      livekitRoom.on(RoomEvent.Connected, () => {
        setIsConnected(true)
        updateParticipantsList(livekitRoom)
      })

      livekitRoom.on(RoomEvent.Disconnected, () => {
        setIsConnected(false)
        setParticipants([])
        onDisconnected?.()
      })

      livekitRoom.on(RoomEvent.ParticipantConnected, () => {
        updateParticipantsList(livekitRoom)
      })

      livekitRoom.on(RoomEvent.ParticipantDisconnected, () => {
        updateParticipantsList(livekitRoom)
      })

      livekitRoom.on(RoomEvent.TrackSubscribed, (track: Track, publication, participant) => {
        if (track.kind === Track.Kind.Audio) {
          // Play remote audio
          const el = track.attach()
          el.id = `audio-${participant.identity}`
          document.body.appendChild(el)
        }
        updateParticipantsList(livekitRoom)
      })

      livekitRoom.on(RoomEvent.TrackUnsubscribed, (track: Track, publication, participant) => {
        track.detach().forEach((el) => el.remove())
        updateParticipantsList(livekitRoom)
      })

      livekitRoom.on(RoomEvent.TrackMuted, () => {
        updateParticipantsList(livekitRoom)
      })

      livekitRoom.on(RoomEvent.TrackUnmuted, () => {
        updateParticipantsList(livekitRoom)
      })

      livekitRoom.on(RoomEvent.LocalTrackPublished, () => {
        updateParticipantsList(livekitRoom)
      })

      livekitRoom.on(RoomEvent.LocalTrackUnpublished, () => {
        updateParticipantsList(livekitRoom)
      })

      // Handle Data Messages (Mute All, Kick)
      livekitRoom.on(RoomEvent.DataReceived, (payload: Uint8Array, participant) => {
        try {
          const str = new TextDecoder().decode(payload)
          const data = JSON.parse(str)

          if (data.type === "MUTE_ALL") {
            // If we are not the host who sent it, mute our mic
            if (livekitRoom.localParticipant.identity !== participant?.identity) {
              livekitRoom.localParticipant.setMicrophoneEnabled(false)
              setIsMuted(true)
            }
          } else if (data.type === "KICK") {
            if (data.target === livekitRoom.localParticipant.identity) {
              livekitRoom.disconnect()
            }
          }
        } catch (err) {
          console.warn("Failed to process LiveKit data message:", err)
        }
      })

      // 4. Connect to LiveKit SFU
      await livekitRoom.connect(tokenData.server_url, tokenData.token)

      // 5. Publish camera & microphone
      if (!initialVideoOff) {
        try {
          await livekitRoom.localParticipant.setCameraEnabled(true)
          setIsVideoOff(false)
        } catch (camErr) {
          console.warn("Could not enable camera on start:", camErr)
          setIsVideoOff(true)
        }
      } else {
        await livekitRoom.localParticipant.setCameraEnabled(false)
      }

      if (!initialMuted) {
        try {
          await livekitRoom.localParticipant.setMicrophoneEnabled(true)
          setIsMuted(false)
        } catch (micErr) {
          console.warn("Could not enable mic on start:", micErr)
          setIsMuted(true)
        }
      } else {
        await livekitRoom.localParticipant.setMicrophoneEnabled(false)
      }

      updateParticipantsList(livekitRoom)
    } catch (err: any) {
      console.error("LiveKit connection error:", err)
      setError(err?.message || "Failed to connect to LiveKit room")
      setIsConnected(false)
    } finally {
      setIsConnecting(false)
    }
  }, [meetingCode, displayName, initialMuted, initialVideoOff, isConnecting, onDisconnected, updateParticipantsList])

  // Toggle Microphone
  const toggleMicrophone = useCallback(async () => {
    if (!roomRef.current) return
    const next = !isMuted
    try {
      await roomRef.current.localParticipant.setMicrophoneEnabled(!next)
      setIsMuted(next)
      updateParticipantsList(roomRef.current)
    } catch (err) {
      console.error("Failed to toggle microphone:", err)
    }
  }, [isMuted, updateParticipantsList])

  // Toggle Camera
  const toggleCamera = useCallback(async () => {
    if (!roomRef.current) return
    const next = !isVideoOff
    try {
      await roomRef.current.localParticipant.setCameraEnabled(!next)
      setIsVideoOff(next)
      updateParticipantsList(roomRef.current)
    } catch (err) {
      console.error("Failed to toggle camera:", err)
    }
  }, [isVideoOff, updateParticipantsList])

  // Host: Mute All
  const muteAll = useCallback(async () => {
    if (!roomRef.current || !isHost) return
    try {
      const message = JSON.stringify({ type: "MUTE_ALL" })
      const payload = new TextEncoder().encode(message)
      await roomRef.current.localParticipant.publishData(payload as any, {
        reliable: true,
      })
    } catch (err) {
      console.error("Failed to send mute all:", err)
    }
  }, [isHost])

  // Host: Remove Participant
  const removeParticipant = useCallback(async (targetIdentity: string) => {
    if (!roomRef.current || !isHost) return
    try {
      const message = JSON.stringify({ type: "KICK", target: targetIdentity })
      const payload = new TextEncoder().encode(message)
      await roomRef.current.localParticipant.publishData(payload as any, {
        reliable: true,
      })
    } catch (err) {
      console.error("Failed to remove participant:", err)
    }
  }, [isHost])

  // Leave room
  const leaveRoom = useCallback(async () => {
    if (roomRef.current) {
      roomRef.current.disconnect()
      roomRef.current = null
    }
    // Clean up attached audio elements
    document.querySelectorAll("audio[id^='audio-']").forEach((el) => el.remove())
    setIsConnected(false)
    setParticipants([])
  }, [])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (roomRef.current) {
        roomRef.current.disconnect()
        roomRef.current = null
      }
      document.querySelectorAll("audio[id^='audio-']").forEach((el) => el.remove())
    }
  }, [])

  return {
    room,
    isConnected,
    isConnecting,
    error,
    isHost,
    isMuted,
    isVideoOff,
    participants,
    connect,
    toggleMicrophone,
    toggleCamera,
    muteAll,
    removeParticipant,
    leaveRoom,
  }
}
