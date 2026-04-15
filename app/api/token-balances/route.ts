import { NextRequest, NextResponse } from "next/server";

const ZAPPER_GQL = "https://public.zapper.xyz/graphql";

const QUERY = `
query TokenBalances($addresses: [Address!]!, $first: Int, $chainIds: [Int!]) {
  portfolioV2(addresses: $addresses, chainIds: $chainIds) {
    tokenBalances {
      byToken(first: $first) {
        edges {
          node {
            tokenAddress
            balance
            balanceUSD
            network { name }
          }
        }
      }
    }
  }
}`;

// Known token metadata for major Base tokens (logos that DexScreener might miss)
const KNOWN_TOKENS: Record<string, { symbol: string; name: string; logo: string; decimals: number }> = {
  "0x833589fcd6edb6e08f4c7c32d4f71b54bda02913": {
    symbol: "USDC", name: "USD Coin",
    logo: "https://assets.coingecko.com/coins/images/6319/large/usdc.png", decimals: 6,
  },
  "0x50c5725949a6f0c72e6c4a641f24049a917db0cb": {
    symbol: "DAI", name: "Dai Stablecoin",
    logo: "https://assets.coingecko.com/coins/images/9956/large/Badge_Dai.png", decimals: 18,
  },
  "0x0555e30da8f98308edb960aa94c0db47230d2b9c": {
    symbol: "WBTC", name: "Wrapped Bitcoin",
    logo: "https://assets.coingecko.com/coins/images/7598/large/wrapped_bitcoin_wbtc.png", decimals: 8,
  },
  "0x2ae3f1ec7f1f5012cfeab0185bfc7aa3cf0dec22": {
    symbol: "cbETH", name: "Coinbase Wrapped Staked ETH",
    logo: "https://assets.coingecko.com/coins/images/27008/large/cbeth.png", decimals: 18,
  },
  "0x940181a94a35a4569e4529a3cdfb74e38fd98631": {
    symbol: "AERO", name: "Aerodrome Finance",
    logo: "https://assets.coingecko.com/coins/images/31745/large/token.png", decimals: 18,
  },
  "0x4ed4e862860bed51a9570b96d89af5e1b0efefed": {
    symbol: "DEGEN", name: "Degen",
    logo: "https://assets.coingecko.com/coins/images/34515/large/android-chrome-512x512.png", decimals: 18,
  },
  "0x4200000000000000000000000000000000000006": {
    symbol: "WETH", name: "Wrapped Ether",
    logo: "https://assets.coingecko.com/coins/images/2518/large/weth.png", decimals: 18,
  },
  "0xc3de830ea07524a0761646a6a4e4be0e114a3c83": {
    symbol: "UNI", name: "Uniswap",
    logo: "https://assets.coingecko.com/coins/images/12504/large/uni.jpg", decimals: 18,
  },
  "0xd9aaec86b65d86f6a7b5b1b0c42ffa531710b6ca": {
    symbol: "USDbC", name: "USD Base Coin",
    logo: "https://assets.coingecko.com/coins/images/6319/large/usdc.png", decimals: 6,
  },
};

// Batch fetch metadata from DexScreener for tokens NOT in known list
async function fetchDexScreenerMeta(addresses: string[]): Promise<Map<string, { symbol: string; name: string; logo: string }>> {
  const metaMap = new Map<string, { symbol: string; name: string; logo: string }>();
  if (addresses.length === 0) return metaMap;

  const chunks: string[][] = [];
  for (let i = 0; i < addresses.length; i += 30) {
    chunks.push(addresses.slice(i, i + 30));
  }

  await Promise.all(
    chunks.map(async (chunk) => {
      try {
        const res = await fetch(`https://api.dexscreener.com/tokens/v1/base/${chunk.join(",")}`);
        if (!res.ok) return;
        const pairs = await res.json();
        if (!Array.isArray(pairs)) return;

        for (const pair of pairs) {
          if (pair.baseToken?.address) {
            const addr = pair.baseToken.address.toLowerCase();
            if (!metaMap.has(addr) && pair.info?.imageUrl) {
              metaMap.set(addr, {
                symbol: pair.baseToken.symbol || "",
                name: pair.baseToken.name || "",
                logo: pair.info.imageUrl,
              });
            }
          }
          if (pair.quoteToken?.address) {
            const addr = pair.quoteToken.address.toLowerCase();
            if (!metaMap.has(addr) && pair.info?.imageUrl) {
              metaMap.set(addr, {
                symbol: pair.quoteToken.symbol || "",
                name: pair.quoteToken.name || "",
                logo: pair.info.imageUrl || "",
              });
            }
          }
        }
      } catch {
        // skip
      }
    })
  );

  return metaMap;
}

// Native ETH addresses to skip
const NATIVE_ADDRESSES = new Set([
  "0x0000000000000000000000000000000000000000",
  "0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee",
]);

export async function GET(request: NextRequest) {
  const address = request.nextUrl.searchParams.get("address");
  if (!address) {
    return NextResponse.json({ error: "Address required" }, { status: 400 });
  }

  const ZAPPER_KEY = process.env.zapper_api_key;
  if (!ZAPPER_KEY) {
    return NextResponse.json({ tokens: [] });
  }

  try {
    const zapRes = await fetch(ZAPPER_GQL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-zapper-api-key": ZAPPER_KEY,
      },
      body: JSON.stringify({
        query: QUERY,
        variables: {
          addresses: [address.toLowerCase()],
          first: 50,
          chainIds: [8453],
        },
      }),
    });

    if (!zapRes.ok) return NextResponse.json({ tokens: [] });

    const zapJson = await zapRes.json();
    if (zapJson.errors) return NextResponse.json({ tokens: [] });

    const edges = zapJson?.data?.portfolioV2?.tokenBalances?.byToken?.edges ?? [];
    if (edges.length === 0) return NextResponse.json({ tokens: [] });

    // Filter: Base only, skip dust < $0.10, skip native ETH
    const baseTokens = edges
      .map((e: any) => e.node)
      .filter(
        (n: any) =>
          n.network?.name?.toLowerCase().includes("base") &&
          n.balance > 0.001 &&
          n.balanceUSD > 0.1 &&
          n.tokenAddress &&
          !NATIVE_ADDRESSES.has(n.tokenAddress.toLowerCase())
      );

    if (baseTokens.length === 0) return NextResponse.json({ tokens: [] });

    // 2. Split tokens: known (instant metadata) vs unknown (need DexScreener)
    const unknownAddresses = baseTokens
      .map((t: any) => t.tokenAddress.toLowerCase())
      .filter((addr: string) => !KNOWN_TOKENS[addr]);

    const dexMeta = await fetchDexScreenerMeta(unknownAddresses);

    // 3. Build response
    const tokens = baseTokens
      .map((t: any) => {
        const addr = t.tokenAddress.toLowerCase();
        const known = KNOWN_TOKENS[addr];
        const dex = dexMeta.get(addr);
        const meta = known || dex;

        if (!meta || !meta.logo || !meta.symbol) return null;

        const bal = Number(t.balance);
        let formatted: string;
        if (bal >= 1000) formatted = bal.toFixed(2);
        else if (bal >= 1) formatted = bal.toFixed(4);
        else formatted = bal.toFixed(6);

        return {
          id: t.tokenAddress,
          symbol: meta.symbol,
          name: meta.name,
          address: t.tokenAddress,
          logoUrl: meta.logo,
          chainId: 8453,
          decimals: known?.decimals ?? 18,
          balance: formatted,
          balanceFormatted: formatted,
          balanceUSD: Number(t.balanceUSD),
        };
      })
      .filter(Boolean)
      .sort((a: any, b: any) => b.balanceUSD - a.balanceUSD);

    return NextResponse.json({ tokens });
  } catch (error) {
    console.error("[v0] token-balances error:", error);
    return NextResponse.json({ tokens: [] });
  }
}
