"use client"

import * as React from "react"
import * as ProgressPrimitive from "@radix-ui/react-progress"

import { cn } from "@/lib/utils"

const Progress = React.forwardRef<
  React.ElementRef<typeof ProgressPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof ProgressPrimitive.Root> & {
    indicatorColor?: string
  }
>(({ className, value, indicatorColor, ...props }, ref) => {
  // Definir os estilos do indicador com base nas props
  const indicatorStyle = {
    transform: `translateX(-${100 - (value || 0)}%)`,
  }

  // Classes para o indicador
  const indicatorClassName = cn(
    "h-full w-full flex-1 bg-primary transition-all",
    indicatorColor
  )

  return (
    <ProgressPrimitive.Root
      ref={ref}
      className={cn(
        "relative h-4 w-full overflow-hidden rounded-full bg-secondary",
        className
      )}
      {...props}
    >
      <ProgressPrimitive.Indicator
        className={indicatorClassName}
        style={indicatorStyle}
      />
    </ProgressPrimitive.Root>
  )
})
Progress.displayName = ProgressPrimitive.Root.displayName

export { Progress }
