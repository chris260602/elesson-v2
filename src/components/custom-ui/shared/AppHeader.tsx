"use client"
import { Separator } from "@/components/ui/separator"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { useSession } from "next-auth/react"

export default function AppHeader() {
  const session = useSession();
    return(
        <header className="flex h-16 shrink-0 items-center gap-2 border-b transition-[width,height] ease-linear bg-white sticky top-0 z-10">
  <div className="flex w-full items-center justify-between px-4 lg:px-6">
    
    {/* Left Side: Navigation Controls */}
    <div className="flex items-center gap-2 min-w-0">
      <SidebarTrigger className="-ml-1 text-slate-500 hover:text-[#00b6dd] transition-colors" />
      <Separator
        orientation="vertical"
        className="mx-2 h-4 bg-slate-200"
      />
      {/* 1. Added 'truncate' to prevent long names from breaking the layout */}
      <h1 className="text-sm md:text-base font-semibold text-[#005669] truncate">
        Welcome, <span className="text-[#00b6dd]">{session.data?.user?.user.name}</span>
      </h1>
    </div>

    {/* Right Side: Optional (Status or Breadcrumbs) */}
    <div className="hidden sm:flex items-center gap-2">
       <div className="flex items-center gap-1.5 px-3 py-1 bg-slate-50 rounded-full border border-slate-100">
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-tight">System Live</span>
       </div>
    </div>

  </div>
</header>
    )
}