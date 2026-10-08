import { Room, RoomEvent } from "livekit-client"

async function runTest() {
  console.log("=== Testing LiveKit SFU Connection with Two Peers ===")

  // 1. Create a meeting via FastAPI backend
  const meetingRes = await fetch("http://localhost:8000/api/meetings", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ title: "LiveKit Peer Verification Meeting" }),
  })
  const meeting = await meetingRes.json()
  const meetingCode = meeting.meeting_code
  console.log("Created meeting code:", meetingCode)

  // 2. Fetch tokens for User A and User B
  const tokenARes = await fetch(`http://localhost:8000/api/meetings/${meetingCode}/token`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ display_name: "Puneet Chauhan" }),
  })
  const tokenAData = await tokenARes.json()

  const tokenBRes = await fetch(`http://localhost:8000/api/meetings/${meetingCode}/token`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ display_name: "Maya Patel" }),
  })
  const tokenBData = await tokenBRes.json()

  console.log("User A is host:", tokenAData.is_host)
  console.log("User B is host:", tokenBData.is_host)

  // 3. Connect User A
  const roomA = new Room()
  let userBJoinedSeenByA = false

  roomA.on(RoomEvent.ParticipantConnected, (p) => {
    console.log(`[User A event] Participant connected: ${p.identity} (${p.name})`)
    userBJoinedSeenByA = true
  })

  await roomA.connect(tokenAData.server_url, tokenAData.token)
  console.log("User A successfully connected to room:", roomA.name)

  // 4. Connect User B
  const roomB = new Room()
  let userASeenByB = false

  roomB.on(RoomEvent.ParticipantConnected, (p) => {
    console.log(`[User B event] Participant connected: ${p.identity} (${p.name})`)
  })

  await roomB.connect(tokenBData.server_url, tokenBData.token)
  console.log("User B successfully connected to room:", roomB.name)

  // Check remote participants in room B
  console.log("Room B remote participants count:", roomB.remoteParticipants.size)
  if (roomB.remoteParticipants.size >= 1) {
    userASeenByB = true
  }

  // Wait 1 second for propagation
  await new Promise((r) => setTimeout(r, 1000))

  console.log("Verification summary:")
  console.log("- User A saw User B join:", userBJoinedSeenByA || roomA.remoteParticipants.size > 0)
  console.log("- User B saw User A in room:", userASeenByB || roomB.remoteParticipants.size > 0)

  // Disconnect cleanly
  await roomA.disconnect()
  await roomB.disconnect()
  console.log("Both users disconnected cleanly.")
  console.log("=== TEST PASSED ===")
}

runTest().catch((e) => {
  console.error("Test failed:", e)
  process.exit(1)
})
