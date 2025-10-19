"use client"

import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type SubjectOption = { id: string; nameEn: string; nameAr: string };

type Props = {
  isArabic: boolean;
  educationSystemLabel: string | null;
  educationSystemHint: string | null;
  selectedGradeDisplay: string;
  availableSubjects: SubjectOption[];
  subject: string;
  onSubjectChange: (id: string) => void;
  submitting: boolean;
  subjectMissingMessage: string;
  gradeMissingMessage: string;
  children?: React.ReactNode;
  isExpanded: boolean;
  onToggleExpanded: () => void;
};

export default function FocusSetupCard({ isArabic, educationSystemLabel, educationSystemHint, selectedGradeDisplay, availableSubjects, subject, onSubjectChange, submitting, subjectMissingMessage, gradeMissingMessage, children, isExpanded, onToggleExpanded }: Props) {
  return (
    <Card className="relative overflow-hidden border border-primary/25 bg-gradient-to-br from-primary/10 via-background/95 to-background shadow-xl shadow-primary/20">
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-primary/10 via-transparent to-primary/5" aria-hidden="true" />
      <CardHeader className="relative z-10 flex flex-col gap-4 pb-0 md:flex-row md:items-end md:justify-between">
        <div className="space-y-3">
          <span className="inline-flex w-fit items-center gap-2 rounded-full bg-primary/15 px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] text-primary">
            {isArabic ? "الخطوة ١" : "Step 1"}
          </span>
          <div className="space-y-2">
            <CardTitle className="text-2xl font-semibold">{isArabic ? "اضبط تركيزك الدراسي" : "Set your study focus"}</CardTitle>
            <CardDescription className="max-w-2xl text-sm">
              {isArabic ? "اختر الصف الدراسي والمادة ليقوم التطبيق بتخصيص التسجيلات والسجلات لك." : "Choose your grade and subject so every recording and logged session stays perfectly aligned."}
            </CardDescription>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="hidden md:flex items-center gap-3 rounded-2xl border border-primary/20 bg-background/70 px-4 py-3 text-sm font-medium shadow-sm">
            <div className="flex flex-col text-muted-foreground/80">
              <span className="text-xs uppercase tracking-[0.18em] text-muted-foreground/70">{isArabic ? "الصف الحالي" : "Current grade"}</span>
              <span className="text-base text-foreground">{selectedGradeDisplay}</span>
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={onToggleExpanded} className="h-8 w-8 p-0 hover:bg-primary/10">
            <svg className={cn("h-5 w-5 text-primary transition-transform duration-300", !isExpanded && "rotate-180")} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
            </svg>
            <span className="sr-only">{isExpanded ? (isArabic ? "إخفاء" : "Collapse") : (isArabic ? "عرض" : "Expand")}</span>
          </Button>
        </div>
      </CardHeader>
      <div className={cn("grid transition-all duration-300 ease-in-out", isExpanded ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0")}>
        <div className="overflow-hidden">
          <CardContent className="relative z-10 mt-6">
        <div className="grid gap-4 md:grid-cols-3">
          <div className="space-y-2">
            <Label htmlFor="education-system" className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground/70">{isArabic ? "النظام التعليمي" : "Education system"}</Label>
            {educationSystemLabel ? (
              <div className="space-y-1">
                <Input id="education-system" value={educationSystemLabel} readOnly disabled className="h-12 cursor-not-allowed border-primary/20 bg-background/70 text-sm font-medium" />
                {educationSystemHint && (<p className="text-xs text-muted-foreground/70">{educationSystemHint}</p>)}
              </div>
            ) : (
              <div className="rounded-md bg-muted/30 px-3 py-2 text-xs text-muted-foreground">{isArabic ? "قم بتحديث ملفك لتحديد النظام التعليمي." : "Update your profile to set your education system."}</div>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="grade" className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground/70">{isArabic ? "الصف الدراسي" : "Grade"}</Label>
            <Input id="grade" value={selectedGradeDisplay} readOnly disabled className="h-12 cursor-not-allowed border-primary/20 bg-background/70 text-sm font-medium" />
            {!selectedGradeDisplay || selectedGradeDisplay === (isArabic ? "غير محدد" : "Not selected") ? (
              <div className="rounded-md bg-muted/30 px-3 py-2 text-xs text-muted-foreground">{gradeMissingMessage}</div>
            ) : null}
          </div>
          <div className="space-y-2 md:col-span-1">
            <Label htmlFor="subject" className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground/70">{isArabic ? "المادة" : "Subject"}</Label>
            {availableSubjects.length > 0 ? (
              <Select value={subject} onValueChange={onSubjectChange} disabled={submitting}>
                <SelectTrigger className="h-12 rounded-xl border border-primary/30 bg-background/80 text-base font-medium">
                  <SelectValue placeholder={isArabic ? "اختر مادة" : "Choose a subject"} />
                </SelectTrigger>
                <SelectContent sideOffset={8} className="rounded-xl border border-primary/20 bg-background/95 shadow-xl">
                  {availableSubjects.map((opt) => (
                    <SelectItem key={opt.id} value={opt.id} className="rounded-lg py-2">
                      <span className="text-sm font-medium text-foreground">{isArabic ? opt.nameAr : opt.nameEn}</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <div className="rounded-md bg-muted/30 px-3 py-2 text-xs text-muted-foreground">{subjectMissingMessage}</div>
            )}
          </div>
        </div>
        {children && (
          <div className="mt-8">
            {children}
          </div>
        )}
          </CardContent>
        </div>
      </div>
    </Card>
  );
}


