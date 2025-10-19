"use client"

import React from "react";
import { Button } from "@/components/ui/button";
import { Loader2, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { StudyRecord } from "@/services/study-records";

type Props = {
  records: StudyRecord[];
  isArabic: boolean;
  subjectNameFor: (subjectId: string) => string;
  isRemoving: (id: string) => boolean;
  isRecentlyAdded: (id: string) => boolean;
  onDelete: (id: string) => void;
  formatDateTime: (iso: string) => string;
  formatDuration: (minutes: number) => string;
  containsArabic: (text: string) => boolean;
};

export default function RecordsList({ records, isArabic, subjectNameFor, isRemoving, isRecentlyAdded, onDelete, formatDateTime, formatDuration, containsArabic }: Props) {
  if (records.length === 0) {
    return (
      <div className="rounded-xl bg-muted/30 px-6 py-12 text-center text-sm text-muted-foreground shadow-inner">
        No study sessions logged yet. Start by recording your next study block.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {records.map((record) => {
        const displaySubjectName = subjectNameFor(record.subject);
        const removing = isRemoving(record.id);
        const recently = isRecentlyAdded(record.id);
        return (
          <div key={record.id} className={cn("relative rounded-xl bg-card/70 p-4 shadow-sm ring-1 ring-border/20 transition-all duration-300", recently && "animate-in fade-in-0 slide-in-from-bottom-2", removing && "pointer-events-none opacity-60")}>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="space-y-1">
                <h2 className="text-base font-semibold text-foreground capitalize" style={containsArabic(displaySubjectName) ? { fontFamily: 'var(--font-arabic-sans)', fontSize: '0.95rem' } : undefined}>
                  {displaySubjectName}
                </h2>
                <p className="text-xs text-muted-foreground">
                  {formatDateTime(record.startedAt)} — {formatDateTime(record.endedAt)}
                </p>
                <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground/70">{formatDuration(record.timeSpentMinutes)} studied</p>
              </div>
              <Button type="button" variant="ghost" size="sm" onClick={() => onDelete(record.id)} disabled={removing} className="inline-flex items-center gap-1 text-red-600 disabled:opacity-80 hover:bg-red-100 hover:text-red-500">
                {removing ? (<Loader2 className="h-4 w-4 animate-spin text-red-600" />) : (<Trash2 className="h-4 w-4" />)}
                {removing ? "Removing" : "Remove"}
              </Button>
            </div>
          </div>
        );
      })}
    </div>
  );
}


