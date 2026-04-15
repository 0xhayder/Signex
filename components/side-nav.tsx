"use client"

import { ArrowLeftRight, Clock } from "lucide-react"
import { Button } from "@/components/ui/button"

interface SideNavProps {
  activeTab: string
  onTabChange: (tab: string) => void
  ongoingCount?: number
}

const NAV_ITEMS = [
  { id: "swap", icon: ArrowLeftRight, label: "Trade" },
  { id: "ongoing", icon: Clock, label: "Ongoing" },
]

export function SideNav({ activeTab, onTabChange, ongoingCount = 0 }: SideNavProps) {
  return (
    <div className="flex flex-col gap-1 p-1">
      {NAV_ITEMS.map((item) => {
        const Icon = item.icon
        const isActive = activeTab === item.id || (item.id === "swap" && activeTab !== "ongoing")
        const showBadge = item.id === "ongoing" && ongoingCount > 0

        return (
          <Button
            key={item.id}
            variant="ghost"
            size="icon"
            onClick={() => onTabChange(item.id)}
            className={`relative h-10 w-10 rounded-lg ${
              isActive
                ? "bg-secondary text-foreground"
                : "text-muted-foreground hover:bg-secondary/50 hover:text-foreground"
            }`}
            title={item.label}
          >
            <Icon className="h-5 w-5" />
            {showBadge && (
              <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-[1rem] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
                {ongoingCount}
              </span>
            )}
          </Button>
        )
      })}
    </div>
  )
}
