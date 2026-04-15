"use client"

import { useState } from "react"
import { useAccount } from "wagmi"
import { Header } from "@/components/header"
import { SwapCard } from "@/components/swap-card"
import { SideNav } from "@/components/side-nav"
import { HistoryPanel } from "@/components/history-panel"
import { StatusPanel } from "@/components/status-panel"
import { HowItWorksPanel } from "@/components/how-it-works"
import { useTrades } from "@/hooks/use-trades"

export default function Home() {
  const [activeTab, setActiveTab] = useState("swap")
  const { isConnected } = useAccount()
  const { trades } = useTrades()
  const ongoingCount = trades.filter(t => t.status === 'pending').length

  const renderContent = () => {
    switch (activeTab) {
      case "history":
        return <HistoryPanel />
      case "status":
        return <StatusPanel />
      case "how-it-works":
        return <HowItWorksPanel />
      default:
        return (
          <div className="flex items-start gap-2 ml-52 mb-0 mt-[-35px]">
            <SideNav activeTab={activeTab} onTabChange={setActiveTab} ongoingCount={ongoingCount} />
            <SwapCard isConnected={isConnected} activeView={activeTab} onViewChange={setActiveTab} />
          </div>
        )
    }
  }

  return (
    <div className="relative h-screen bg-background overflow-hidden">

      {/* Content */}
      <div className="relative z-10 flex h-screen flex-col">
        <Header
          activeTab={activeTab}
          onTabChange={setActiveTab}
        />

        <main 
          className="flex flex-1 h-full items-start justify-center px-4 py-8 md:py-12 overflow-y-auto md:pt-[46px] md:pb-7"
          style={{
            background: `
              radial-gradient(ellipse 120% 80% at bottom left, rgba(59, 130, 246, 0.12), rgba(59, 130, 246, 0.06) 50%, transparent 75%),
              radial-gradient(ellipse 120% 80% at bottom right, rgba(59, 130, 246, 0.12), rgba(59, 130, 246, 0.06) 50%, transparent 75%),
              rgba(7, 15, 36, 1)
            `
          }}
        >
          {renderContent()}
        </main>
      </div>
    </div>
  )
}
