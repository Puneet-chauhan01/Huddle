import { Settings, Video } from 'lucide-react'
import { user } from '@/lib/meetings'

export function Navbar() {
  return (
    <header className="border-b border-zoom-ink/[0.07] bg-white">
      <div className="mx-auto flex h-20 w-full max-w-[1320px] items-center justify-between px-5 sm:px-8">
        <div className="flex items-center gap-6 sm:gap-12">
          <a
            href="#"
            aria-label="Huddle home"
            className="flex items-center gap-2 text-zoom-blue"
          >
            <span className="flex size-9 items-center justify-center rounded-[10px] bg-zoom-blue text-white">
              <Video className="size-5" strokeWidth={2.5} aria-hidden="true" />
            </span>
            <span className="text-[30px] font-black leading-none tracking-tight">
              huddle
            </span>
          </a>

          <nav aria-label="Primary">
            <a
              href="#"
              aria-current="page"
              className="rounded-xl bg-zoom-blue-soft px-5 py-2.5 text-[18px] font-bold text-zoom-blue"
            >
              Home
            </a>
          </nav>
        </div>

        <div className="flex items-center gap-3 sm:gap-5">
          <button
            type="button"
            className="flex items-center gap-2 rounded-xl px-3 py-2 text-[18px] font-bold text-zoom-ink transition-colors hover:bg-zoom-surface"
          >
            <Settings className="size-5" aria-hidden="true" />
            <span className="hidden sm:inline">Settings</span>
            <span className="sr-only sm:hidden">Settings</span>
          </button>
          <button
            type="button"
            aria-label={`Profile: ${user.name}`}
            className="flex size-10 items-center justify-center rounded-[10px] bg-zoom-teal text-[20px] font-bold text-white"
          >
            {user.initial}
          </button>
        </div>
      </div>
    </header>
  )
}
