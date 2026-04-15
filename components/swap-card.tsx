"use client"

import { useState, useEffect, useCallback } from "react"
import { Info, Shield, Clock, Copy, Check, ChevronDown, ArrowRight, Pencil, ArrowLeft, Search, Loader2, Plus, X, Users } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useTokens, abbreviateAddress, type Token, getTokenDecimals } from "@/hooks/use-tokens"
import { useTokenBalances, type TokenWithBalance } from "@/hooks/use-token-balances"
import { useNFTs, getNFTImage, getNFTName } from "@/hooks/use-nfts"
import { useTrades, formatTradeAmount, getTimeRemaining } from "@/hooks/use-trades"
import type { StoredTrade } from "@/lib/contracts"
import type { NFT } from "@/app/api/nfts/route"
import { useDebounce } from "@/hooks/use-debounce"
import { useAccount } from "wagmi"
import { ConnectButton } from "@rainbow-me/rainbowkit"
import Image from "next/image"
import { useToast } from "@/hooks/use-toast"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { AddressBookDialog } from "@/components/address-book-dialog"
import { InfoDropdown } from "@/components/settings-dropdown"

type TradeType = "token-token" | "nft-nft" | "token-nft" | "fiat-p2p"

const BASE_CHAIN = {
  id: "base",
  name: "Base",
  color: "#0052FF",
  chainId: 8453,
  logoUrl: "/base-logo.png",
}

const TRADE_TYPES = [
  { id: "token-token" as TradeType, label: "Token / Token", locked: false },
  { id: "nft-nft" as TradeType, label: "NFT / NFT", locked: false },
  { id: "token-nft" as TradeType, label: "Token / NFT", locked: false },
  { id: "fiat-p2p" as TradeType, label: "Fiat P2P", locked: true },
]

const EXPIRY_OPTIONS = [
  { value: "1", label: "1 hour" },
  { value: "6", label: "6 hours" },
  { value: "12", label: "12 hours" },
  { value: "24", label: "24 hours" },
  { value: "48", label: "48 hours" },
  { value: "72", label: "72 hours" },
]

const SAMPLE_TRADES: any[] = []



interface SwapCardProps {
  isConnected: boolean
  onConnect: () => void
  activeView: string
  onViewChange: (view: string) => void
}

// Image cache to track loaded images
const imageCache = new Set<string>()

function TokenLogo({ token, size = 40 }: { token: Token; size?: number }) {
  const [imgError, setImgError] = useState(false)
  const [imgLoaded, setImgLoaded] = useState(imageCache.has(token.logoUrl))
  
  const fallback = (
    <div 
      className="flex items-center justify-center rounded-full" 
      style={{ 
        width: size, 
        height: size, 
        backgroundColor: `${BASE_CHAIN.color}20` 
      }}
    >
      <span 
        className="font-bold" 
        style={{ 
          color: BASE_CHAIN.color,
          fontSize: size * 0.35 
        }}
      >
        {token.symbol.charAt(0)}
      </span>
    </div>
  )
  
  if (!token.logoUrl || imgError) {
    return fallback
  }
  
  return (
    <div className="relative" style={{ width: size, height: size }}>
      {!imgLoaded && (
        <div 
          className="absolute inset-0 flex items-center justify-center rounded-full" 
          style={{ backgroundColor: `${BASE_CHAIN.color}10` }}
        >
          <span 
            className="font-bold opacity-50" 
            style={{ color: BASE_CHAIN.color, fontSize: size * 0.35 }}
          >
            {token.symbol.charAt(0)}
          </span>
        </div>
      )}
      <Image
        src={token.logoUrl || "/placeholder.svg"}
        alt={token.symbol}
        width={size}
        height={size}
        className={`rounded-full ${imgLoaded ? 'opacity-100' : 'opacity-0'}`}
        onLoad={() => {
          imageCache.add(token.logoUrl)
          setImgLoaded(true)
        }}
        onError={() => setImgError(true)}
        priority={!imgLoaded}
        unoptimized
      />
    </div>
  )
}

function TokenCard({
  token,
  onClick,
  selected = false
}: {
  token: Token | TokenWithBalance
  onClick: () => void
  selected?: boolean
}) {
  const hasBalance = 'balance' in token && token.balance
  
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex w-full items-center gap-3 rounded-lg p-3 transition-colors ${
        selected ? "bg-primary/20" : "hover:bg-secondary"
      }`}
    >
      <div className="relative">
        <TokenLogo token={token} size={40} />
        <div className="absolute -bottom-0.5 -right-0.5 h-4 w-4 rounded-full border-2 border-card bg-white overflow-hidden">
          <Image
            src={BASE_CHAIN.logoUrl || "/placeholder.svg"}
            alt="Base"
            width={16}
            height={16}
            className="h-full w-full object-cover"
            unoptimized
          />
        </div>
      </div>
      <div className="flex-1 text-left">
        <div className="font-medium text-foreground">{token.symbol}</div>
        <div className="text-sm text-muted-foreground">{token.name}</div>
      </div>
      <div className="flex items-center gap-2">
        {hasBalance && (
          <div className="text-right">
            <div className="text-sm font-medium text-foreground">
              {(token as TokenWithBalance).balanceFormatted}
            </div>
            {(token as TokenWithBalance).balanceUSD != null && (
              <div className="text-xs text-muted-foreground">
                ${(token as TokenWithBalance).balanceUSD!.toFixed(2)}
              </div>
            )}
          </div>
        )}
        {selected && <Check className="h-5 w-5 text-primary" />}
      </div>
    </button>
  )
}

function NFTCard({ nft }: { nft: NFT }) {
  return (
    <div className="flex items-center gap-3">
      <div className="relative">
        <Image
          src={getNFTImage(nft) || "/placeholder.svg"}
          alt={getNFTName(nft)}
          width={48}
          height={48}
          className="rounded-lg object-cover"
          unoptimized
        />
        <div className="absolute -bottom-0.5 -right-0.5 h-4 w-4 rounded-full border-2 border-card bg-white overflow-hidden">
          <Image
            src={BASE_CHAIN.logoUrl || "/placeholder.svg"}
            alt="Base"
            width={16}
            height={16}
            className="h-full w-full object-cover"
            unoptimized
          />
        </div>
      </div>
      <div className="flex-1 text-left">
        <p className="font-medium text-foreground">{getNFTName(nft)}</p>
        <p className="text-xs text-muted-foreground">Token ID: {nft.tokenId}</p>
      </div>
      <p className="font-mono text-xs text-muted-foreground">
        {abbreviateAddress(nft.contract.address)}
      </p>
    </div>
  )
}

export function SwapCard({ isConnected, onConnect, activeView, onViewChange }: SwapCardProps) {
  const { address } = useAccount()
  const { trades, isLoading: tradesLoading, createTrade, executeTrade, cancelTrade } = useTrades()
  const { tokens: userTokens, isLoading: balancesLoading } = useTokenBalances(address)
  const { toast } = useToast()
  const [tradeType, setTradeType] = useState<TradeType>("token-token")
  const [fromToken, setFromToken] = useState<Token | null>(null)
  const [toToken, setToToken] = useState<Token | null>(null)
  const [sendAmount, setSendAmount] = useState("")
  const [receiveAmount, setReceiveAmount] = useState("")
  const [counterpartyAddress, setCounterpartyAddress] = useState("")
  const [copied, setCopied] = useState(false)
  const [tradeTypeOpen, setTradeTypeOpen] = useState(false)
  const [expiryHours, setExpiryHours] = useState("24")
  const [expiryEditing, setExpiryEditing] = useState(false)
  const [isCreatingTrade, setIsCreatingTrade] = useState(false)
  const [executingTradeId, setExecutingTradeId] = useState<string | null>(null)
  const [cancellingTradeId, setCancellingTradeId] = useState<string | null>(null)
  
  // Dialog state
  const [addressBookOpen, setAddressBookOpen] = useState(false)
  
  // NFT fields
  const [sendNft, setSendNft] = useState<NFT | null>(null)
  const [receiveNft, setReceiveNft] = useState<NFT | null>(null)
  const [nftSearch, setNftSearch] = useState("")
  const [selectingNftFor, setSelectingNftFor] = useState<"from" | "to" | null>(null)
  const [receiveNftOwner, setReceiveNftOwner] = useState("")
  const [receiveNftOwnerLocked, setReceiveNftOwnerLocked] = useState(false)
  const [tokenNftDirection, setTokenNftDirection] = useState<"token-first" | "nft-first">("token-first")
  const [sendNftContract, setSendNftContract] = useState("")
  const [sendNftId, setSendNftId] = useState("")
  const [receiveNftContract, setReceiveNftContract] = useState("")
  const [receiveNftId, setReceiveNftId] = useState("")
  const debouncedNftSearch = useDebounce(nftSearch, 300)
  
  // Token selection state
  const [selectingFor, setSelectingFor] = useState<"from" | "to" | null>(null)
  const [tokenSearch, setTokenSearch] = useState("")
  const [chainSearch, setChainSearch] = useState("")
  const debouncedSearch = useDebounce(tokenSearch, 300)
  
  // Custom token dialog state
  const [customTokenOpen, setCustomTokenOpen] = useState(false)
  const [customName, setCustomName] = useState("")
  const [customSymbol, setCustomSymbol] = useState("")
  const [customAddress, setCustomAddress] = useState("")
  
  // Fetch tokens
  const { tokens, isLoading } = useTokens(
    debouncedSearch,
    debouncedSearch ? 'search' : 'popular'
  )
  
  // Fetch NFTs
  const sendNftOwner = selectingNftFor === "from" ? address : null
  const receiveNftFetchOwner = selectingNftFor === "to" && receiveNftOwnerLocked ? receiveNftOwner : null
  const { nfts: sendNfts, isLoading: sendNftsLoading } = useNFTs(sendNftOwner || null, debouncedNftSearch)
  const { nfts: receiveNfts, isLoading: receiveNftsLoading } = useNFTs(receiveNftFetchOwner, debouncedNftSearch)

  const showOngoing = activeView === "ongoing"
  const isSelecting = selectingFor !== null

  const handleSwap = async () => {
    if (!fromToken || !toToken || !sendAmount || !receiveAmount || !counterpartyAddress) return
    if (tradeType !== "token-token") return // Only token-token for now
    
    setIsCreatingTrade(true)
    try {
      await createTrade({
        taker: counterpartyAddress as `0x${string}`,
        tokenA: fromToken.address as `0x${string}`,
        tokenB: toToken.address as `0x${string}`,
        amountA: sendAmount,
        amountB: receiveAmount,
        tokenADecimals: getTokenDecimals(fromToken),
        tokenBDecimals: getTokenDecimals(toToken),
        tokenASymbol: fromToken.symbol,
        tokenBSymbol: toToken.symbol,
        tokenALogo: fromToken.logoUrl,
        tokenBLogo: toToken.logoUrl,
        expiryHours: Number(expiryHours)
      })

      toast({
        title: "Trade Created",
        description: `Your trade offer for ${fromToken.symbol} → ${toToken.symbol} has been created successfully.`,
      })

      // Reset form
      setFromToken(null)
      setToToken(null)
      setSendAmount("")
      setReceiveAmount("")
      setCounterpartyAddress("")
    } catch (error) {
      console.error("Failed to create trade:", error)
      toast({
        title: "Trade Failed",
        description: "Failed to create trade. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsCreatingTrade(false)
    }
  }

  const handleExecuteTrade = async (trade: StoredTrade) => {
  setExecutingTradeId(trade.id)
  try {
      await executeTrade(trade)
      toast({
        title: "Trade Executed",
        description: `Trade completed successfully for ${trade.tokenASymbol} → ${trade.tokenBSymbol}.`,
      })
    } catch (error) {
      console.error("Failed to execute trade:", error)
      toast({
        title: "Execution Failed",
        description: "Failed to execute trade. Please try again.",
        variant: "destructive",
      })
    } finally {
      setExecutingTradeId(null)
    }
  }

  const handleCancelTrade = async (trade: StoredTrade) => {
  setCancellingTradeId(trade.id)
  try {
      await cancelTrade(trade)
      toast({
        title: "Trade Cancelled",
        description: `Your trade for ${trade.tokenASymbol} → ${trade.tokenBSymbol} has been cancelled.`,
      })
    } catch (error) {
      console.error("Failed to cancel trade:", error)
      toast({
        title: "Cancellation Failed",
        description: "Failed to cancel trade. Please try again.",
        variant: "destructive",
      })
    } finally {
      setCancellingTradeId(null)
    }
  }

  const handleCopyAddress = () => {
    if (counterpartyAddress) {
      navigator.clipboard.writeText(counterpartyAddress)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const handleTokenSelect = useCallback((token: Token) => {
    if (selectingFor === "from") {
      setFromToken(token)
    } else {
      setToToken(token)
    }
    setSelectingFor(null)
    setTokenSearch("")
  }, [selectingFor])

  const handleBack = () => {
    setSelectingFor(null)
    setTokenSearch("")
  }

  const handleAddCustomToken = () => {
    if (!customName || !customSymbol || !customAddress || customAddress.length !== 42) return
    
    const customToken: Token = {
      id: customAddress,
      symbol: customSymbol.toUpperCase(),
      name: customName,
      address: customAddress,
      logoUrl: '',
      chainId: 8453,
    }
    
    handleTokenSelect(customToken)
    setCustomTokenOpen(false)
    setCustomName("")
    setCustomSymbol("")
    setCustomAddress("")
  }

  const handleTradeTypeChange = (newType: TradeType) => {
    setTradeType(newType)
    setTradeTypeOpen(false)
    // Reset fields when changing type
    setFromToken(null)
    setToToken(null)
    setSendAmount("")
    setReceiveAmount("")
    setSendNftContract("")
    setSendNftId("")
    setReceiveNftContract("")
    setReceiveNftId("")
  }

  // Build token lists: holdings first (with balance data), then remaining popular tokens
  const excludeToken = selectingFor === "from" ? toToken : fromToken
  const userTokenAddresses = new Set(userTokens.map(t => t.address.toLowerCase()))
  
  // Holdings = wallet tokens + popular tokens the user holds (with balance merged in)
  const filteredUserTokens = userTokens
    .filter(token => {
      if (excludeToken && token.address.toLowerCase() === excludeToken.address.toLowerCase()) return false
      return true
    })
    .map(walletToken => {
      // If this wallet token matches a popular token, use the popular token's metadata but keep wallet balance
      const popularMatch = tokens.find(t => t.address.toLowerCase() === walletToken.address.toLowerCase())
      if (popularMatch) {
        return { ...walletToken, logoUrl: popularMatch.logoUrl || walletToken.logoUrl, name: popularMatch.name || walletToken.name }
      }
      return walletToken
    })

  // Popular tokens that the user does NOT hold
  const filteredPopularTokens = tokens.filter(token => {
    if (excludeToken && token.address.toLowerCase() === excludeToken.address.toLowerCase()) return false
    if (userTokenAddresses.has(token.address.toLowerCase())) return false
    return true
  })

  // Combined list for search filtering etc
  const filteredTokens = [...filteredUserTokens, ...filteredPopularTokens]

  const isTokenFormValid = fromToken && toToken && sendAmount && receiveAmount && counterpartyAddress.length >= 42
  const isNftFormValid = sendNftContract && sendNftId && receiveNftContract && receiveNftId && counterpartyAddress.length >= 42
  const isTokenNftFormValid = fromToken && sendAmount && receiveNftContract && receiveNftId && counterpartyAddress.length >= 42
  
  const isFormValid = tradeType === "token-token" ? isTokenFormValid : tradeType === "nft-nft" ? isNftFormValid : isTokenNftFormValid

  const selectedTradeType = TRADE_TYPES.find((t) => t.id === tradeType)
  const selectedExpiry = EXPIRY_OPTIONS.find((e) => e.value === expiryHours)

  return (
    <div className="flex gap-3 transition-transform duration-300 ease-out" style={{ transform: isSelecting ? 'translateX(-140px)' : 'translateX(0)' }}>
      {/* Main Card */}
      <div className="w-[480px] rounded-xl bg-[rgba(8,28,51,1)]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b-2 border-[rgba(14,31,59,1)]]]]]">
          <div className="flex items-center gap-3">
            {isSelecting && (
              <button type="button" onClick={handleBack} className="text-muted-foreground hover:text-foreground">
                <ArrowLeft className="h-5 w-5" />
              </button>
            )}
            <h2 className="font-semibold text-foreground">
              {isSelecting
                ? selectingFor === "from" ? "You send" : "You receive"
                : showOngoing ? "Ongoing Trades" : "P2P Swap"}
            </h2>
          </div>
          {!showOngoing && !isSelecting && (
            <InfoDropdown>
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-8 w-8 text-muted-foreground hover:bg-secondary hover:text-foreground"
              >
                <Info className="h-4 w-4" />
              </Button>
            </InfoDropdown>
          )}
        </div>

        {/* Content */}
        <div className="p-5 border-0 rounded-full bg-[rgba(8,28,51,1)]">
          {/* Ongoing Trades View */}
          <div className={`transition-opacity duration-200 ${showOngoing ? "block" : "hidden"}`}>
            {tradesLoading ? (
              <div className="flex items-center justify-center py-16">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : trades.filter(t => t.status === 'pending').length === 0 ? (
              <div className="flex flex-col items-center py-16 text-center">
                <Clock className="mb-4 h-12 w-12 text-muted-foreground" />
                <p className="text-muted-foreground">No ongoing trades</p>
              </div>
            ) : (
              <div className="space-y-3">
                {trades.filter(t => t.status === 'pending').map((trade) => {
                  const isMaker = address?.toLowerCase() === trade.maker.toLowerCase()
                  const isTaker = address?.toLowerCase() === trade.taker.toLowerCase()
                  const isExpired = Number(trade.expiry) * 1000 < Date.now()
                  
                  return (
                    <div key={trade.id} className="rounded-lg p-4 bg-secondary">
                      <div className="flex items-center justify-between">
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
                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/20 text-sm font-bold text-primary">
                              {trade.tokenASymbol?.charAt(0) || 'T'}
                            </div>
                          )}
                          <div>
                            <span className="font-medium text-foreground">
                              {formatTradeAmount(trade.amountA, trade.tokenADecimals)} {trade.tokenASymbol}
                            </span>
                            <p className="text-xs text-muted-foreground">Base</p>
                          </div>
                        </div>
                        <ArrowRight className="h-5 w-5 text-muted-foreground" />
                        <div className="flex items-center gap-3">
                          <div className="text-right">
                            <span className="font-medium text-foreground">
                              {formatTradeAmount(trade.amountB, trade.tokenBDecimals)} {trade.tokenBSymbol}
                            </span>
                            <p className="text-xs text-muted-foreground">Base</p>
                          </div>
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
                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-accent/20 text-sm font-bold text-accent">
                              {trade.tokenBSymbol?.charAt(0) || 'T'}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="mt-4 flex items-center justify-between pt-4 border-t border-border/50">
                        <div className="flex items-center gap-2">
                          <span className={`rounded px-2 py-1 text-xs font-medium ${
                            isExpired ? "bg-red-500/20 text-red-400" : 
                            isTaker ? "bg-green-500/20 text-green-400" : "bg-blue-500/20 text-blue-400"
                          }`}>
                            {isExpired ? "Expired" : isTaker ? "Ready to Execute" : "Awaiting Taker"}
                          </span>
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Clock className="h-3 w-3" />
                            {getTimeRemaining(trade.expiry)}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {isTaker && !isExpired && (
                            <Button
                              size="sm"
                              onClick={() => handleExecuteTrade(trade)}
                              disabled={executingTradeId === trade.id}
                              className="h-8"
                            >
                              {executingTradeId === trade.id ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                "Execute"
                              )}
                            </Button>
                          )}
                          {isMaker && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleCancelTrade(trade)}
                              disabled={cancellingTradeId === trade.id}
                              className="h-8 bg-transparent"
                            >
                              {cancellingTradeId === trade.id ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                "Cancel"
                              )}
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* Token Selection View */}
          <div className={`transition-opacity duration-200 ${isSelecting && !showOngoing ? "block" : "hidden"}`}>
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    type="text"
                    placeholder="Search token name or paste address"
                    value={tokenSearch}
                    onChange={(e) => setTokenSearch(e.target.value)}
                    className="h-11 border-border bg-secondary pl-10"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => setCustomTokenOpen(true)}
                  className="flex h-11 w-11 items-center justify-center rounded-lg border border-border bg-secondary text-muted-foreground transition-colors hover:bg-secondary/80 hover:text-foreground"
                  title="Add custom token"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>
              
              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : filteredTokens.length === 0 ? (
                <div className="flex flex-col items-center gap-3 py-8 text-center">
                  <p className="text-sm text-muted-foreground">No tokens found</p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCustomTokenOpen(true)}
                    className="gap-2"
                  >
                    <Plus className="h-4 w-4" />
                    Add Custom Token
                  </Button>
                </div>
                ) : (
                  <div className="max-h-[320px] space-y-2 overflow-y-auto">
                    {/* Loading wallet tokens */}
                    {balancesLoading && address && (
                      <div className="flex items-center gap-2 px-3 py-2">
                        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                        <span className="text-xs text-muted-foreground">Loading wallet tokens...</span>
                      </div>
                    )}
                    {/* User Holdings Section */}
                    {filteredUserTokens.length > 0 && (
                      <div className="space-y-1">
                        <div className="px-3 py-1.5">
                          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                            Your Holdings
                          </span>
                        </div>
                        {filteredUserTokens.map((token) => (
                          <TokenCard
                            key={token.address}
                            token={token}
                            onClick={() => handleTokenSelect(token)}
                            selected={
                              (selectingFor === "from" && fromToken?.address === token.address) ||
                              (selectingFor === "to" && toToken?.address === token.address)
                            }
                          />
                        ))}
                      </div>
                    )}
                    
                    {/* Remaining Popular Tokens */}
                    {filteredPopularTokens.map((token) => (
                      <TokenCard
                        key={token.address}
                        token={token}
                        onClick={() => handleTokenSelect(token)}
                        selected={
                          (selectingFor === "from" && fromToken?.address === token.address) ||
                          (selectingFor === "to" && toToken?.address === token.address)
                        }
                      />
                    ))}
                  </div>
                )}
            </div>
          </div>

          {/* Trade Form View */}
          <div className={`transition-opacity duration-200 ${!showOngoing && !isSelecting ? "block" : "hidden"}`}>
            <div className="space-y-4">
              {/* Trade Type */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setTradeTypeOpen(!tradeTypeOpen)}
                  className="flex w-full items-center justify-between rounded-lg border-border px-4 py-3 border-0 bg-secondary"
                >
                  <span className="text-sm text-foreground">{selectedTradeType?.label}</span>
                  <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${tradeTypeOpen ? "rotate-180" : ""}`} />
                </button>
                  {tradeTypeOpen && (
                    <div className="absolute left-0 right-0 top-full z-50 mt-1 rounded-lg border py-1 shadow-lg border-[rgba(8,28,51,1)] bg-[rgba(8,28,51,1)]">
                      {TRADE_TYPES.map((type) => (
                        <button
                          key={type.id}
                          type="button"
                          onClick={() => !type.locked && handleTradeTypeChange(type.id)}
                          disabled={type.locked}
                          className={`flex w-full items-center justify-between px-4 py-2 text-sm rounded-lg relative group ${
                            type.locked 
                              ? "text-muted-foreground/50 cursor-not-allowed" 
                              : "text-foreground hover:bg-secondary"
                          }`}
                          title={type.locked ? "Coming Soon" : undefined}
                        >
                          <span className="flex items-center gap-2">
                            {type.label}
                            {type.locked && (
                              <span className="text-xs bg-yellow-500/20 text-yellow-500 px-2 py-0.5 rounded">
                                Coming Soon
                              </span>
                            )}
                          </span>
                          {tradeType === type.id && !type.locked && <Check className="h-4 w-4 text-primary" />}
                        </button>
                      ))}
                    </div>
                  )}
              </div>

              {/* Token/Token Form */}
              {tradeType === "token-token" && (
                <>
                  {/* You Send Token */}
                  <div className="rounded-xl p-4 bg-secondary">
                    <span className="mb-3 block text-xs text-muted-foreground font-semibold uppercase tracking-wide">You Send</span>
                    <button
                      type="button"
                      onClick={() => setSelectingFor("from")}
                      className="flex w-full items-center gap-3 transition-opacity hover:opacity-80"
                    >
                      {fromToken ? (
                        <>
                          <div className="relative">
                            <TokenLogo token={fromToken} size={40} />
                            <div className="absolute -bottom-0.5 -right-0.5 h-4 w-4 rounded-full border-2 border-card bg-white overflow-hidden">
                              <Image
                                src={BASE_CHAIN.logoUrl || "/placeholder.svg"}
                                alt="Base"
                                width={16}
                                height={16}
                                className="h-full w-full object-cover"
                                unoptimized
                              />
                            </div>
                          </div>
                          <div className="flex-1 text-left">
                            <p className="font-medium text-foreground">{fromToken.symbol}</p>
                            <p className="text-xs text-muted-foreground">{fromToken.name}</p>
                          </div>
                          <p className="font-mono text-xs text-muted-foreground">
                            {abbreviateAddress(fromToken.address)}
                          </p>
                        </>
                      ) : (
                        <>
                          <div className="relative">
                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted/50">
                              <div className="h-6 w-6 rounded-full bg-muted-foreground/20" />
                            </div>
                            <div className="absolute -bottom-0.5 -right-0.5 h-4 w-4 rounded-full border-2 border-card bg-white overflow-hidden">
                              <Image
                                src={BASE_CHAIN.logoUrl || "/placeholder.svg"}
                                alt="Base"
                                width={16}
                                height={16}
                                className="h-full w-full object-cover"
                                unoptimized
                              />
                            </div>
                          </div>
                          <span className="text-sm font-bold text-muted-foreground">Select token</span>
                        </>
                      )}
                    </button>
                    {fromToken && (() => {
                      const userToken = userTokens.find(t => t.address.toLowerCase() === fromToken.address.toLowerCase())
                      return (
                        <div className="mt-4 space-y-2">
                          <div className="relative">
                            <Input
                              type="number"
                              placeholder="0.0"
                              value={sendAmount}
                              onChange={(e) => setSendAmount(e.target.value)}
                              className="h-12 border-none text-2xl font-semibold focus-visible:ring-0 bg-secondary/40 pr-20"
                            />
                            {userToken && (
                              <button
                                type="button"
                                onClick={() => setSendAmount(userToken.balanceFormatted)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md bg-primary/15 px-2.5 py-1 text-xs font-semibold text-primary hover:bg-primary/25 transition-colors"
                              >
                                MAX
                              </button>
                            )}
                          </div>
                          {userToken && (
                            <div className="flex items-center justify-between px-1">
                              <span className="text-xs text-muted-foreground">
                                Balance: {userToken.balanceFormatted} {fromToken.symbol}
                              </span>
                              {userToken.balanceUSD != null && (
                                <span className="text-xs text-muted-foreground">
                                  ~${userToken.balanceUSD.toFixed(2)}
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      )
                    })()}
                  </div>

                  {/* You Receive Token */}
                  <div className="rounded-xl p-4 bg-secondary">
                    <span className="mb-3 block text-xs text-muted-foreground font-semibold uppercase tracking-wide">You Receive</span>
                    <button
                      type="button"
                      onClick={() => setSelectingFor("to")}
                      className="flex w-full items-center gap-3 transition-opacity hover:opacity-80"
                    >
                      {toToken ? (
                        <>
                          <div className="relative">
                            <TokenLogo token={toToken} size={40} />
                            <div className="absolute -bottom-0.5 -right-0.5 h-4 w-4 rounded-full border-2 border-card bg-white overflow-hidden">
                              <Image
                                src={BASE_CHAIN.logoUrl || "/placeholder.svg"}
                                alt="Base"
                                width={16}
                                height={16}
                                className="h-full w-full object-cover"
                                unoptimized
                              />
                            </div>
                          </div>
                          <div className="flex-1 text-left">
                            <p className="font-medium text-foreground">{toToken.symbol}</p>
                            <p className="text-xs text-muted-foreground">{toToken.name}</p>
                          </div>
                          <p className="font-mono text-xs text-muted-foreground">
                            {abbreviateAddress(toToken.address)}
                          </p>
                        </>
                      ) : (
                        <>
                          <div className="relative">
                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted/50">
                              <div className="h-6 w-6 rounded-full bg-muted-foreground/20" />
                            </div>
                            <div className="absolute -bottom-0.5 -right-0.5 h-4 w-4 rounded-full border-2 border-card bg-white overflow-hidden">
                              <Image
                                src={BASE_CHAIN.logoUrl || "/placeholder.svg"}
                                alt="Base"
                                width={16}
                                height={16}
                                className="h-full w-full object-cover"
                                unoptimized
                              />
                            </div>
                          </div>
                          <span className="text-sm font-bold text-[rgba(157,165,175,1)]">Select token</span>
                        </>
                      )}
                    </button>
                    {toToken && (
                      <div className="mt-4 flex items-center pt-2">
                        <Input
                          type="number"
                          placeholder="0"
                          value={receiveAmount}
                          onChange={(e) => setReceiveAmount(e.target.value)}
                          className="h-12 border-none text-2xl font-semibold focus-visible:ring-0 bg-secondary/40 backdrop-blur-sm backdrop-blur-sm"
                        />
                      </div>
                    )}
                  </div>
                </>
              )}

              {/* NFT/NFT Form */}
              {tradeType === "nft-nft" && (
                <>
                  {/* You Send NFT */}
                  <div className="rounded-xl p-4 bg-secondary">
                    <span className="mb-3 block text-xs text-muted-foreground font-semibold uppercase tracking-wide">You Send</span>
                    <button
                      type="button"
                      onClick={() => setSelectingNftFor("from")}
                      className="flex w-full items-center gap-3 transition-opacity hover:opacity-80"
                    >
                      {sendNft ? (
                        <>
                          <div className="relative">
                            <Image
                              src={getNFTImage(sendNft) || "/placeholder.svg"}
                              alt={getNFTName(sendNft)}
                              width={40}
                              height={40}
                              className="rounded-lg object-cover"
                              unoptimized
                            />
                            <div className="absolute -bottom-0.5 -right-0.5 h-4 w-4 rounded-full border-2 border-card bg-white overflow-hidden">
                              <Image
                                src={BASE_CHAIN.logoUrl || "/placeholder.svg"}
                                alt="Base"
                                width={16}
                                height={16}
                                className="h-full w-full object-cover"
                                unoptimized
                              />
                            </div>
                          </div>
                          <div className="flex-1 text-left">
                            <p className="font-medium text-foreground">{getNFTName(sendNft)}</p>
                            <p className="text-xs text-muted-foreground">Token ID: {sendNft.tokenId}</p>
                          </div>
                          <p className="font-mono text-xs text-muted-foreground">
                            {abbreviateAddress(sendNft.contract.address)}
                          </p>
                        </>
                      ) : (
                        <>
                          <div className="relative">
                            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted/50">
                              <div className="h-6 w-6 rounded-lg bg-muted-foreground/20" />
                            </div>
                            <div className="absolute -bottom-0.5 -right-0.5 h-4 w-4 rounded-full border-2 border-card bg-white overflow-hidden">
                              <Image
                                src={BASE_CHAIN.logoUrl || "/placeholder.svg"}
                                alt="Base"
                                width={16}
                                height={16}
                                className="h-full w-full object-cover"
                                unoptimized
                              />
                            </div>
                          </div>
                          <span className="text-sm font-bold text-muted-foreground">Select NFT</span>
                        </>
                      )}
                    </button>
                  </div>

                  {/* You Receive NFT */}
                  <div className="rounded-xl p-4 bg-secondary">
                    <span className="mb-3 block text-xs text-muted-foreground font-semibold uppercase tracking-wide">You Receive</span>
                    {!receiveNftOwnerLocked ? (
                      <div className="space-y-3">
                        <Input
                          type="text"
                          placeholder="Enter counterparty wallet address"
                          value={receiveNftOwner}
                          onChange={(e) => setReceiveNftOwner(e.target.value)}
                          className="h-11 border-none bg-secondary/40 font-mono text-sm"
                        />
                        <Button
                          onClick={() => setReceiveNftOwnerLocked(true)}
                          disabled={!receiveNftOwner || receiveNftOwner.length !== 42}
                          className="w-full"
                        >
                          Confirm Address
                        </Button>
                      </div>
                    ) : (
                      <>
                        <button
                          type="button"
                          onClick={() => setSelectingNftFor("to")}
                          className="flex w-full items-center gap-3 transition-opacity hover:opacity-80"
                        >
                          {receiveNft ? (
                            <>
                              <div className="relative">
                                <Image
                                  src={getNFTImage(receiveNft) || "/placeholder.svg"}
                                  alt={getNFTName(receiveNft)}
                                  width={40}
                                  height={40}
                                  className="rounded-lg object-cover"
                                  unoptimized
                                />
                                <div className="absolute -bottom-0.5 -right-0.5 h-4 w-4 rounded-full border-2 border-card bg-white overflow-hidden">
                                  <Image
                                    src={BASE_CHAIN.logoUrl || "/placeholder.svg"}
                                    alt="Base"
                                    width={16}
                                    height={16}
                                    className="h-full w-full object-cover"
                                    unoptimized
                                  />
                                </div>
                              </div>
                              <div className="flex-1 text-left">
                                <p className="font-medium text-foreground">{getNFTName(receiveNft)}</p>
                                <p className="text-xs text-muted-foreground">Token ID: {receiveNft.tokenId}</p>
                              </div>
                              <p className="font-mono text-xs text-muted-foreground">
                                {abbreviateAddress(receiveNft.contract.address)}
                              </p>
                            </>
                          ) : (
                            <>
                              <div className="relative">
                                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted/50">
                                  <div className="h-6 w-6 rounded-lg bg-muted-foreground/20" />
                                </div>
                                <div className="absolute -bottom-0.5 -right-0.5 h-4 w-4 rounded-full border-2 border-card bg-white overflow-hidden">
                                  <Image
                                    src={BASE_CHAIN.logoUrl || "/placeholder.svg"}
                                    alt="Base"
                                    width={16}
                                    height={16}
                                    className="h-full w-full object-cover"
                                    unoptimized
                                  />
                                </div>
                              </div>
                              <span className="text-sm font-bold text-muted-foreground">Select NFT</span>
                            </>
                          )}
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setReceiveNftOwnerLocked(false)
                            setReceiveNft(null)
                          }}
                          className="mt-2 text-xs text-muted-foreground hover:text-foreground"
                        >
                          Change address: {abbreviateAddress(receiveNftOwner)}
                        </button>
                      </>
                    )}
                  </div>
                </>
              )}

              {/* Token/NFT Form */}
              {tradeType === "token-nft" && (
                <>
                  {/* Direction Toggle */}
                  <div className="flex items-center gap-2 p-1.5 rounded-xl bg-secondary/50">
                    <button
                      type="button"
                      onClick={() => setTokenNftDirection("token-first")}
                      className={`flex-1 rounded-lg px-4 py-2.5 text-sm font-medium transition-all ${
                        tokenNftDirection === "token-first"
                          ? "bg-primary text-primary-foreground shadow-sm"
                          : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      Send Token
                    </button>
                    <button
                      type="button"
                      onClick={() => setTokenNftDirection("nft-first")}
                      className={`flex-1 rounded-lg px-4 py-2.5 text-sm font-medium transition-all ${
                        tokenNftDirection === "nft-first"
                          ? "bg-primary text-primary-foreground shadow-sm"
                          : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      Send NFT
                    </button>
                  </div>

                  {tokenNftDirection === "token-first" ? (
                    <>
                      {/* You Send Token */}
                      <div className="rounded-xl p-4 bg-secondary">
                        <span className="mb-3 block text-xs text-muted-foreground font-semibold uppercase tracking-wide">You Send</span>
                        <button
                          type="button"
                          onClick={() => setSelectingFor("from")}
                          className="flex w-full items-center gap-3 transition-opacity hover:opacity-80"
                        >
                          {fromToken ? (
                            <>
                              <div className="relative">
                                <TokenLogo token={fromToken} size={40} />
                                <div className="absolute -bottom-0.5 -right-0.5 h-4 w-4 rounded-full border-2 border-card bg-white overflow-hidden">
                                  <Image
                                    src={BASE_CHAIN.logoUrl || "/placeholder.svg"}
                                    alt="Base"
                                    width={16}
                                    height={16}
                                    className="h-full w-full object-cover"
                                    unoptimized
                                  />
                                </div>
                              </div>
                              <div className="flex-1 text-left">
                                <p className="font-medium text-foreground">{fromToken.symbol}</p>
                                <p className="text-xs text-muted-foreground">{fromToken.name}</p>
                              </div>
                              <p className="font-mono text-xs text-muted-foreground">
                                {abbreviateAddress(fromToken.address)}
                              </p>
                            </>
                          ) : (
                            <>
                              <div className="relative">
                                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted/50">
                                  <div className="h-6 w-6 rounded-full bg-muted-foreground/20" />
                                </div>
                                <div className="absolute -bottom-0.5 -right-0.5 h-4 w-4 rounded-full border-2 border-card bg-white overflow-hidden">
                                  <Image
                                    src={BASE_CHAIN.logoUrl || "/placeholder.svg"}
                                    alt="Base"
                                    width={16}
                                    height={16}
                                    className="h-full w-full object-cover"
                                    unoptimized
                                  />
                                </div>
                              </div>
                              <span className="text-sm font-bold text-muted-foreground">Select token</span>
                            </>
                          )}
                        </button>
                        {fromToken && (
                          <div className="mt-4 flex items-center gap-2 pt-2">
                            <Input
                              type="number"
                              placeholder="0"
                              value={sendAmount}
                              onChange={(e) => setSendAmount(e.target.value)}
                              className="h-12 border-none text-2xl font-semibold focus-visible:ring-0 bg-secondary/40"
                            />
  {fromToken && (() => {
    const userToken = userTokens.find(t => t.address.toLowerCase() === fromToken.address.toLowerCase())
    return userToken ? (
      <button 
        type="button" 
        onClick={() => setSendAmount(userToken.balanceFormatted)}
        className="rounded px-3 py-1.5 text-xs font-medium text-primary hover:bg-primary/30 bg-primary/20"
      >
        {userToken.balanceFormatted} MAX
      </button>
    ) : (
      <button type="button" className="rounded px-3 py-1.5 text-xs font-medium text-primary hover:bg-primary/30 bg-primary/20">
        MAX
      </button>
    )
  })()}
  </div>
  )}
  </div>
  
  {/* You Receive NFT */}
                      <div className="rounded-xl p-4 bg-secondary">
                        <span className="mb-3 block text-xs text-muted-foreground font-semibold uppercase tracking-wide">You Receive</span>
                        {!receiveNftOwnerLocked ? (
                          <div className="space-y-3">
                            <Input
                              type="text"
                              placeholder="Enter counterparty wallet address"
                              value={receiveNftOwner}
                              onChange={(e) => setReceiveNftOwner(e.target.value)}
                              className="h-11 border-none bg-secondary/40 font-mono text-sm"
                            />
                            <Button
                              onClick={() => setReceiveNftOwnerLocked(true)}
                              disabled={!receiveNftOwner || receiveNftOwner.length !== 42}
                              className="w-full"
                            >
                              Confirm Address
                            </Button>
                          </div>
                        ) : (
                          <>
                            <button
                              type="button"
                              onClick={() => setSelectingNftFor("to")}
                              className="flex w-full items-center gap-3 transition-opacity hover:opacity-80"
                            >
                              {receiveNft ? (
                                <>
                                  <div className="relative">
                                    <Image
                                      src={getNFTImage(receiveNft) || "/placeholder.svg"}
                                      alt={getNFTName(receiveNft)}
                                      width={40}
                                      height={40}
                                      className="rounded-lg object-cover"
                                      unoptimized
                                    />
                                    <div className="absolute -bottom-0.5 -right-0.5 h-4 w-4 rounded-full border-2 border-card bg-white overflow-hidden">
                                      <Image
                                        src={BASE_CHAIN.logoUrl || "/placeholder.svg"}
                                        alt="Base"
                                        width={16}
                                        height={16}
                                        className="h-full w-full object-cover"
                                        unoptimized
                                      />
                                    </div>
                                  </div>
                                  <div className="flex-1 text-left">
                                    <p className="font-medium text-foreground">{getNFTName(receiveNft)}</p>
                                    <p className="text-xs text-muted-foreground">Token ID: {receiveNft.tokenId}</p>
                                  </div>
                                  <p className="font-mono text-xs text-muted-foreground">
                                    {abbreviateAddress(receiveNft.contract.address)}
                                  </p>
                                </>
                              ) : (
                                <>
                                  <div className="relative">
                                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted/50">
                                      <div className="h-6 w-6 rounded-lg bg-muted-foreground/20" />
                                    </div>
                                    <div className="absolute -bottom-0.5 -right-0.5 h-4 w-4 rounded-full border-2 border-card bg-white overflow-hidden">
                                      <Image
                                        src={BASE_CHAIN.logoUrl || "/placeholder.svg"}
                                        alt="Base"
                                        width={16}
                                        height={16}
                                        className="h-full w-full object-cover"
                                        unoptimized
                                      />
                                    </div>
                                  </div>
                                  <span className="text-sm font-bold text-muted-foreground">Select NFT</span>
                                </>
                              )}
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setReceiveNftOwnerLocked(false)
                                setReceiveNft(null)
                              }}
                              className="mt-2 text-xs text-muted-foreground hover:text-foreground"
                            >
                              Change address: {abbreviateAddress(receiveNftOwner)}
                            </button>
                          </>
                        )}
                      </div>
                    </>
                  ) : (
                    <>
                      {/* You Send NFT */}
                      <div className="rounded-xl p-4 bg-secondary">
                        <span className="mb-3 block text-xs text-muted-foreground font-semibold uppercase tracking-wide">You Send</span>
                        <button
                          type="button"
                          onClick={() => setSelectingNftFor("from")}
                          className="flex w-full items-center gap-3 transition-opacity hover:opacity-80"
                        >
                          {sendNft ? (
                            <>
                              <div className="relative">
                                <Image
                                  src={getNFTImage(sendNft) || "/placeholder.svg"}
                                  alt={getNFTName(sendNft)}
                                  width={40}
                                  height={40}
                                  className="rounded-lg object-cover"
                                  unoptimized
                                />
                                <div className="absolute -bottom-0.5 -right-0.5 h-4 w-4 rounded-full border-2 border-card bg-white overflow-hidden">
                                  <Image
                                    src={BASE_CHAIN.logoUrl || "/placeholder.svg"}
                                    alt="Base"
                                    width={16}
                                    height={16}
                                    className="h-full w-full object-cover"
                                    unoptimized
                                  />
                                </div>
                              </div>
                              <div className="flex-1 text-left">
                                <p className="font-medium text-foreground">{getNFTName(sendNft)}</p>
                                <p className="text-xs text-muted-foreground">Token ID: {sendNft.tokenId}</p>
                              </div>
                              <p className="font-mono text-xs text-muted-foreground">
                                {abbreviateAddress(sendNft.contract.address)}
                              </p>
                            </>
                          ) : (
                            <>
                              <div className="relative">
                                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted/50">
                                  <div className="h-6 w-6 rounded-lg bg-muted-foreground/20" />
                                </div>
                                <div className="absolute -bottom-0.5 -right-0.5 h-4 w-4 rounded-full border-2 border-card bg-white overflow-hidden">
                                  <Image
                                    src={BASE_CHAIN.logoUrl || "/placeholder.svg"}
                                    alt="Base"
                                    width={16}
                                    height={16}
                                    className="h-full w-full object-cover"
                                    unoptimized
                                  />
                                </div>
                              </div>
                              <span className="text-sm font-bold text-muted-foreground">Select NFT</span>
                            </>
                          )}
                        </button>
                      </div>

                      {/* You Receive Token */}
                      <div className="rounded-xl p-4 bg-secondary">
                        <span className="mb-3 block text-xs text-muted-foreground font-semibold uppercase tracking-wide">You Receive</span>
                        <button
                          type="button"
                          onClick={() => setSelectingFor("to")}
                          className="flex w-full items-center gap-3 transition-opacity hover:opacity-80"
                        >
                          {toToken ? (
                            <>
                              <div className="relative">
                                <TokenLogo token={toToken} size={40} />
                                <div className="absolute -bottom-0.5 -right-0.5 h-4 w-4 rounded-full border-2 border-card bg-white overflow-hidden">
                                  <Image
                                    src={BASE_CHAIN.logoUrl || "/placeholder.svg"}
                                    alt="Base"
                                    width={16}
                                    height={16}
                                    className="h-full w-full object-cover"
                                    unoptimized
                                  />
                                </div>
                              </div>
                              <div className="flex-1 text-left">
                                <p className="font-medium text-foreground">{toToken.symbol}</p>
                                <p className="text-xs text-muted-foreground">{toToken.name}</p>
                              </div>
                              <p className="font-mono text-xs text-muted-foreground">
                                {abbreviateAddress(toToken.address)}
                              </p>
                            </>
                          ) : (
                            <>
                              <div className="relative">
                                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted/50">
                                  <div className="h-6 w-6 rounded-full bg-muted-foreground/20" />
                                </div>
                                <div className="absolute -bottom-0.5 -right-0.5 h-4 w-4 rounded-full border-2 border-card bg-white overflow-hidden">
                                  <Image
                                    src={BASE_CHAIN.logoUrl || "/placeholder.svg"}
                                    alt="Base"
                                    width={16}
                                    height={16}
                                    className="h-full w-full object-cover"
                                    unoptimized
                                  />
                                </div>
                              </div>
                              <span className="text-sm font-bold text-muted-foreground">Select token</span>
                            </>
                          )}
                        </button>
                        {toToken && (
                          <div className="mt-4 flex items-center pt-2">
                            <Input
                              type="number"
                              placeholder="0"
                              value={receiveAmount}
                              onChange={(e) => setReceiveAmount(e.target.value)}
                              className="h-12 border-none text-2xl font-semibold focus-visible:ring-0 bg-secondary/40"
                            />
                          </div>
                        )}
                      </div>
                    </>
                  )}
                </>
              )}

              {/* Counterparty - Only show for token-token trades or when user is sending NFT to receive token */}
              {(tradeType === "token-token" || (tradeType === "token-nft" && tokenNftDirection === "nft-first")) && (
  <div className="rounded-lg p-4 bg-secondary">
  <div className="flex items-center justify-between mb-2">
    <span className="block text-xs font-medium text-muted-foreground">Counterparty Wallet</span>
    <button
      type="button"
      onClick={() => setAddressBookOpen(true)}
      className="flex items-center gap-1 text-xs text-primary hover:text-primary/80 transition-colors"
    >
      <Users className="h-3.5 w-3.5" />
      <span>Address Book</span>
    </button>
  </div>
  <div className="flex items-center gap-2">
  <Input
  type="text"
  placeholder="Enter wallet address"
  value={counterpartyAddress}
  onChange={(e) => setCounterpartyAddress(e.target.value)}
  className="h-9 flex-1 border-none px-0 font-mono text-sm focus-visible:ring-0 font-bold text-[rgba(255,255,255,1)] bg-transparent"
  />
  {counterpartyAddress && (
  <button type="button" onClick={handleCopyAddress} className="text-muted-foreground hover:text-foreground">
  {copied ? <Check className="h-4 w-4 text-green-400" /> : <Copy className="h-4 w-4" />}
  </button>
  )}
  </div>
                </div>
              )}

              {/* Trade Info - only for token trades */}
              {tradeType === "token-token" && fromToken && toToken && sendAmount && receiveAmount && (
                <div className="rounded-lg bg-secondary/30 p-4 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Rate</span>
                    <span className="text-foreground">1 {fromToken.symbol} = {(Number(receiveAmount) / Number(sendAmount) || 0).toFixed(4)} {toToken.symbol}</span>
                  </div>
                <div className="mt-3 flex items-center justify-between">
                  <span className="text-muted-foreground">Expiry Time</span>
                    <div className="flex items-center gap-2">
                      {expiryEditing ? (
                        <div className="flex items-center gap-2">
                          <select
                            value={expiryHours}
                            onChange={(e) => setExpiryHours(e.target.value)}
                            className="rounded bg-secondary px-2 py-1 text-sm text-foreground"
                          >
                            {EXPIRY_OPTIONS.map((opt) => (
                              <option key={opt.value} value={opt.value}>{opt.label}</option>
                            ))}
                          </select>
                          <button type="button" onClick={() => setExpiryEditing(false)} className="text-muted-foreground hover:text-foreground">
                            <Check className="h-4 w-4" />
                          </button>
                        </div>
                      ) : (
                        <>
                          <span className="text-foreground">{selectedExpiry?.label}</span>
                          <button type="button" onClick={() => setExpiryEditing(true)} className="text-muted-foreground hover:text-foreground">
                            <Pencil className="h-3 w-3" />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="mt-2 flex items-center justify-between">
                    <span className="text-muted-foreground">Protocol Fee</span>
                    <div className="flex items-center gap-1.5">
                      <span className="text-foreground font-medium">0%</span>
                      <span className="text-xs text-green-500 bg-green-500/10 px-1.5 py-0.5 rounded">Free</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Expiry Time for NFT trades */}
              {(tradeType === "nft-nft" || tradeType === "token-nft") && 
               ((tradeType === "nft-nft" && sendNft && receiveNft && counterpartyAddress) ||
                (tradeType === "token-nft" && fromToken && sendAmount && receiveNft && counterpartyAddress)) && (
                <div className="rounded-lg p-4 bg-secondary">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Expiry Time</span>
                    <div className="flex items-center gap-2">
                      {expiryEditing ? (
                        <div className="flex items-center gap-2">
                          <select
                            value={expiryHours}
                            onChange={(e) => setExpiryHours(e.target.value)}
                            className="rounded bg-secondary px-2 py-1 text-sm text-foreground"
                          >
                            {EXPIRY_OPTIONS.map((opt) => (
                              <option key={opt.value} value={opt.value}>{opt.label}</option>
                            ))}
                          </select>
                          <button type="button" onClick={() => setExpiryEditing(false)} className="text-muted-foreground hover:text-foreground">
                            <Check className="h-4 w-4" />
                          </button>
                        </div>
                      ) : (
                        <>
                          <span className="text-foreground">{selectedExpiry?.label}</span>
                          <button type="button" onClick={() => setExpiryEditing(true)} className="text-muted-foreground hover:text-foreground">
                            <Pencil className="h-3 w-3" />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="mt-2 flex items-center justify-between">
                    <span className="text-muted-foreground">Protocol Fee</span>
                    <div className="flex items-center gap-1.5">
                      <span className="text-foreground font-medium">0%</span>
                      <span className="text-xs text-green-500 bg-green-500/10 px-1.5 py-0.5 rounded">Free</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Security Badge */}
              

              {/* Action Button */}
              {isConnected ? (
                <Button onClick={handleSwap} disabled={!isFormValid || isCreatingTrade} className="h-12 w-full bg-primary text-primary-foreground hover:bg-primary/80 disabled:opacity-40">
                  {isCreatingTrade ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : tradeType === "token-token" 
                    ? (!fromToken || !toToken ? "Select tokens" : !sendAmount || !receiveAmount ? "Enter amounts" : !counterpartyAddress || counterpartyAddress.length < 42 ? "Enter address" : "Create Trade")
                    : tradeType === "nft-nft"
                    ? (!sendNft ? "Select send NFT" : !receiveNft ? "Select receive NFT" : "Create Trade")
                    : (!fromToken ? "Select token" : !sendAmount ? "Enter amount" : !receiveNft ? "Select NFT" : "Create Trade")
                  }
                </Button>
              ) : (
                <ConnectButton.Custom>
                  {({ openConnectModal, mounted }) => {
                    const ready = mounted
                    return (
                      <div
                        {...(!ready && {
                          'aria-hidden': true,
                          style: {
                            opacity: 0,
                            pointerEvents: 'none',
                            userSelect: 'none',
                          },
                        })}
                      >
                        <button
                          onClick={openConnectModal}
                          type="button"
                          className="h-12 w-full rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/80"
                        >
                          Connect Wallet
                        </button>
                      </div>
                    )
                  }}
                </ConnectButton.Custom>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Chain Info Card - appears when selecting token */}
      <div className={`w-[260px] rounded-xl border border-border bg-card transition-all duration-300 ease-out ${isSelecting ? "translate-x-0 opacity-100" : "pointer-events-none translate-x-8 opacity-0"}`}>
        <div className="border-b border-border px-4 py-4">
          <h3 className="text-sm font-medium text-foreground">Network</h3>
        </div>
        <div className="p-3 space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search chains"
              value={chainSearch}
              onChange={(e) => setChainSearch(e.target.value)}
              className="h-9 border-border bg-secondary pl-9 text-sm"
            />
          </div>
          
          {chainSearch && !BASE_CHAIN.name.toLowerCase().includes(chainSearch.toLowerCase()) ? (
            <div className="py-4 text-center text-xs text-muted-foreground">
              No chains found. More chains coming soon.
            </div>
          ) : (
            <div className="flex items-center gap-3 rounded-lg bg-primary/10 p-3">
              {BASE_CHAIN.logoUrl ? (
                <Image
                  src={BASE_CHAIN.logoUrl || "/placeholder.svg"}
                  alt={BASE_CHAIN.name}
                  width={32}
                  height={32}
                  className="rounded-full"
                  unoptimized
                />
              ) : (
                <div 
                  className="flex h-8 w-8 items-center justify-center rounded-full"
                  style={{ backgroundColor: `${BASE_CHAIN.color}20` }}
                >
                  <span className="text-xs font-bold" style={{ color: BASE_CHAIN.color }}>B</span>
                </div>
              )}
              <div>
                <span className="text-sm font-medium text-foreground">{BASE_CHAIN.name}</span>
                <p className="text-xs text-muted-foreground">Chain ID: {BASE_CHAIN.chainId}</p>
              </div>
              <Check className="ml-auto h-4 w-4 text-primary" />
            </div>
          )}
          
          <p className="text-xs text-muted-foreground">
            Only Base network is currently supported. More chains coming soon.
          </p>
        </div>
      </div>

      {/* Custom Token Dialog */}
      <Dialog open={customTokenOpen} onOpenChange={setCustomTokenOpen}>
        <DialogContent className="sm:max-w-[400px] border-border bg-card">
          <DialogHeader>
            <DialogTitle>Add Custom Token</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Token Name</label>
              <Input
                type="text"
                placeholder="e.g. My Token"
                value={customName}
                onChange={(e) => setCustomName(e.target.value)}
                className="h-11 border-border bg-secondary"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Symbol</label>
              <Input
                type="text"
                placeholder="e.g. MTK"
                value={customSymbol}
                onChange={(e) => setCustomSymbol(e.target.value)}
                className="h-11 border-border bg-secondary"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Contract Address</label>
              <Input
                type="text"
                placeholder="0x..."
                value={customAddress}
                onChange={(e) => setCustomAddress(e.target.value)}
                className="h-11 border-border bg-secondary font-mono text-sm"
              />
              {customAddress && customAddress.length !== 42 && (
                <p className="text-xs text-destructive">Address must be 42 characters</p>
              )}
            </div>
            <div className="flex gap-3 pt-2">
              <Button
                variant="outline"
                className="flex-1 bg-transparent"
                onClick={() => {
                  setCustomTokenOpen(false)
                  setCustomName("")
                  setCustomSymbol("")
                  setCustomAddress("")
                }}
              >
                Cancel
              </Button>
              <Button
                className="flex-1"
                onClick={handleAddCustomToken}
                disabled={!customName || !customSymbol || customAddress.length !== 42}
              >
                Add Token
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* NFT Selection Dialog */}
      <Dialog open={selectingNftFor !== null} onOpenChange={(open) => !open && setSelectingNftFor(null)}>
        <DialogContent className="sm:max-w-[500px] border-border bg-card">
          <DialogHeader>
            <DialogTitle>Select NFT</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search NFTs by name..."
                value={nftSearch}
                onChange={(e) => setNftSearch(e.target.value)}
                className="h-11 border-border bg-secondary pl-9"
              />
            </div>

            {/* NFT List */}
            <div className="max-h-[400px] space-y-2 overflow-y-auto">
              {selectingNftFor === "from" && sendNftsLoading && (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              )}
              {selectingNftFor === "to" && receiveNftsLoading && (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              )}
              {selectingNftFor === "from" && !sendNftsLoading && sendNfts.length === 0 && (
                <p className="py-8 text-center text-sm text-muted-foreground">No NFTs found in your wallet</p>
              )}
              {selectingNftFor === "to" && !receiveNftsLoading && receiveNfts.length === 0 && (
                <p className="py-8 text-center text-sm text-muted-foreground">No NFTs found in this wallet</p>
              )}
              {selectingNftFor === "from" && sendNfts.map((nft) => (
                <button
                  key={`${nft.contract.address}-${nft.tokenId}`}
                  type="button"
                  onClick={() => {
                    setSendNft(nft)
                    setSelectingNftFor(null)
                  }}
                  className="w-full rounded-lg border border-border bg-secondary/50 p-3 transition-colors hover:bg-secondary"
                >
                  <NFTCard nft={nft} />
                </button>
              ))}
              {selectingNftFor === "to" && receiveNfts.map((nft) => (
                <button
                  key={`${nft.contract.address}-${nft.tokenId}`}
                  type="button"
                  onClick={() => {
                    setReceiveNft(nft)
                    setSelectingNftFor(null)
                  }}
                  className="w-full rounded-lg border border-border bg-secondary/50 p-3 transition-colors hover:bg-secondary"
                >
                  <NFTCard nft={nft} />
                </button>
              ))}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Address Book Dialog */}
      <AddressBookDialog
        open={addressBookOpen}
        onOpenChange={setAddressBookOpen}
        onSelectAddress={(address) => setCounterpartyAddress(address)}
        userAddress={address}
      />
    </div>
  )
}
