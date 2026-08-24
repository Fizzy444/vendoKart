import React from "react";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "glow" | "interactive";
}

export const Card: React.FC<CardProps> = ({
  children,
  className,
  variant = "default",
  ...props
}) => {
  const baseStyles =
    "bg-slate-900/80 border border-slate-800 backdrop-blur-md rounded-2xl p-6 transition-all duration-200";

  const variantStyles = {
    default: "shadow-lg shadow-black/20",
    glow: "shadow-lg shadow-artisan-500/5 border-slate-700/60",
    interactive:
      "shadow-md hover:shadow-xl hover:border-artisan-500/30 hover:-translate-y-0.5 cursor-pointer",
  };

  return (
    <div
      className={twMerge(clsx(baseStyles, variantStyles[variant], className))}
      {...props}
    >
      {children}
    </div>
  );
};
