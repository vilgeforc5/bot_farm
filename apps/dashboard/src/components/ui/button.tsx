import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../../lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-full text-sm font-medium transition disabled:pointer-events-none disabled:opacity-60 outline-none focus-visible:ring-4 focus-visible:ring-orange-500/10",
  {
    variants: {
      variant: {
        default: "bg-orange-600 px-5 py-3 text-white hover:-translate-y-0.5 hover:bg-orange-700",
        outline: "border border-black/10 bg-white px-4 py-2 text-stone-900 hover:bg-stone-100",
        secondary: "border border-black/10 bg-stone-50 px-4 py-2 text-stone-700 hover:bg-stone-100",
        ghost: "px-3 py-2 text-stone-700 hover:bg-stone-100"
      },
      size: {
        default: "",
        sm: "px-3 py-2 text-xs",
        lg: "px-6 py-3.5 text-base"
      }
    },
    defaultVariants: {
      variant: "default",
      size: "default"
    }
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => (
    <button
      className={cn(buttonVariants({ variant, size }), className)}
      ref={ref}
      {...props}
    />
  )
);
Button.displayName = "Button";

export { Button, buttonVariants };
