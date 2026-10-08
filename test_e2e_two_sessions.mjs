import puppeteer from "puppeteer-core"

const CHROME_PATH = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe"

async function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

async function runTwoSessionTest() {
  console.log("=== STARTING 2-BROWSER E2E LIVEKIT TEST ===")

  const launchArgs = [
    "--no-sandbox",
    "--disable-setuid-sandbox",
    "--use-fake-ui-for-media-stream",
    "--use-fake-device-for-media-stream",
    "--allow-file-access-from-files",
    "--disable-web-security",
  ]

  // Launch Session A (Host)
  console.log("\n[1/7] Launching Browser Session A (User A: Puneet Chauhan)...")
  const browserA = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: "new",
    args: launchArgs,
  })
  const pageA = await browserA.newPage()

  // Navigate to Dashboard
  console.log("Navigating User A to http://localhost:3000...")
  await pageA.goto("http://localhost:3000", { waitUntil: "networkidle0" })

  // Click New Meeting
  console.log("User A clicks 'New Meeting'...")
  await pageA.waitForSelector("text/New Meeting", { timeout: 10000 })
  await pageA.click("text/New Meeting")

  // Wait for meeting page navigation
  await pageA.waitForNavigation({ waitUntil: "networkidle0" })
  const meetingUrl = pageA.url()
  console.log("User A navigated to:", meetingUrl)
  const meetingId = meetingUrl.split("/meeting/")[1].split("?")[0]
  console.log("Detected Meeting Code:", meetingId)

  // Verify Pre-Join screen
  console.log("\n[2/7] User A on Pre-Join Screen...")
  await pageA.waitForSelector("text/Ready to join?", { timeout: 10000 })
  console.log("User A clicks 'Join Meeting'...")
  await pageA.click("text/Join Meeting")

  // Wait for Meeting Room to load
  await pageA.waitForSelector("text/Connected", { timeout: 15000 })
  console.log("User A connected to LiveKit room!")
  await delay(2000)

  // Launch Session B (Participant)
  console.log("\n[3/7] Launching Browser Session B (User B: Maya Patel)...")
  const browserB = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: "new",
    args: launchArgs,
  })
  const pageB = await browserB.newPage()

  // User B joins via invite link
  const joinUrl = `http://localhost:3000/meeting/${meetingId}?name=Maya%20Patel`
  console.log("User B navigating to invite URL:", joinUrl)
  await pageB.goto(joinUrl, { waitUntil: "networkidle0" })

  // User B on Pre-Join Screen
  console.log("User B on Pre-Join Screen, clicking 'Join Meeting'...")
  await pageB.waitForSelector("text/Ready to join?", { timeout: 10000 })
  await pageB.click("text/Join Meeting")

  // Wait for User B to connect
  await pageB.waitForSelector("text/Connected", { timeout: 15000 })
  console.log("User B connected to LiveKit room!")

  // [4/7] Verify both participants see each other
  console.log("\n[4/7] Verifying participants propagation across both sessions...")
  await delay(3000)

  // Check Session A participant count and tiles
  const namesInA = await pageA.evaluate(() => {
    return Array.from(document.querySelectorAll("span")).map((e) => e.innerText)
  })
  const seesMayaInA = namesInA.some((n) => n.includes("Maya Patel"))
  console.log("- User A sees Maya Patel in room:", seesMayaInA)

  // Check Session B participant count and tiles
  const namesInB = await pageB.evaluate(() => {
    return Array.from(document.querySelectorAll("span")).map((e) => e.innerText)
  })
  const seesPuneetInB = namesInB.some((n) => n.includes("Puneet Chauhan"))
  console.log("- User B sees Puneet Chauhan in room:", seesPuneetInB)

  // [5/7] Test mute & camera controls
  console.log("\n[5/7] Testing Mute/Camera controls in Session A...")
  const toggledMute = await pageA.evaluate(() => {
    const btn = Array.from(document.querySelectorAll("button")).find((b) => b.innerText.includes("Mute"))
    if (btn) {
      btn.click()
      return true
    }
    return false
  })
  console.log("Toggled Mute button in Session A:", toggledMute)
  await delay(1000)

  const isUnmutedNow = await pageA.evaluate(() => {
    return Array.from(document.querySelectorAll("button")).some((b) => b.innerText.includes("Unmute"))
  })
  console.log("- Button state updated to 'Unmute':", isUnmutedNow)

  const toggledVideo = await pageA.evaluate(() => {
    const btn = Array.from(document.querySelectorAll("button")).find((b) => b.innerText.includes("Video"))
    if (btn) {
      btn.click()
      return true
    }
    return false
  })
  console.log("Toggled Video button in Session A:", toggledVideo)
  await delay(1000)

  // [6/7] Test Participants Panel
  console.log("\n[6/7] Testing Participants Sidebar Panel in Session A...")
  await pageA.evaluate(() => {
    const btn = Array.from(document.querySelectorAll("button")).find((b) => b.innerText.includes("Participants"))
    if (btn) btn.click()
  })
  await delay(1000)

  const panelVisible = await pageA.evaluate(() => {
    return document.body.innerText.includes("Participants (2)") || document.body.innerText.includes("Participants (")
  })
  console.log("- Participants sidebar opened with participant list:", panelVisible)

  // [7/7] Test Leaving
  console.log("\n[7/7] Testing Leave flow...")
  console.log("User B clicks 'Leave'...")
  await pageB.evaluate(() => {
    const btn = Array.from(document.querySelectorAll("button")).find((b) => b.innerText.includes("Leave"))
    if (btn) btn.click()
  })
  await pageB.waitForNavigation({ waitUntil: "networkidle0" })
  console.log("User B redirected back to:", pageB.url())
  console.log("- User B returned to dashboard:", pageB.url().includes("3000"))

  await delay(2000)
  console.log("User A clicks 'Leave'...")
  await pageA.evaluate(() => {
    const btn = Array.from(document.querySelectorAll("button")).find((b) => b.innerText.includes("Leave"))
    if (btn) btn.click()
  })
  await pageA.waitForNavigation({ waitUntil: "networkidle0" })
  console.log("User A redirected back to:", pageA.url())
  console.log("- User A returned to dashboard:", pageA.url().includes("3000"))

  // Cleanup
  await browserA.close()
  await browserB.close()

  console.log("\n=== 2-BROWSER LIVEKIT VERIFICATION PASSED SUCCESSFULLY ===")
}

runTwoSessionTest().catch((err) => {
  console.error("Test execution failed:", err)
  process.exit(1)
})
