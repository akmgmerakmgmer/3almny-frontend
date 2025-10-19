"use client"

import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

type SubjectOption = { id: string; nameEn: string; nameAr: string };

type Props = {
  isArabic: boolean;
  arabicFontStyle?: React.CSSProperties;
  availableSubjects: SubjectOption[];
  selectedSubject: string;
  onChangeSubject: (id: string) => void;
  subjectTopic: string;
  onChangeSubjectTopic: (v: string) => void;
  onSearch: () => void;
  loading: boolean;
  refreshLoading: boolean;
  selectPlaceholder: string;
  subjectOptionTitle: string;
  subjectOptionDescription: string;
  subjectTopicPlaceholder: string;
  buttonText: string;
};

export default function SubjectSearchCard({ isArabic, arabicFontStyle, availableSubjects, selectedSubject, onChangeSubject, subjectTopic, onChangeSubjectTopic, onSearch, loading, refreshLoading, selectPlaceholder, subjectOptionTitle, subjectOptionDescription, subjectTopicPlaceholder, buttonText }: Props) {
  return (
    <Card className="border-border/60 bg-background/90 shadow-sm">
      <CardHeader className="space-y-2">
        <div>
          <CardTitle style={arabicFontStyle}>{subjectOptionTitle}</CardTitle>
          <CardDescription style={arabicFontStyle}>{subjectOptionDescription}</CardDescription>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="space-y-1.5">
          <Label htmlFor="subject" style={arabicFontStyle}>{isArabic ? "المادة" : "Subject"}</Label>
          {availableSubjects.length > 0 ? (
            <Select
              value={selectedSubject}
              onValueChange={(value) => onChangeSubject(value)}
              disabled={loading || refreshLoading}
            >
              <SelectTrigger id="subject" className={cn("h-11 text-sm", isArabic && "text-right")} style={arabicFontStyle}>
                <SelectValue placeholder={selectPlaceholder} />
              </SelectTrigger>
              <SelectContent>
                {availableSubjects.map((option) => {
                  const displayName = isArabic ? option.nameAr : option.nameEn;
                  return (
                    <SelectItem key={option.id} value={option.id}>
                      <span style={isArabic ? { fontFamily: "var(--font-arabic-sans)" } : undefined}>{displayName}</span>
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          ) : (
            <div className="rounded-md bg-muted/30 px-3 py-2 text-xs text-muted-foreground" style={arabicFontStyle}>
              {isArabic ? "قم بتحديث بيانات التعليم الخاصة بك لرؤية المواد." : "Update your education settings to see your subjects."}
            </div>
          )}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="subject-topic" style={arabicFontStyle}>{isArabic ? "موضوع محدد" : "Specific topic"}</Label>
          <Input
            id="subject-topic"
            value={subjectTopic}
            onChange={(event) => onChangeSubjectTopic(event.target.value)}
            placeholder={subjectTopicPlaceholder}
            className={cn("h-10 text-sm", isArabic && "text-right")}
            style={arabicFontStyle}
            disabled={loading || refreshLoading}
          />
        </div>
        <Button type="button" className="h-11 w-full bg-indigo-600 hover:bg-indigo-500" onClick={onSearch} disabled={loading || refreshLoading || availableSubjects.length === 0} style={arabicFontStyle}>
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          {buttonText}
        </Button>
      </CardContent>
    </Card>
  );
}


