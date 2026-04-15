'use client';

import Image from "next/image"
import type { NFT } from "@/app/api/nfts/route"
import { abbreviateAddress } from "@/hooks/use-tokens"
import { getNFTImage, getNFTName } from "@/hooks/use-nfts"

const BASE_CHAIN = {
  logoUrl: "/base-logo.png",
}

interface NFTCardProps {
  nft: NFT
  onClick: () => void
  selected?: boolean
}

export function NFTCard({ nft, onClick, selected }: NFTCardProps) {
  const nftName = getNFTName(nft)
  const nftImage = getNFTImage(nft)
  
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex w-full items-center gap-3 rounded-lg p-3 transition-colors hover:bg-secondary/50 ${
        selected ? "bg-primary/10 ring-1 ring-primary" : ""
      }`}
    >
      <div className="relative">
        <div className="h-10 w-10 rounded-lg overflow-hidden bg-muted">
          <Image
            src={nftImage || "/placeholder.svg"}
            alt={nftName}
            width={40}
            height={40}
            className="h-full w-full object-cover"
            unoptimized
          />
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
      <div className="flex-1 text-left">
        <p className="font-medium text-foreground text-sm line-clamp-1">{nftName}</p>
        <p className="text-xs text-muted-foreground">
          {nft.contract.name || abbreviateAddress(nft.contract.address)}
        </p>
      </div>
      <p className="font-mono text-xs text-muted-foreground">
        #{String(nft.tokenId).length > 6 ? `${String(nft.tokenId).slice(0, 6)}...` : nft.tokenId}
      </p>
    </button>
  )
}
