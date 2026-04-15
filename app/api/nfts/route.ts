import { NextResponse } from 'next/server'

const ALCHEMY_API_KEY = process.env.ALCHEMY_API_KEY
const BASE_URL = 'https://base-mainnet.g.alchemy.com/v2'

export interface NFT {
  contract: {
    address: string
    name?: string
  }
  tokenId: string
  name?: string
  description?: string
  image?: {
    cachedUrl?: string
    originalUrl?: string
  }
  collection?: {
    name?: string
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const owner = searchParams.get('owner')
    const search = searchParams.get('search') || ''

    if (!owner) {
      return NextResponse.json({ error: 'Owner address is required' }, { status: 400 })
    }

    // Fetch NFTs owned by the address
    const response = await fetch(
      `${BASE_URL}/${ALCHEMY_API_KEY}/getNFTsForOwner?owner=${owner}&withMetadata=true`,
      {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
      }
    )

    if (!response.ok) {
      throw new Error(`Alchemy API error: ${response.statusText}`)
    }

    const data = await response.json()
    let nfts: NFT[] = data.ownedNfts || []

    // Filter by search query if provided
    if (search) {
      const searchLower = search.toLowerCase()
      nfts = nfts.filter((nft) => {
        const name = (nft.name || nft.collection?.name || '').toLowerCase()
        const contractName = (nft.contract.name || '').toLowerCase()
        const contractAddress = nft.contract.address.toLowerCase()
        
        return (
          name.includes(searchLower) ||
          contractName.includes(searchLower) ||
          contractAddress.includes(searchLower)
        )
      })
    }

    // Limit to 50 NFTs
    nfts = nfts.slice(0, 50)

    return NextResponse.json({ nfts })
  } catch (error) {
    console.error('Error fetching NFTs:', error)
    return NextResponse.json(
      { error: 'Failed to fetch NFTs' },
      { status: 500 }
    )
  }
}
