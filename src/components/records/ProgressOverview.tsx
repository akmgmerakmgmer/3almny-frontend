"use client"

import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Props = {
  isArabic: boolean;
  totalMinutes: number;
  sessionsCount: number;
  isExpanded: boolean;
  onToggle: () => void;
  formatDuration: (m: number) => string;
};

export default function ProgressOverview({ isArabic, totalMinutes, sessionsCount, isExpanded, onToggle, formatDuration }: Props) {
  return (
    <Card className="relative overflow-hidden border-none bg-gradient-to-br from-primary/10 via-primary/5 to-background shadow-xl shadow-primary/10">
      <CardHeader className="relative">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-primary/10 p-2.5">
              <svg className="h-6 w-6 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <div>
              <CardTitle className="text-xl">{isArabic ? "نظرة عامة على التقدم" : "Progress Overview"}</CardTitle>
              <CardDescription>{isArabic ? "يتم تحديث إجمالياتك عند إضافة جلسة جديدة." : "Your totals are updated whenever you add a new session."}</CardDescription>
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={onToggle} className="h-8 w-8 p-0 hover:bg-primary/10">
            <svg className={cn("h-5 w-5 text-primary transition-transform duration-300", !isExpanded && "rotate-180")} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
            </svg>
            <span className="sr-only">{isExpanded ? (isArabic ? "إخفاء" : "Collapse") : (isArabic ? "عرض" : "Expand")}</span>
          </Button>
        </div>
      </CardHeader>
      <div className={cn("grid transition-all duration-300 ease-in-out", isExpanded ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0")}>
        <div className="overflow-hidden">
          <CardContent className="relative pb-6">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="group relative overflow-hidden rounded-2xl border border-primary/20 bg-gradient-to-br from-background/95 to-background/70 p-6 shadow-lg transition-all hover:shadow-xl hover:scale-[1.02]">
                <div className="relative space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="rounded-lg bg-primary/10 p-2">
                      <svg className="h-5 w-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <p className="text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground/80">{isArabic ? "إجمالي الوقت" : "Total Time"}</p>
                  </div>
                  <p className="text-4xl font-bold text-foreground tracking-tight">{formatDuration(totalMinutes)}</p>
                  <p className="text-xs text-muted-foreground/70">{isArabic ? "من الدراسة المسجلة" : "of recorded study time"}</p>
                </div>
              </div>
              <div className="group relative overflow-hidden rounded-2xl border border-primary/20 bg-gradient-to-br from-background/95 to-background/70 p-6 shadow-lg transition-all hover:shadow-xl hover:scale-[1.02]">
                <div className="relative space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="rounded-lg bg-primary/10 p-2">
                      <svg className="h-5 w-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                    <p className="text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground/80">{isArabic ? "الجلسات المسجلة" : "Sessions Logged"}</p>
                  </div>
                  <p className="text-4xl font-bold text-foreground tracking-tight">{sessionsCount}</p>
                  <p className="text-xs text-muted-foreground/70">{isArabic ? "جلسة دراسية كاملة" : "completed study sessions"}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </div>
      </div>
    </Card>
  );
}


