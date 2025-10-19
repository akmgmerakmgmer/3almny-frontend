"use client"

import React from "react";
import { Button } from "@/components/ui/button";
import { Loader2, PlusCircle } from "lucide-react";
import DateTimeField from "@/components/records/DateTimeField";

type Props = {
  isArabic: boolean;
  submitting: boolean;
  startedAt: string;
  endedAt: string;
  onChangeStart: (v: string) => void;
  onChangeEnd: (v: string) => void;
  formError: string | null;
  canSubmit: boolean;
  onSubmit: (e: React.FormEvent) => void;
};

export default function ManualLogForm({ isArabic, submitting, startedAt, endedAt, onChangeStart, onChangeEnd, formError, canSubmit, onSubmit }: Props) {
  return (
    <div className="animate-in fade-in-0 slide-in-from-right-2 duration-300">
      <form className="space-y-4" onSubmit={onSubmit}>
        <div className="grid gap-4 md:grid-cols-2">
          <DateTimeField id="startedAt" label="Start" value={startedAt} onChange={onChangeStart} max={endedAt} disabled={submitting} />
          <DateTimeField id="endedAt" label="End" value={endedAt} onChange={onChangeEnd} min={startedAt} disabled={submitting} />
        </div>
        {formError && (<div className="rounded-md bg-red-50/90 px-3 py-2 text-xs text-red-700 shadow-sm">{formError}</div>)}
        <Button type="submit" disabled={!canSubmit || submitting} className="inline-flex w-full items-center gap-2 bg-indigo-600 hover:bg-indigo-700 focus:ring-indigo-600 disabled:opacity-70">
          {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
          <PlusCircle className="h-4 w-4" />
          {isArabic ? "تسجيل الجلسة" : "Log session"}
        </Button>
      </form>
    </div>
  );
}


