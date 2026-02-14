import * as React from "react"
import { cn } from "@/lib/utils"

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "secondary" | "destructive" | "outline" | "success" | "warning"
}

function Badge({ className, variant = "default", ...props }: BadgeProps) {
  const variants: Record<string, string> = {
    default: "bg-primary-600 text-white",
    secondary: "bg-neutral-100 text-neutral-700",
    destructive: "bg-error-600 text-white",
    outline: "border border-neutral-200 text-neutral-700 bg-transparent",
    success: "bg-success-100 text-success-700",
    warning: "bg-warning-100 text-warning-700",
  }

  return (
    <div
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors",
        variants[variant],
        className
      )}
      {...props}
    />
  )
}

export { Badge }
