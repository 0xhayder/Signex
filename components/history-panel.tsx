"use client"

import { useState } from "react"
import Image from "next/image"
import { CheckCircle2, XCircle, Clock, ArrowRight, ExternalLink } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useTrades } from "@/hooks/use-trades"
import { abbreviateAddress } from "@/hooks/use-tokens"

const statusConfig = {
  pending: {
    icon: Clock,
    label: "Pending",
    color: "text-yellow-500",
    bg: "bg-yellow-500/10",
  },
  executed: {
    icon: CheckCircle2,
    label: "Completed",
    color: "text-green-500",
    bg: "bg-green-500/10",
  },
  cancelled: {
    icon: XCircle,
    label: "Cancelled",
    color: "text-red-500",
    bg: "bg-red-500/10",
  },
  expired: {
    icon: Clock,
    label: "Expired",
    color: "text-orange-500",
    bg: "bg-orange-500/10",
  },
}

function formatTradeAmount(amount: string, decimals: number = 18): string {
  const value = Number(amount) / Math.pow(10, decimals)
  return value.toLocaleString(undefined, { maximumFractionDigits: 6 })
}

function formatDate(dateString: string): string {
  const date = new Date(dateString)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffMins < 60) return `${diffMins}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  return `${diffDays}d ago`
}

export function HistoryPanel() {
  const { trades } = useTrades()
  const [activeTab, setActiveTab] = useState("all")

  const completedTrades = trades.filter(t => t.status === 'executed')
  const cancelledTrades = trades.filter(t => t.status === 'cancelled')
  const expiredTrades = trades.filter(t => t.status === 'expired')

  const getFilteredTrades = () => {
    switch (activeTab) {
      case 'completed':
        return completedTrades
      case 'cancelled':
        return cancelledTrades
      case 'expired':
        return expiredTrades
      default:
        return trades.filter(t => t.status !== 'pending')
    }
  }

  const filteredTrades = getFilteredTrades()

  return (
    <div className="w-full max-w-4xl">
      <div className="overflow-hidden rounded-xl border-border bg-card border-0">
        <div className="border-b border-border px-6 py-5">
          <h2 className="text-2xl font-semibold text-foreground">Trade History</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            View all your past trades
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <div className="px-6 py-4 bg-gradient-to-b from-secondary/30 to-transparent">
            <TabsList className="bg-secondary/40 h-auto p-1.5 rounded-full gap-1 w-full">
              <TabsTrigger 
                value="all" 
                className="rounded-full px-4 py-2 text-sm font-medium transition-all duration-200 ease-out data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-md hover:bg-secondary/60 hover:text-foreground text-muted-foreground"
              >
                All ({trades.filter(t => t.status !== 'pending').length})
              </TabsTrigger>
              <TabsTrigger 
                value="completed"
                className="rounded-full px-4 py-2 text-sm font-medium transition-all duration-200 ease-out data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-md hover:bg-secondary/60 hover:text-foreground text-muted-foreground"
              >
                Completed ({completedTrades.length})
              </TabsTrigger>
              <TabsTrigger 
                value="cancelled"
                className="rounded-full px-4 py-2 text-sm font-medium transition-all duration-200 ease-out data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-md hover:bg-secondary/60 hover:text-foreground text-muted-foreground"
              >
                Cancelled ({cancelledTrades.length})
              </TabsTrigger>
              <TabsTrigger 
                value="expired"
                className="rounded-full px-4 py-2 text-sm font-medium transition-all duration-200 ease-out data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-md hover:bg-secondary/60 hover:text-foreground text-muted-foreground"
              >
                Expired ({expiredTrades.length})
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value={activeTab} className="mt-0">
            {filteredTrades.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 px-4">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-secondary/50 mb-4">
                  <Clock className="h-8 w-8 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">No trades yet</h3>
                <p className="text-sm text-muted-foreground text-center max-w-sm">
                  {activeTab === 'completed' && "You haven't completed any trades yet."}
                  {activeTab === 'cancelled' && "You haven't cancelled any trades yet."}
                  {activeTab === 'expired' && "You don't have any expired trades."}
                  {activeTab === 'all' && "Your trade history will appear here once you complete your first trade."}
                </p>
              </div>
            ) : (
              <div className="divide-y divide-border">
                {filteredTrades.map((trade) => {
                  const status = statusConfig[trade.status as keyof typeof statusConfig]
                  const StatusIcon = status.icon

                  return (
                    <div
                      key={trade.id}
                      className="flex items-center justify-between p-5 transition-colors hover:bg-secondary/20"
                    >
                      <div className="flex items-center gap-6">
                        <div className="flex items-center gap-3">
                          {trade.tokenALogo ? (
                            <Image
                              src={trade.tokenALogo || "/placeholder.svg"}
                              alt={trade.tokenASymbol || 'Token'}
                              width={40}
                              height={40}
                              className="rounded-full"
                              unoptimized
                            />
                          ) : (
                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                              <span className="text-sm font-bold text-primary">
                                {trade.tokenASymbol?.charAt(0) || 'T'}
                              </span>
                            </div>
                          )}
                          <div className="flex flex-col">
                            <span className="text-sm font-medium text-foreground">
                              {formatTradeAmount(trade.amountA, trade.tokenADecimals)} {trade.tokenASymbol}
                            </span>
                            <span className="text-xs text-muted-foreground">Base</span>
                          </div>
                        </div>

                        <ArrowRight className="h-4 w-4 text-muted-foreground" />

                        <div className="flex items-center gap-3">
                          {trade.tokenBLogo ? (
                            <Image
                              src={trade.tokenBLogo || "/placeholder.svg"}
                              alt={trade.tokenBSymbol || 'Token'}
                              width={40}
                              height={40}
                              className="rounded-full"
                              unoptimized
                            />
                          ) : (
                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-accent/10">
                              <span className="text-sm font-bold text-accent">
                                {trade.tokenBSymbol?.charAt(0) || 'T'}
                              </span>
                            </div>
                          )}
                          <div className="flex flex-col">
                            <span className="text-sm font-medium text-foreground">
                              {formatTradeAmount(trade.amountB, trade.tokenBDecimals)} {trade.tokenBSymbol}
                            </span>
                            <span className="text-xs text-muted-foreground">Base</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-4">
                        <div className="hidden flex-col items-end sm:flex">
                          <span className="text-sm font-mono text-muted-foreground">{abbreviateAddress(trade.taker)}</span>
                          <span className="text-xs text-muted-foreground">{formatDate(trade.createdAt)}</span>
                        </div>
                        <div className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 ${status.bg}`}>
                          <StatusIcon className={`h-3 w-3 ${status.color}`} />
                          <span className={`text-xs font-medium ${status.color}`}>{status.label}</span>
                        </div>
                        
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
