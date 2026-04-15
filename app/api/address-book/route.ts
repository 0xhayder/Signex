import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(request: NextRequest) {
  const userAddress = request.nextUrl.searchParams.get('userAddress')

  if (!userAddress) {
    return NextResponse.json({ error: 'User address required' }, { status: 400 })
  }

  try {
    const { data, error } = await supabase
      .from('address_book')
      .select('*')
      .ilike('user_address', userAddress)
      .order('created_at', { ascending: false })

    if (error) throw error

    return NextResponse.json({ contacts: data || [] })
  } catch (error) {
    console.error('[v0] Failed to fetch address book:', error)
    return NextResponse.json({ error: 'Failed to fetch contacts' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userAddress, contactName, contactAddress } = body

    if (!userAddress || !contactName || !contactAddress) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('address_book')
      .insert({
        user_address: userAddress.toLowerCase(),
        contact_name: contactName,
        contact_address: contactAddress.toLowerCase(),
      })
      .select()

    if (error) {
      if (error.code === '23505') {
        return NextResponse.json({ error: 'Contact already exists' }, { status: 409 })
      }
      throw error
    }

    return NextResponse.json({ contact: data[0] })
  } catch (error) {
    console.error('[v0] Failed to add contact:', error)
    return NextResponse.json({ error: 'Failed to add contact' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  const id = request.nextUrl.searchParams.get('id')

  if (!id) {
    return NextResponse.json({ error: 'Contact ID required' }, { status: 400 })
  }

  try {
    const { error } = await supabase
      .from('address_book')
      .delete()
      .eq('id', id)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[v0] Failed to delete contact:', error)
    return NextResponse.json({ error: 'Failed to delete contact' }, { status: 500 })
  }
}
