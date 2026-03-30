import * as React from "react"

import { ConnectionStatus } from "@/components/ConnectionStatus"
import { UserProfile } from "@/components/UserProfile"

export default function MobileLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex flex-col h-screen w-full max-w-md mx-auto bg-background relative border-x border-border/50 shadow-xl overflow-hidden">
      {/* Main Content Area */}
      <main className="flex-1 overflow-auto bg-[#FFF9F0] dark:bg-zinc-950">
        <div className="p-0">
          {children}
        </div>
      </main>
      
      {/* Branding Overlay / Footer */}
      <footer className="absolute bottom-4 left-0 w-full flex justify-center pointer-events-none opacity-20 group hover:opacity-100 transition-opacity">
        <p className="text-[8px] font-black text-slate-400 uppercase tracking-[0.4em]">Powered by Fabian Aravena</p>
      </footer>
    </div>
  )
}
