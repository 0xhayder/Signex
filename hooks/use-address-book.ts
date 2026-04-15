'use client';

import useSWR from 'swr'
import { useState } from 'react'

export interface Contact {
  id: string
  user_address: string
  contact_name: string
  contact_address: string
  created_at: string
  updated_at: string
}

async function fetchContacts(userAddress: string): Promise<Contact[]> {
  if (!userAddress) return []

  try {
    const response = await fetch(`/api/address-book?userAddress=${encodeURIComponent(userAddress)}`)
    if (!response.ok) return []
    const data = await response.json()
    return data.contacts || []
  } catch (error) {
    console.error('[v0] Failed to fetch contacts:', error)
    return []
  }
}

export function useAddressBook(userAddress: string | undefined) {
  const { data, error, isLoading, mutate } = useSWR(
    userAddress ? `address-book-${userAddress}` : null,
    () => fetchContacts(userAddress!),
    {
      revalidateOnFocus: false,
      dedupingInterval: 10000,
    }
  )

  const [isAdding, setIsAdding] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  const addContact = async (contactName: string, contactAddress: string) => {
    if (!userAddress) return { success: false, error: 'Not connected' }

    setIsAdding(true)
    try {
      const response = await fetch('/api/address-book', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userAddress,
          contactName,
          contactAddress,
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        return { success: false, error: result.error || 'Failed to add contact' }
      }

      await mutate()
      return { success: true }
    } catch (error) {
      console.error('[v0] Failed to add contact:', error)
      return { success: false, error: 'Failed to add contact' }
    } finally {
      setIsAdding(false)
    }
  }

  const deleteContact = async (id: string) => {
    setIsDeleting(true)
    try {
      const response = await fetch(`/api/address-book?id=${id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        return { success: false }
      }

      await mutate()
      return { success: true }
    } catch (error) {
      console.error('[v0] Failed to delete contact:', error)
      return { success: false }
    } finally {
      setIsDeleting(false)
    }
  }

  return {
    contacts: data || [],
    isLoading,
    error,
    addContact,
    deleteContact,
    isAdding,
    isDeleting,
  }
}
