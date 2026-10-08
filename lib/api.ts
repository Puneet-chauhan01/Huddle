/**
 * Normalize and construct base API URL from environment variable
 * Defaults to http://localhost:8000/api for local development.
 * In production, NEXT_PUBLIC_API_URL should be set in Vercel to:
 * https://<your-railway-app>.up.railway.app/api (or without /api)
 */
function getApiBaseUrl(): string {
  let url = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api'
  url = url.trim().replace(/\/+$/, '')
  // If the user provided the backend domain without /api, append /api for route mapping
  if (!url.endsWith('/api')) {
    url = `${url}/api`
  }
  return url
}

const API_BASE_URL = getApiBaseUrl()

export class ApiError extends Error {
  status: number
  constructor(message: string, status: number) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

export interface BackendMeeting {
  id: number
  meeting_code: string
  host_id: number
  title: string
  description?: string | null
  meeting_type: 'instant' | 'scheduled'
  scheduled_at?: string | null
  duration_minutes: number
  status: 'scheduled' | 'active' | 'ended' | 'cancelled'
  created_at: string
  started_at?: string | null
  ended_at?: string | null
}

export interface BackendParticipant {
  id: number
  meeting_id: number
  user_id?: number | null
  display_name: string
  role: 'host' | 'participant'
  joined_at: string
  left_at?: string | null
}

export interface BackendMeetingDetail extends BackendMeeting {
  host: {
    id: number
    name: string
    email?: string | null
    avatar_url?: string | null
    created_at: string
  }
  participants: BackendParticipant[]
}

export interface LiveKitTokenResponse {
  token: string
  server_url: string
  room_name: string
  identity: string
  display_name: string
  is_host: boolean
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`
  let res: Response
  try {
    res = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(options.headers || {}),
      },
    })
  } catch (networkError: any) {
    throw new ApiError(
      networkError?.message || 'Network error: Failed to connect to server',
      0
    )
  }

  if (!res.ok) {
    let errorDetail = res.statusText || 'Request failed'
    try {
      const errorJson = await res.json()
      if (typeof errorJson?.detail === 'string') {
        errorDetail = errorJson.detail
      } else if (Array.isArray(errorJson?.detail)) {
        errorDetail = errorJson.detail.map((d: any) => d.msg || JSON.stringify(d)).join(', ')
      }
    } catch {}

    throw new ApiError(errorDetail, res.status)
  }

  return res.json()
}

export const api = {
  async getHealth(): Promise<{ status: string }> {
    return request<{ status: string }>('/health')
  },

  async createInstantMeeting(title = 'Instant Meeting', durationMinutes = 60): Promise<BackendMeeting> {
    return request<BackendMeeting>('/meetings', {
      method: 'POST',
      body: JSON.stringify({ title, duration_minutes: durationMinutes }),
    })
  },

  async createMeeting(params?: { title?: string; duration_minutes?: number }): Promise<BackendMeeting> {
    return this.createInstantMeeting(params?.title, params?.duration_minutes)
  },

  async scheduleMeeting(payload: {
    title: string
    description?: string
    duration_minutes: number
    scheduled_at: string
  }): Promise<BackendMeeting> {
    return request<BackendMeeting>('/meetings/schedule', {
      method: 'POST',
      body: JSON.stringify(payload),
    })
  },

  async getUpcomingMeetings(): Promise<BackendMeeting[]> {
    return request<BackendMeeting[]>('/meetings/upcoming', { cache: 'no-store' })
  },

  async getRecentMeetings(): Promise<BackendMeeting[]> {
    return request<BackendMeeting[]>('/meetings/recent', { cache: 'no-store' })
  },

  async getMeeting(meetingCode: string): Promise<BackendMeetingDetail> {
    return request<BackendMeetingDetail>(`/meetings/${encodeURIComponent(meetingCode)}`, { cache: 'no-store' })
  },

  async joinMeeting(meetingCode: string, displayName: string): Promise<BackendMeetingDetail> {
    return request<BackendMeetingDetail>(`/meetings/${encodeURIComponent(meetingCode)}/join`, {
      method: 'POST',
      body: JSON.stringify({ display_name: displayName }),
    })
  },

  async leaveMeeting(meetingCode: string, displayName: string): Promise<{ status: string }> {
    return request<{ status: string }>(
      `/meetings/${encodeURIComponent(meetingCode)}/leave`,
      {
        method: 'POST',
        body: JSON.stringify({ display_name: displayName }),
      }
    ).catch(() => ({ status: 'left' }))
  },

  async getMeetingToken(meetingCode: string, displayName: string, identity?: string): Promise<LiveKitTokenResponse> {
    return request<LiveKitTokenResponse>(`/meetings/${encodeURIComponent(meetingCode)}/token`, {
      method: 'POST',
      body: JSON.stringify({ display_name: displayName, identity }),
    })
  },
}
