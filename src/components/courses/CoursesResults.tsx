"use client"

import React from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ExternalLink, Loader2 } from "lucide-react";

export type CourseRecommendation = {
  title: string;
  platform: string;
  url: string;
  description: string;
  language?: string;
};

type Props = {
  isArabic: boolean;
  loading: boolean;
  emptyText: string;
  courses: CourseRecommendation[];
};

export default function CoursesResults({ isArabic, loading, emptyText, courses }: Props) {
  if (loading) {
    return (
      <div className="flex h-48 items-center justify-center text-muted-foreground">
        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
        {isArabic ? "جاري تحميل الدورات..." : "Loading courses..."}
      </div>
    );
  }

  if (courses.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-border/60 bg-muted/30 px-6 py-12 text-center text-sm text-muted-foreground">
        {emptyText}
      </div>
    );
  }

  return (
    <div className="space-y-4 animate-in fade-in-0 slide-in-from-bottom-2 duration-500">
      {courses.map((course) => {
        const courseUsesArabic = course.language === "ar" || /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF]/.test(course.title + course.description);
        const courseFont = courseUsesArabic ? { fontFamily: "var(--font-arabic-sans)" } : undefined;
        return (
          <Card key={`${course.platform}-${course.url}`} className="border-border/60 bg-background/90 shadow-sm transition hover:shadow">
            <CardHeader className="flex flex-col gap-2">
              <div className="flex flex-col gap-1">
                <CardTitle className="text-lg" style={courseFont}>{course.title}</CardTitle>
                <CardDescription className="text-xs uppercase tracking-[0.18em] text-muted-foreground/70" style={courseFont}>
                  {course.platform}
                </CardDescription>
              </div>
              <Button asChild size="sm" variant="outline" className="self-start" style={courseFont}>
                <a href={course.url} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="h-4 w-4" />
                  {isArabic ? "افتح الدورة" : "Open course"}
                </a>
              </Button>
            </CardHeader>
            <CardContent>
              <p className="text-sm leading-relaxed text-muted-foreground" style={courseFont}>
                {course.description}
              </p>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}


