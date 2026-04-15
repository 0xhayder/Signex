import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const address = searchParams.get('address')

  if (!address) {
    return NextResponse.json({ error: 'Address required' }, { status: 400 })
  }

  try {
    console.log('[v0] Fetching all trades for address:', address)

    // Fetch all trades where user is maker or taker (including executed, cancelled, expired)
    const { data, error } = await supabase
      .from('trades')
      .select('*')
      .or(`maker.ilike.${address},taker.ilike.${address}`)
      .order('created_at', { ascending: false })

    if (error) throw error

    console.log('[v0] Found trades:', data?.length || 0, 'trades')

    return NextResponse.json({ trades: data || [] })
  } catch (error) {
    console.error('[v0] Failed to fetch trades:', error)
    return NextResponse.json({ error: 'Failed to fetch trades' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    console.log('[v0] API POST: Received trade creation request', {
      maker: body.maker,
      taker: body.taker,
      tokenA: body.tokenA,
      tokenB: body.tokenB
    })
    
    const { data, error } = await supabase
      .from('trades')
      .insert([{
        maker: body.maker.toLowerCase(),
        taker: body.taker.toLowerCase(),
        token_a: body.tokenA.toLowerCase(),
        token_b: body.tokenB.toLowerCase(),
        amount_a: body.amountA,
        amount_b: body.amountB,
        nonce: body.nonce,
        expiry: body.expiry,
        signature: body.signature,
        token_a_decimals: body.tokenADecimals || 18,
        token_b_decimals: body.tokenBDecimals || 18,
        token_a_symbol: body.tokenASymbol,
        token_b_symbol: body.tokenBSymbol,
        token_a_logo: body.tokenALogo,
        token_b_logo: body.tokenBLogo,
        status: 'pending'
      }])
      .select()
      .single()

    if (error) {
      console.error('[v0] API POST: Supabase error', error)
      throw error
    }

    console.log('[v0] API POST: Trade created successfully', data.id)
    return NextResponse.json({ trade: data })
  } catch (error: any) {
    console.error('[v0] API POST: Failed to create trade:', error)
    return NextResponse.json({ 
      error: 'Failed to create trade', 
      details: error?.message || String(error) 
    }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, status } = body

    if (!id || !status) {
      return NextResponse.json({ error: 'ID and status required' }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('trades')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ trade: data })
  } catch (error) {
    console.error('Failed to update trade:', error)
    return NextResponse.json({ error: 'Failed to update trade' }, { status: 500 })
  }
}
