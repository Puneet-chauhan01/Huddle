import { user } from '@/lib/meetings'

export function ProfileCard() {
  return (
    <section
      aria-label="Profile"
      className="flex items-center justify-between gap-4 rounded-3xl bg-white p-8 shadow-[0_2px_18px_rgba(15,23,42,0.07)]"
    >
      <div className="flex items-center gap-5">
        <div
          aria-hidden="true"
          className="flex size-[98px] shrink-0 items-center justify-center rounded-3xl bg-zoom-teal text-[56px] font-medium text-white"
        >
          {user.initial}
        </div>
        <div>
          <h1 className="text-[30px] font-black leading-tight text-zoom-ink">
            {user.name}
          </h1>
          <p className="mt-1 text-[18px] text-zoom-muted">
            Plan: <span className="text-zoom-ink">{user.plan}</span>
          </p>
        </div>
      </div>
      <button
        type="button"
        className="hidden rounded-full bg-zoom-blue-soft px-6 py-2.5 text-[17px] font-bold text-zoom-blue transition-colors hover:bg-zoom-blue/15 sm:block"
      >
        Edit Profile
      </button>
    </section>
  )
}
