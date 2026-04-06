import * as React from "react"

import { ConnectionStatus } from "@/components/ConnectionStatus"
import { UserProfile } from "@/components/UserProfile"

export default function MobileLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-slate-100 dark:bg-zinc-900 flex justify-center items-start md:py-8 px-4">
      <div className="mobile-app-shell flex flex-col h-[100dvh] md:h-[850px] w-full bg-background relative border-x border-border/50 shadow-2xl overflow-hidden md:rounded-[3rem]">
        {/* Main Content Area */}
        <main className="flex-1 overflow-auto bg-[#FFF9F0] dark:bg-zinc-950 scrollbar-hide">
          <div className="p-0">
            {children}
          </div>
        </main>
        
        {/* Branding Overlay / Footer */}
        <footer className="absolute bottom-4 left-0 w-full flex justify-center pointer-events-none opacity-10 group hover:opacity-100 transition-opacity">
          <p className="text-[8px] font-black text-slate-400 uppercase tracking-[0.4em]">Powered by Fabian Aravena</p>
        </footer>
      </div>
    </div>
  )
}
