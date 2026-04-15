"use client"

import React from "react"

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Info, Shield, Clock, Zap } from "lucide-react"

interface InfoDropdownProps {
  children: React.ReactNode
}

export function InfoDropdown({ children }: InfoDropdownProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>{children}</DropdownMenuTrigger>
      
    </DropdownMenu>
  )
}
