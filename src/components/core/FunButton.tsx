"use client";

import { Button } from "@/components/ui/button";
import { LoaderCircle } from "lucide-react";
import { cn } from "@/lib/utils";

type ButtonVariant = "default" | "destructive" | "secondary" | "outline" | "ghost";

interface FunButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  isLoading?: boolean;
  loadingText?: string;
  variant?: ButtonVariant;
  children: React.ReactNode;
}

// Map Tailwind classes to variants
// We use Shadcn's standard utility classes here
const VARIANT_STYLES = {
  default: {
    base: "bg-primary text-primary-foreground hover:bg-primary/90",
    // We mix 70% of the Primary color with Black to get the dark edge
    borderColor: "color-mix(in srgb, hsl(var(--primary)) 70%, black)",
  },
  destructive: {
    base: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
    borderColor: "color-mix(in srgb, hsl(var(--destructive)) 70%, black)",
  },
  secondary: {
    base: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
    borderColor: "color-mix(in srgb, hsl(var(--secondary)) 75%, black)", 
  },
  outline: {
    base: "bg-background text-foreground border-2 border-input hover:bg-accent hover:text-accent-foreground",
    borderColor: "hsl(var(--input))", // For outline, the '3D' part is just the border thickness
  },
  ghost: {
    base: "bg-transparent text-foreground hover:bg-accent hover:text-accent-foreground",
    borderColor: "transparent",
  }
};

export const FunButton = ({ 
  isLoading, 
  loadingText = "Loading...", 
  variant = "default", 
  className, 
  children, 
  style,
  ...props 
}: FunButtonProps) => {
  
  const currentStyle = VARIANT_STYLES[variant];

  return (
    <Button
      className={cn(
        // 1. Layout & Shape
        "w-full h-12 text-lg font-bold rounded-2xl relative cursor-pointer",
        // 2. Interaction Animations
        "transition-all hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98]",
        // 3. Apply the dynamic background/text colors
        currentStyle.base,
        className
      )}
      style={{
        // 4. Create the 3D effect
        borderBottomWidth: variant === 'ghost' ? '0px' : '4px',
        borderBottomStyle: "solid",
        // This calculates the dark edge dynamically based on your theme
        borderBottomColor: currentStyle.borderColor,
        ...style
      }}
      disabled={isLoading || props.disabled}
      {...props}
    >
      {isLoading ? (
        <div className="flex items-center gap-2">
          {/* Ensure loader matches text color */}
          <LoaderCircle 
            className={cn(
              "h-5 w-5 animate-spin", 
              // If secondary/outline, loader should be dark. Otherwise white.
              variant === "secondary" || variant === "outline" || variant === "ghost" 
                ? "text-foreground" 
                : "text-primary-foreground"
            )} 
          />
          <span>{loadingText}</span>
        </div>
      ) : (
        <div className="flex items-center gap-2 justify-center">
          {children}
        </div>
      )}
    </Button>
  );
};