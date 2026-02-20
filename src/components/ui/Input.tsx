"use client";

import { InputHTMLAttributes, forwardRef } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, id, dir, className = "", ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label htmlFor={id} className="block text-sm font-medium text-foreground mb-1">
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={id}
          dir={dir}
          style={dir === "ltr" ? { direction: "ltr", textAlign: "left" } : undefined}
          className={`w-full px-3 py-2 rounded-lg border ${
            error ? "border-danger-500 focus:ring-danger-500" : "border-input-border bg-card focus:ring-primary-500 focus:border-primary-500"
          } outline-none transition-colors focus:ring-2 ${className}`}
          {...props}
        />
        {error && <p className="mt-1 text-sm text-danger-600">{error}</p>}
      </div>
    );
  }
);

Input.displayName = "Input";
