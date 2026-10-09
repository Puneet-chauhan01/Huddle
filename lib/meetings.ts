import type { BackendMeeting } from './api'

export type UpcomingMeeting = {
  id: string
  title: string
  month: string
  day: string
  dateLabel: string
  time: string
  duration: string
  meetingId: string
  action: 'Start' | 'Join'
}

export type RecentMeeting = {
  id: string
  title: string
  dateTime: string
  duration: string
  participants: number
  host: string
}

export const user = {
  name: 'Puneet Chauhan',
  initial: 'P',
  plan: 'Basic',
  personalMeetingId: '482 915 3720',
}

export function formatBackendToUpcoming(m: BackendMeeting): UpcomingMeeting {
  const dateObj = m.scheduled_at ? new Date(m.scheduled_at) : new Date(m.created_at)
  const isToday = new Date().toDateString() === dateObj.toDateString()
  
  const month = dateObj.toLocaleString('en-US', { month: 'short' })
  const day = dateObj.getDate().toString()
  const weekdayShort = dateObj.toLocaleDateString('en-US', { weekday: 'short' })
  const dateLabel = isToday 
    ? `Today, ${weekdayShort} ${month} ${day}`
    : `${weekdayShort}, ${month} ${day}`

  const startTimeStr = dateObj.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
  const endDateObj = new Date(dateObj.getTime() + m.duration_minutes * 60000)
  const endTimeStr = endDateObj.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })

  return {
    id: String(m.id),
    title: m.title,
    month,
    day,
    dateLabel,
    time: `${startTimeStr} – ${endTimeStr}`,
    duration: `${m.duration_minutes} min`,
    meetingId: m.meeting_code,
    action: m.host_id === 1 ? 'Start' : 'Join'
  }
}

export function formatBackendToRecent(m: BackendMeeting): RecentMeeting {
  const dateObj = m.started_at ? new Date(m.started_at) : (m.scheduled_at ? new Date(m.scheduled_at) : new Date(m.created_at))
  const weekdayShort = dateObj.toLocaleDateString('en-US', { weekday: 'short' })
  const month = dateObj.toLocaleString('en-US', { month: 'short' })
  const day = dateObj.getDate().toString()
  const timeStr = dateObj.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })

  return {
    id: String(m.id),
    title: m.title,
    dateTime: `${weekdayShort}, ${month} ${day} · ${timeStr}`,
    duration: `${m.duration_minutes} min`,
    participants: 2,
    host: m.host_id === 1 ? 'You' : 'Host'
  }
}

export const upcomingMeetings: UpcomingMeeting[] = [
  {
    id: 'u1',
    title: 'Product Design Sync',
    month: 'Oct',
    day: '8',
    dateLabel: 'Today, Thu Oct 8',
    time: '2:00 PM – 2:45 PM',
    duration: '45 min',
    meetingId: '842 3917 6205',
    action: 'Start',
  },
  {
    id: 'u2',
    title: 'Weekly Engineering Standup',
    month: 'Oct',
    day: '9',
    dateLabel: 'Fri, Oct 9',
    time: '10:00 AM – 10:30 AM',
    duration: '30 min',
    meetingId: '916 5530 1182',
    action: 'Join',
  },
  {
    id: 'u3',
    title: 'Client Onboarding Call',
    month: 'Oct',
    day: '12',
    dateLabel: 'Mon, Oct 12',
    time: '11:30 AM – 12:30 PM',
    duration: '1 hr',
    meetingId: '271 8846 3094',
    action: 'Start',
  },
  {
    id: 'u4',
    title: 'Quarterly Planning Review',
    month: 'Oct',
    day: '14',
    dateLabel: 'Wed, Oct 14',
    time: '3:00 PM – 4:30 PM',
    duration: '1 hr 30 min',
    meetingId: '605 2271 7748',
    action: 'Join',
  },
]

export const recentMeetings: RecentMeeting[] = [
  {
    id: 'r1',
    title: 'Sprint Retrospective',
    dateTime: 'Wed, Oct 7 · 4:00 PM',
    duration: '55 min',
    participants: 8,
    host: 'You',
  },
  {
    id: 'r2',
    title: 'Marketing Campaign Kickoff',
    dateTime: 'Tue, Oct 6 · 1:30 PM',
    duration: '1 hr 5 min',
    participants: 12,
    host: 'Maya Patel',
  },
  {
    id: 'r3',
    title: '1:1 with Arjun',
    dateTime: 'Mon, Oct 5 · 9:30 AM',
    duration: '25 min',
    participants: 2,
    host: 'You',
  },
  {
    id: 'r4',
    title: 'Customer Feedback Workshop',
    dateTime: 'Fri, Oct 2 · 11:00 AM',
    duration: '1 hr 20 min',
    participants: 15,
    host: 'Sofia Rossi',
  },
]
