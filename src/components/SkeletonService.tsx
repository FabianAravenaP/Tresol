"use client"

import { Card, CardContent, CardHeader } from "@/components/uib/card"

export function SkeletonService() {
  return (
    <Card className="shadow-xl border-primary/5 rounded-[2.5rem] overflow-hidden bg-white dark:bg-zinc-900 animate-pulse">
      <CardHeader className="pb-4 pt-8 px-8 border-b border-muted/50">
        <div className="flex justify-between items-start">
          <div className="space-y-3">
            <div className="h-6 w-32 bg-muted rounded-full" />
            <div className="h-4 w-24 bg-muted/60 rounded-full" />
          </div>
          <div className="space-y-2 text-right">
             <div className="h-3 w-16 bg-muted/40 rounded-full ml-auto" />
             <div className="h-6 w-20 bg-muted/60 rounded-full" />
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-8 space-y-8">
        <div className="relative pl-8 space-y-8 before:content-[''] before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-[2px] before:bg-muted/30">
          <div className="space-y-2">
            <div className="h-3 w-20 bg-muted/40 rounded-full" />
            <div className="h-6 w-48 bg-muted/60 rounded-full" />
          </div>
          <div className="space-y-2">
            <div className="h-3 w-20 bg-muted/40 rounded-full" />
            <div className="h-6 w-48 bg-muted/60 rounded-full" />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4 pt-4">
          <div className="h-16 bg-muted/20 rounded-2xl" />
          <div className="h-16 bg-muted/20 rounded-2xl" />
        </div>
        <div className="h-14 bg-muted/30 rounded-2xl mt-4" />
      </CardContent>
    </Card>
  )
}