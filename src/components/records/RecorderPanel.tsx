"use client"

import React from "react";
import { Button } from "@/components/ui/button";
import { Loader2, Mic, PlusCircle, StopCircle } from "lucide-react";
import { cn } from "@/lib/utils";

type Props = {
  isArabic: boolean;
  recordingMode: "timer" | "manual";
  setRecordingMode: (mode: "timer" | "manual") => void;
  isRecording: boolean;
  submitting: boolean;
  canStopRecording: boolean;
  canStartRecording: boolean;
  recordingButtonDisabled: boolean;
  recordingStatusTitle: string;
  recordingStatusSubtitle: string;
  liveTimerLabel: string;
  onStart: () => void;
  onStop: () => void;
};

export default function RecorderPanel({ isArabic, recordingMode, setRecordingMode, isRecording, submitting, canStopRecording, canStartRecording, recordingButtonDisabled, recordingStatusTitle, recordingStatusSubtitle, liveTimerLabel, onStart, onStop }: Props) {
  return (
    <div className="mt-8 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-foreground">{isArabic ? "تسجيل جلسة دراسية" : "Record Study Session"}</h3>
        <p className="text-xs text-muted-foreground">{isArabic ? "اختر طريقة التسجيل المفضلة لديك." : "Choose your preferred recording method."}</p>
      </div>

      <div className="flex gap-2 rounded-lg bg-muted/30 p-1">
        <button type="button" onClick={() => setRecordingMode("timer")} className={cn("flex-1 rounded-md px-4 py-2.5 text-sm font-medium transition-all", recordingMode === "timer" ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground")}
        >
          <div className="flex items-center justify-center gap-2">
            <Mic className="h-4 w-4" />
            <span>{isArabic ? "مؤقت تلقائي" : "Auto Timer"}</span>
          </div>
        </button>
        <button type="button" onClick={() => setRecordingMode("manual")} className={cn("flex-1 rounded-md px-4 py-2.5 text-sm font-medium transition-all", recordingMode === "manual" ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground")}
        >
          <div className="flex items-center justify-center gap-2">
            <PlusCircle className="h-4 w-4" />
            <span>{isArabic ? "تسجيل يدوي" : "Manual Log"}</span>
          </div>
        </button>
      </div>

      {recordingMode === "timer" && (
        <div className="space-y-4 animate-in fade-in-0 slide-in-from-left-2 duration-300">
          <div className="rounded-xl border border-dashed border-primary/30 bg-primary/5 px-4 py-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="space-y-1">
                <p className="text-sm font-semibold text-foreground">{recordingStatusTitle}</p>
                <p className="text-xs text-muted-foreground/90">{recordingStatusSubtitle}</p>
              </div>
              <Button type="button" onClick={isRecording ? onStop : onStart} disabled={recordingButtonDisabled} className={cn("inline-flex items-center gap-2 px-4", isRecording ? "bg-red-600 hover:bg-red-700 focus:ring-red-600" : "bg-emerald-600 hover:bg-emerald-700 focus:ring-emerald-600")}
              >
                {isRecording ? (submitting ? (<Loader2 className="h-4 w-4 animate-spin" />) : (<StopCircle className="h-4 w-4" />)) : (<Mic className="h-4 w-4" />)}
                {isArabic ? (isRecording ? "إيقاف التسجيل" : "ابدأ التسجيل") : (isRecording ? "Stop recording" : "Start recording")}
              </Button>
            </div>
            {isRecording && (
              <div className="mt-3 flex items-center gap-2 text-sm font-medium text-primary">
                <span className="inline-flex h-2.5 w-2.5 animate-pulse rounded-full bg-primary" aria-hidden="true" />
                <span>{liveTimerLabel}</span>
              </div>
            )}
            {isRecording && !canStopRecording && (
              <div className="mt-3 flex items-center gap-2 rounded-md border border-orange-300 bg-orange-100 px-3 py-2 text-xs font-medium text-orange-900">
                <svg className="h-4 w-4 flex-shrink-0 text-orange-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <span>{isArabic ? "يجب التسجيل لمدة 30 ثانية على الأقل قبل الإيقاف." : "Record for at least 30 seconds before stopping."}</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}


