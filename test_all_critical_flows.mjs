import puppeteer from "puppeteer-core"

const CHROME_PATH = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe"

async function delay(ms) {
  return new Promise((r) => setTimeout(r, ms))
}

async function runFullAuditSuite() {
  console.log("=== COMPREHENSIVE REQUIREMENTS AUDIT & USER FLOWS TEST ===")

  const launchArgs = [
    "--no-sandbox",
    "--disable-setuid-sandbox",
    "--use-fake-ui-for-media-stream",
    "--use-fake-device-for-media-stream",
    "--allow-file-access-from-files",
    "--disable-web-security",
  ]

  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: "new",
    args: launchArgs,
  })

  try {
    const page = await browser.newPage()

    // 1. DASHBOARD & NAVBAR
    console.log("\n[TEST 1] Testing Dashboard, Navbar, Profile/Settings...")
    await page.goto("http://localhost:3000", { waitUntil: "networkidle0" })
    const hasNavbar = await page.$("header")
    const hasSettings = await page.evaluate(() => document.body.innerText.includes("Settings"))
    const hasProfile = await page.evaluate(() => document.body.innerText.includes("Puneet Chauhan"))
    console.log("- Navbar exists:", !!hasNavbar)
    console.log("- Settings placeholder exists:", hasSettings)
    console.log("- Profile exists:", hasProfile)
    if (!hasNavbar || !hasSettings || !hasProfile) throw new Error("Dashboard UI missing core elements")

    // 2. INVALID MEETING ID
    console.log("\n[TEST 2] Testing Join Modal with Invalid Meeting ID...")
    await page.evaluate(() => {
      const btn = Array.from(document.querySelectorAll("button")).find((b) => b.innerText.includes("Join"))
      if (btn) btn.click()
    })
    await delay(1000)

    // Type invalid ID and name
    await page.type("input#meetingId", "invalid999code")
    await page.type("input#displayName", "Test User")
    await page.evaluate(() => {
      const btn = Array.from(document.querySelectorAll("button")).find((b) => b.innerText === "Join" && b.type === "submit")
      if (btn) btn.click()
    })
    await delay(2000)
    const errorText = await page.evaluate(() => document.body.innerText)
    const hasError = errorText.includes("Meeting not found") || errorText.includes("Invalid")
    console.log("- Invalid meeting error displayed properly:", hasError)
    if (!hasError) throw new Error("Join did not reject invalid ID")

    // Close join modal
    await page.keyboard.press("Escape")
    await delay(500)

    // 3. SCHEDULE MEETING & UPCOMING DISPLAY
    console.log("\n[TEST 3] Testing Schedule Meeting (persist to SQLite & display in Upcoming)...")
    await page.evaluate(() => {
      const btn = Array.from(document.querySelectorAll("button")).find((b) => b.innerText.includes("Schedule"))
      if (btn) btn.click()
    })
    await delay(1000)

    const scheduleTopic = `Sprint Planning ${Date.now().toString().slice(-4)}`
    await page.evaluate((topic) => {
      function setReactValue(input, val) {
        const lastValue = input.value
        input.value = val
        const event = new Event("input", { bubbles: true })
        // React 16+ tracker
        const tracker = input._valueTracker
        if (tracker) {
          tracker.setValue(lastValue)
        }
        input.dispatchEvent(event)
        input.dispatchEvent(new Event("change", { bubbles: true }))
      }

      const titleInput = document.querySelector("input#title")
      const dateInput = document.querySelector("input#date")
      const timeInput = document.querySelector("input#time")

      if (titleInput) setReactValue(titleInput, topic)
      if (dateInput) setReactValue(dateInput, "2026-10-15")
      if (timeInput) setReactValue(timeInput, "14:30")

      const form = document.querySelector("form")
      if (form) form.requestSubmit()
    }, scheduleTopic)
    await delay(3000)

    const scheduleSuccess = await page.evaluate(() => {
      return document.body.innerText.includes("Meeting Scheduled!") && document.body.innerText.includes("Invite Link")
    })
    console.log("- Schedule modal displays generated ID and invite link:", scheduleSuccess)
    if (!scheduleSuccess) throw new Error("Schedule success state did not display invite link")

    // Click Done to close
    await page.evaluate(() => {
      const btn = Array.from(document.querySelectorAll("button")).find((b) => b.innerText === "Done")
      if (btn) btn.click()
    })
    await delay(1500)

    // Verify appears in Upcoming Meetings
    const inUpcoming = await page.evaluate((topic) => {
      return document.body.innerText.includes(topic)
    }, scheduleTopic)
    console.log("- Newly scheduled meeting appears in Upcoming Meetings list:", inUpcoming)
    if (!inUpcoming) throw new Error("Scheduled meeting did not appear in Upcoming list")

    // 4. INSTANT MEETING & REDIRECT
    console.log("\n[TEST 4] Testing New Meeting creation & redirect...")
    await page.evaluate(() => {
      const btn = Array.from(document.querySelectorAll("button")).find((b) => b.innerText.includes("New Meeting"))
      if (btn) btn.click()
    })
    await page.waitForNavigation({ waitUntil: "networkidle0" })
    const meetingUrlA = page.url()
    const meetingCode = meetingUrlA.split("/meeting/")[1].split("?")[0]
    console.log("- Instant meeting created with code:", meetingCode)
    if (!meetingCode || meetingCode.length < 5) throw new Error("Invalid meeting code generated")

    // 5. PRE-JOIN & JOINING AS USER A
    console.log("\n[TEST 5] Testing Pre-Join Screen & Joining as User A...")
    await page.waitForSelector("text/Ready to join?", { timeout: 10000 })
    await page.click("text/Join Meeting")
    await page.waitForSelector("text/Connected", { timeout: 15000 })
    console.log("- User A joined meeting room successfully!")

    // 6. JOINING AS USER B VIA INVITE URL
    console.log("\n[TEST 6] Testing User B joining with invite URL...")
    const browserB = await puppeteer.launch({
      executablePath: CHROME_PATH,
      headless: "new",
      args: launchArgs,
    })
    const pageB = await browserB.newPage()

    const inviteUrlB = `http://localhost:3000/meeting/${meetingCode}?name=Maya%20Patel`
    console.log("Navigating User B to invite URL:", inviteUrlB)
    await pageB.goto(inviteUrlB, { waitUntil: "networkidle0" })
    await pageB.waitForSelector("text/Ready to join?", { timeout: 10000 })
    await pageB.click("text/Join Meeting")
    await pageB.waitForSelector("text/Connected", { timeout: 15000 })
    console.log("- User B joined via invite URL successfully!")

    // 7. TWO PARTICIPANTS VISIBILITY
    console.log("\n[TEST 7] Testing Two Participants in Room...")
    await delay(3000)
    const userASeesMaya = await page.evaluate(() => document.body.innerText.includes("Maya Patel"))
    const userBSeesPuneet = await pageB.evaluate(() => document.body.innerText.includes("Puneet Chauhan"))
    console.log("- User A sees User B (Maya Patel):", userASeesMaya)
    console.log("- User B sees User A (Puneet Chauhan):", userBSeesPuneet)
    if (!userASeesMaya || !userBSeesPuneet) throw new Error("Participants not mutually visible")

    // 8. CONTROLS: MUTE, CAMERA, HOST CONTROLS
    console.log("\n[TEST 8] Testing Controls: Mute, Camera, Host Controls...")
    // Toggle Mute
    await page.evaluate(() => {
      const btn = Array.from(document.querySelectorAll("button")).find((b) => b.innerText.includes("Mute"))
      if (btn) btn.click()
    })
    await delay(1000)
    const isUnmuteNow = await page.evaluate(() => Array.from(document.querySelectorAll("button")).some((b) => b.innerText.includes("Unmute")))
    console.log("- Mute toggled successfully:", isUnmuteNow)

    // Toggle Camera
    await page.evaluate(() => {
      const btn = Array.from(document.querySelectorAll("button")).find((b) => b.innerText.includes("Video"))
      if (btn) btn.click()
    })
    await delay(1000)
    const isStartVideoNow = await page.evaluate(() => Array.from(document.querySelectorAll("button")).some((b) => b.innerText.includes("Start Video")))
    console.log("- Camera toggled successfully:", isStartVideoNow)

    // Host Controls: Open Participants Panel
    await page.evaluate(() => {
      const btn = Array.from(document.querySelectorAll("button")).find((b) => b.innerText.includes("Participants"))
      if (btn) btn.click()
    })
    await delay(1000)
    const hasMuteAll = await page.evaluate(() => document.body.innerText.includes("Mute All"))
    console.log("- Host Controls ('Mute All' button) visible to Host:", hasMuteAll)
    if (!hasMuteAll) throw new Error("Host controls not rendered for host")

    // 9. LEAVE
    console.log("\n[TEST 9] Testing Leave for both users...")
    await pageB.evaluate(() => {
      const btn = Array.from(document.querySelectorAll("button")).find((b) => b.innerText.includes("Leave"))
      if (btn) btn.click()
    })
    await pageB.waitForNavigation({ waitUntil: "networkidle0" })
    console.log("- User B redirected to:", pageB.url())

    await page.evaluate(() => {
      const btn = Array.from(document.querySelectorAll("button")).find((b) => b.innerText.includes("Leave"))
      if (btn) btn.click()
    })
    await page.waitForNavigation({ waitUntil: "networkidle0" })
    console.log("- User A redirected to:", page.url())

    await browserB.close()
    await browser.close()

    console.log("\n==========================================")
    console.log("ALL 9 CRITICAL AUDIT USER FLOWS PASSED!")
    console.log("==========================================")
  } catch (err) {
    console.error("Test failed:", err)
    await browser.close()
    process.exit(1)
  }
}

runFullAuditSuite()
