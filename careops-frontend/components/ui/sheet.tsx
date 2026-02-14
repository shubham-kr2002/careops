'use client'

import * as React from "react"
import { cn } from "@/lib/utils"
import { X } from "lucide-react"

interface SheetProps {
  open?: boolean
  onOpenChange?: (open: boolean) => void
  children: React.ReactNode
}

function Sheet({ open, onOpenChange, children }: SheetProps) {
  return <>{children}</>
}

interface SheetTriggerProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  asChild?: boolean
}

const SheetTrigger = React.forwardRef<HTMLButtonElement, SheetTriggerProps>(
  ({ className, ...props }, ref) => (
    <button ref={ref} className={cn(className)} {...props} />
  )
)
SheetTrigger.displayName = "SheetTrigger"

interface SheetContentProps extends React.HTMLAttributes<HTMLDivElement> {
  side?: "left" | "right" | "top" | "bottom"
  onClose?: () => void
}

const SheetContent = React.forwardRef<HTMLDivElement, SheetContentProps>(
  ({ className, children, side = "right", ...props }, ref) => {
    return (
      <>
        {/* Backdrop */}
        <div className="fixed inset-0 z-50 bg-black/50 animate-fadeIn" />
        {/* Sheet content */}
        <div
          ref={ref}
          className={cn(
            "fixed z-50 bg-white shadow-xl transition-transform duration-300",
            side === "left" && "inset-y-0 left-0 h-full border-r border-neutral-200",
            side === "right" && "inset-y-0 right-0 h-full border-l border-neutral-200",
            side === "top" && "inset-x-0 top-0 w-full border-b border-neutral-200",
            side === "bottom" && "inset-x-0 bottom-0 w-full border-t border-neutral-200",
            className
          )}
          {...props}
        >
          {children}
        </div>
      </>
    )
  }
)
SheetContent.displayName = "SheetContent"

export { Sheet, SheetTrigger, SheetContent }
