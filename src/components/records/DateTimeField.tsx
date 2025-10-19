"use client"

import React, { useMemo, useRef } from "react";
import { Label } from "@/components/ui/label";
import { CalendarClock } from "lucide-react";
import { cn } from "@/lib/utils";

export type DateTimeFieldProps = {
  id: string;
  label: string;
  value: string;
  onChange: (next: string) => void;
  disabled?: boolean;
  min?: string;
  max?: string;
};

export default function DateTimeField({ id, label, value, onChange, disabled, min, max }: DateTimeFieldProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);

  const { dateLabel, timeLabel, isValid } = useMemo(() => {
    if (!value) {
      return { dateLabel: "—", timeLabel: "—", isValid: false };
    }
    try {
      const date = new Date(value);
      if (Number.isNaN(date.getTime())) {
        return { dateLabel: "Invalid", timeLabel: "Invalid", isValid: false };
      }
      const dateStr = date.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
      const timeStr = date.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });
      return { dateLabel: dateStr, timeLabel: timeStr, isValid: true };
    } catch {
      return { dateLabel: "Invalid", timeLabel: "Invalid", isValid: false };
    }
  }, [value]);

  const handleFocus = () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (inputRef.current as any)?.showPicker?.();
  };

  return (
    <div className="space-y-1">
      <Label htmlFor={id} className="text-sm font-medium">
        {label}
      </Label>
      <div className="relative">
        <input
          ref={inputRef}
          type="datetime-local"
          id={id}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={handleFocus}
          disabled={disabled}
          min={min}
          max={max}
          className="peer absolute inset-0 z-10 h-full w-full cursor-pointer opacity-0"
        />
        <div
          className={cn(
            "flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background transition-colors",
            "peer-focus-visible:outline-none peer-focus-visible:ring-2 peer-focus-visible:ring-ring peer-focus-visible:ring-offset-2",
            disabled && "cursor-not-allowed opacity-50",
            !isValid && value && "border-red-500"
          )}
        >
          <div className="flex items-center gap-2">
            <CalendarClock className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
            <span className="text-muted-foreground">{dateLabel}</span>
            <span className="text-xs text-muted-foreground">·</span>
            <span className="text-foreground">{timeLabel}</span>
          </div>
        </div>
      </div>
    </div>
  );
}


