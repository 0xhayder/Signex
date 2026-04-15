"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useAddressBook } from "@/hooks/use-address-book"
import { Loader2, Trash2, Plus, X } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface AddressBookDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSelectAddress?: (address: string) => void
  userAddress?: string
}

export function AddressBookDialog({
  open,
  onOpenChange,
  onSelectAddress,
  userAddress,
}: AddressBookDialogProps) {
  const { contacts, isLoading, addContact, deleteContact } = useAddressBook(userAddress)
  const { toast } = useToast()
  const [showAddForm, setShowAddForm] = useState(false)
  const [newName, setNewName] = useState("")
  const [newAddress, setNewAddress] = useState("")
  const [isAdding, setIsAdding] = useState(false)

  const handleAdd = async () => {
    if (!newName.trim() || !newAddress.trim()) {
      toast({ title: "Error", description: "Name and address required", variant: "destructive" })
      return
    }

    if (!/^0x[a-fA-F0-9]{40}$/.test(newAddress.trim())) {
      toast({ title: "Error", description: "Invalid Ethereum address", variant: "destructive" })
      return
    }

    setIsAdding(true)
    try {
      await addContact(newName.trim(), newAddress.trim())
      toast({ title: "Success", description: `${newName} added` })
      setNewName("")
      setNewAddress("")
      setShowAddForm(false)
    } catch (error) {
      toast({ title: "Error", description: "Failed to add contact", variant: "destructive" })
    } finally {
      setIsAdding(false)
    }
  }

  const handleDelete = async (id: string, name: string) => {
    try {
      await deleteContact(id)
      toast({ title: "Success", description: `${name} removed` })
    } catch (error) {
      toast({ title: "Error", description: "Failed to remove contact", variant: "destructive" })
    }
  }

  const handleSelect = (address: string) => {
    onSelectAddress?.(address)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[420px]">
        <DialogHeader>
          <DialogTitle>Address Book</DialogTitle>
        </DialogHeader>

        <div className="relative space-y-3">
          {/* Add form (only shows when + is clicked) */}
          {showAddForm && (
            <div className="space-y-2 rounded-lg border border-primary/20 bg-primary/5 p-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-muted-foreground">New Contact</span>
                <button
                  type="button"
                  onClick={() => {
                    setShowAddForm(false)
                    setNewName("")
                    setNewAddress("")
                  }}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
              <Input
                placeholder="Name"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                className="h-9 bg-background"
              />
              <Input
                placeholder="0x..."
                value={newAddress}
                onChange={(e) => setNewAddress(e.target.value)}
                className="h-9 bg-background font-mono text-xs"
              />
              <Button
                onClick={handleAdd}
                disabled={isAdding || !newName.trim() || !newAddress.trim()}
                className="h-9 w-full"
                size="sm"
              >
                {isAdding ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Add"}
              </Button>
            </div>
          )}

          {/* Contact list */}
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : contacts.length === 0 ? (
            <div className="py-12 text-center">
              <p className="text-sm text-muted-foreground">No saved addresses</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Click + to add frequently used addresses
              </p>
            </div>
          ) : (
            <div className="max-h-[360px] space-y-1.5 overflow-y-auto pb-12">
              {contacts.map((contact) => (
                <div
                  key={contact.id}
                  className="group flex items-center justify-between rounded-lg border bg-secondary/20 p-2.5 transition-all hover:border-primary/30 hover:bg-secondary/40"
                >
                  <button
                    type="button"
                    onClick={() => handleSelect(contact.contact_address)}
                    className="flex-1 text-left"
                  >
                    <div className="text-sm font-medium">{contact.contact_name}</div>
                    <div className="font-mono text-[11px] text-muted-foreground">
                      {contact.contact_address.slice(0, 8)}...{contact.contact_address.slice(-6)}
                    </div>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(contact.id, contact.contact_name)}
                    className="ml-2 opacity-0 transition-opacity group-hover:opacity-100"
                  >
                    <Trash2 className="h-3.5 w-3.5 text-destructive hover:text-destructive/80" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Floating add button */}
          {!showAddForm && (
            <div className="absolute bottom-0 right-0">
              <Button
                variant="default"
                size="sm"
                onClick={() => setShowAddForm(true)}
                className="h-10 w-10 rounded-full p-0 shadow-lg"
              >
                <Plus className="h-5 w-5" />
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
