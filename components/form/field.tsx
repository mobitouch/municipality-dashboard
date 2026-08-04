import * as React from "react";

import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

export function Field({
  label,
  htmlFor,
  errors,
  hint,
  required,
  className,
  children,
}: {
  label: string;
  htmlFor: string;
  errors?: string[];
  hint?: string;
  required?: boolean;
  className?: string;
  children: React.ReactNode;
}) {
  const errorId = `${htmlFor}-error`;
  const hintId = `${htmlFor}-hint`;

  return (
    <div className={cn("grid gap-1.5", className)}>
      <Label htmlFor={htmlFor}>
        {label}
        {required && (
          <span className="text-destructive" aria-hidden="true">
            *
          </span>
        )}
      </Label>
      {children}
      {hint && !errors?.length && (
        <p id={hintId} className="text-muted-foreground text-xs">
          {hint}
        </p>
      )}
      {errors?.length ? (
        <p id={errorId} className="text-destructive text-xs" role="alert">
          {errors[0]}
        </p>
      ) : null}
    </div>
  );
}

export function FormMessage({
  status,
  message,
}: {
  status: "idle" | "success" | "error";
  message?: string;
}) {
  if (status === "idle" || !message) return null;

  return (
    <p
      role={status === "error" ? "alert" : "status"}
      className={cn(
        "rounded-md px-3 py-2 text-sm",
        status === "error"
          ? "bg-destructive/10 text-destructive"
          : "bg-success/10 text-success"
      )}
    >
      {message}
    </p>
  );
}
