import * as React from "react";
import { cn } from "../../lib/utils";

const Card = React.forwardRef<HTMLDivElement, React.ComponentProps<"div">>(
  ({ className, ...props }, ref) => (
    <div
      className={cn(
        "rounded-[2rem] border border-black/10 bg-white/80 shadow-[0_24px_60px_rgba(0,0,0,0.08)] backdrop-blur",
        className
      )}
      ref={ref}
      {...props}
    />
  )
);
Card.displayName = "Card";

const CardContent = React.forwardRef<HTMLDivElement, React.ComponentProps<"div">>(
  ({ className, ...props }, ref) => (
    <div className={cn("p-6 md:p-8", className)} ref={ref} {...props} />
  )
);
CardContent.displayName = "CardContent";

export { Card, CardContent };
