'use client'

import useSWR from 'swr'
import type { NFT } from '@/app/api/nfts/route'

interface NFTsResponse {
  nfts: NFT[]
}

const fetcher = (url: string) => fetch(url).then(res => res.json())

export function useNFTs(owner: string | null, search: string = '') {
  const params = new URLSearchParams()
  if (owner) params.set('owner', owner)
  if (search) params.set('search', search)
  
  const { data, error, isLoading } = useSWR<NFTsResponse>(
    owner ? `/api/nfts?${params.toString()}` : null,
    fetcher,
    {
      revalidateOnFocus: false,
      dedupingInterval: 10000,
      keepPreviousData: true,
    }
  )
  
  return {
    nfts: data?.nfts || [],
    isLoading,
    error,
  }
}

export function getNFTImage(nft: NFT): string {
  return nft.image?.cachedUrl || nft.image?.originalUrl || '/placeholder.svg'
}

export function getNFTName(nft: NFT): string {
  return nft.name || nft.collection?.name || `${nft.contract.name || 'Unknown'} #${nft.tokenId}`
}
