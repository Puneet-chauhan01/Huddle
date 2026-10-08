import { MeetingActions } from '@/components/dashboard/meeting-actions'
import { Navbar } from '@/components/dashboard/navbar'
import { ProfileCard } from '@/components/dashboard/profile-card'
import { RecentMeetings } from '@/components/dashboard/recent-meetings'
import { UpcomingMeetings } from '@/components/dashboard/upcoming-meetings'
import { MeetingProvider } from '@/components/dashboard/meeting-provider'

export default function HomePage() {
  return (
    <MeetingProvider>
      <div className="min-h-screen bg-white">
        <Navbar />
        <main className="mx-auto grid w-full max-w-[1320px] gap-7 px-5 py-10 sm:px-8 lg:grid-cols-[minmax(0,1fr)_410px] lg:items-start">
          <div className="flex flex-col gap-7 lg:order-1">
            <ProfileCard />
            <UpcomingMeetings />
            <RecentMeetings />
          </div>
          <div className="lg:sticky lg:top-8 lg:order-2">
            <MeetingActions />
          </div>
        </main>
      </div>
    </MeetingProvider>
  )
}
