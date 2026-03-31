"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

const Switch = React.forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement>
>(({ className, ...props }, ref) => (
  <label className={cn("relative inline-flex items-center cursor-pointer", className)}>
    <input
      type="checkbox"
      className="sr-only peer"
      ref={ref}
      {...props}
    />
    <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20 dark:peer-focus:ring-primary/30 rounded-full peer dark:bg-zinc-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:after:w-4 after:transition-all dark:border-zinc-600 peer-checked:bg-primary"></div>
  </label>
))
Switch.displayName = "Switch"

export { Switch }