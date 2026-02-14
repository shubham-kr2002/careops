import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-lg text-sm font-medium transition-all duration-200 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 disabled:cursor-not-allowed",
  {
    variants: {
      variant: {
        default: "bg-primary-600 text-white hover:bg-primary-700 focus:bg-primary-700 active:bg-primary-800 shadow-sm hover:shadow-md active:scale-98",
        destructive: "bg-error-600 text-white hover:bg-error-700 focus:bg-error-700 active:bg-error-800 shadow-sm hover:shadow-md active:scale-98",
        outline: "border border-neutral-200 bg-white text-neutral-700 hover:bg-neutral-50 hover:border-neutral-300 focus:bg-neutral-50 focus:border-neutral-300 active:bg-neutral-100 active:scale-98",
        secondary: "bg-neutral-100 text-neutral-700 hover:bg-neutral-200 focus:bg-neutral-200 active:bg-neutral-300 active:scale-98",
        ghost: "bg-transparent text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900 focus:bg-neutral-100 focus:text-neutral-900 active:bg-neutral-200 active:scale-98",
        link: "bg-transparent text-primary-600 hover:text-primary-700 underline-offset-4 hover:underline focus:underline focus:ring-2 focus:ring-primary-200 active:scale-98",
        success: "bg-success-600 text-white hover:bg-success-700 focus:bg-success-700 active:bg-success-800 shadow-sm hover:shadow-md active:scale-98",
        warning: "bg-warning-600 text-white hover:bg-warning-700 focus:bg-warning-700 active:bg-warning-800 shadow-sm hover:shadow-md active:scale-98",
      },
      size: {
        default: "h-11 px-4 py-2.5 text-base",
        sm: "h-9 px-3 py-1.5 text-sm",
        lg: "h-12 px-6 py-3 text-lg",
        xl: "h-14 px-8 py-4 text-xl",
        icon: "h-11 w-11",
      },
      shape: {
        default: "rounded-lg",
        pill: "rounded-full",
        square: "rounded-none",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
      shape: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, shape, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, shape, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
