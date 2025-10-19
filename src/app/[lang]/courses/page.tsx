"use client"

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import PageWithSidebar from "@/components/layout/PageWithSidebar";
import { useAuthContext } from "@/contexts/AuthContext";
import { getSubjects, type Subject as SubjectOption } from "@/components/chat/SubjectSelector";
import { CourseRecommendation, getCourseRecommendations } from "@/services/courses";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import SubjectSearchCard from "@/components/courses/SubjectSearchCard";
import FreeSearchCard from "@/components/courses/FreeSearchCard";
import CoursesResults from "@/components/courses/CoursesResults";

export default function CoursesPage() {
  const params = useParams<{ lang: string }>();
  const lang = params?.lang || "en";
  const isArabic = lang === "ar";
  const router = useRouter();
  const { user, fullUser } = useAuthContext();

  const [selectedSubject, setSelectedSubject] = useState<string>("");
  const [subjectTopic, setSubjectTopic] = useState("");
  const [freeTopic, setFreeTopic] = useState("");
  const [courses, setCourses] = useState<CourseRecommendation[]>([]);
  const [subjectLoading, setSubjectLoading] = useState(false);
  const [freeLoading, setFreeLoading] = useState(false);
  const [refreshLoading, setRefreshLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeSearchLabel, setActiveSearchLabel] = useState<string | null>(null);
  const [lastTopicQuery, setLastTopicQuery] = useState<string | undefined>(undefined);
  const [resultsKey, setResultsKey] = useState(0);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const closeSidebar = useCallback(() => setSidebarOpen(false), []);
  const toggleSidebar = useCallback(() => setSidebarOpen((value) => !value), []);

  const showSidebar = Boolean(user);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") closeSidebar();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [closeSidebar]);

  const headingText = isArabic ? "دورات مقترحة" : "Recommended Courses";
  const subtitleText = isArabic ? "اختر مادة دراسية أو ابحث عن أي موضوع للحصول على روابط دورات من YouTube أو Udemy." : "Pick one of your subjects or search any topic to get curated YouTube or Udemy courses.";
  const subjectOptionTitle = isArabic ? "اختر من موادك الدراسية" : "Choose from your subjects";
  const subjectOptionDescription = isArabic ? "استخدم موادك المفضلة مع إمكانية إضافة موضوع محدد." : "Use one of your saved school subjects with an optional specific topic.";
  const freeOptionTitle = isArabic ? "ابحث عن أي موضوع آخر" : "Explore anything else";
  const freeOptionDescription = isArabic ? "اكتب أي مجال ترغب بتعلمه للحصول على توصيات مخصصة." : "Type any area you want to learn and receive tailored picks.";
  const selectPlaceholder = isArabic ? "اختر مادة" : "Select a subject";
  const subjectTopicPlaceholder = isArabic ? "موضوع محدد داخل هذه المادة (اختياري)" : "Specific topic within this subject (optional)";
  const freeTopicPlaceholder = isArabic ? "اكتب موضوعًا مثل البرمجة أو التصميم" : "Type a topic like programming or design";
  const subjectButtonText = isArabic ? "ابحث باستخدام المادة" : "Find courses for subject";
  const freeButtonText = isArabic ? "ابحث عن دورات" : "Find courses";
  const refreshText = isArabic ? "تحديث الاقتراحات" : "Refresh suggestions";
  const emptyStateText = isArabic ? "لم يتم العثور على دورات. جرّب صياغة مختلفة أو موضوعًا آخر." : "No courses found. Try a different phrasing or another topic.";
  const loadingMessage = isArabic ? "جاري تحميل الدورات..." : "Loading courses...";

  const arabicFontStyle = useMemo(() => (isArabic ? { fontFamily: "var(--font-arabic-sans)" } : undefined), [isArabic]);
  const availableSubjects = useMemo<SubjectOption[]>(() => {
    const system = (fullUser?.educationSystem as any) ?? null;
    const grade = fullUser?.grade ?? null;
    const list = getSubjects(system, grade);
    return Array.isArray(list) ? list : [];
  }, [fullUser?.educationSystem, fullUser?.grade]);

  const subjectLookup = useMemo(() => {
    const map = new Map<string, SubjectOption>();
    availableSubjects.forEach((item) => {
      map.set(item.id, item);
    });
    return map;
  }, [availableSubjects]);

  useEffect(() => {
    if (!selectedSubject && availableSubjects.length > 0) {
      setSelectedSubject(availableSubjects[0].id);
    }
  }, [availableSubjects, selectedSubject]);

  const fetchCourses = useCallback(
    async ({ topic, label, source }: { topic?: string; label?: string; source: 'subject' | 'free' | 'refresh' }) => {
      const queryTopic = topic?.trim();
      if (source === 'subject') {
        setSubjectLoading(true);
      } else if (source === 'free') {
        setFreeLoading(true);
      } else if (source === 'refresh') {
        setRefreshLoading(true);
      }
      setError(null);
      try {
        const response = await getCourseRecommendations({
          topic: queryTopic || undefined,
          language: isArabic ? "ar" : "en",
          count: 5,
        });
        setCourses(response.courses);
        setLastTopicQuery(queryTopic || undefined);
        if (response.courses.length > 0) {
          setResultsKey((value) => value + 1);
        }
        if (label) {
          setActiveSearchLabel(label);
        } else if (queryTopic) {
          setActiveSearchLabel(queryTopic);
        } else {
          setActiveSearchLabel(isArabic ? "اقتراحات عامة" : "General suggestions");
        }
      } catch (err: any) {
        const message = err?.message || (isArabic ? "تعذر جلب الدورات." : "Failed to fetch courses.");
        setError(message);
      } finally {
        if (source === 'subject') {
          setSubjectLoading(false);
        }
        if (source === 'free') {
          setFreeLoading(false);
        }
        if (source === 'refresh') {
          setRefreshLoading(false);
        }
      }
    },
    [isArabic]
  );

  const hasSearched = useMemo(() => activeSearchLabel !== null, [activeSearchLabel]);

  const handleSubjectSearch = useCallback(() => {
    if (subjectLoading || freeLoading || refreshLoading) {
      return;
    }
    if (!selectedSubject) {
      setError(isArabic ? "يرجى اختيار مادة." : "Please select a subject.");
      return;
    }
    const subjectMeta = subjectLookup.get(selectedSubject);
    if (!subjectMeta) {
      setError(isArabic ? "لم يتم العثور على البيانات الخاصة بالمادة." : "Subject data not found.");
      return;
    }
    const subjectName = isArabic ? subjectMeta.nameAr : subjectMeta.nameEn;
    const supplementary = subjectTopic.trim();
    const combinedTopic = supplementary ? `${subjectName} ${supplementary}` : subjectName;
    const label = supplementary ? `${subjectName} (${supplementary})` : subjectName;
    void fetchCourses({ topic: combinedTopic, label, source: 'subject' });
  }, [fetchCourses, freeLoading, isArabic, refreshLoading, selectedSubject, subjectLoading, subjectLookup, subjectTopic]);

  const handleFreeSearch = useCallback(() => {
    if (freeLoading || subjectLoading || refreshLoading) {
      return;
    }
    const trimmed = freeTopic.trim();
    if (!trimmed) {
      setError(isArabic ? "يرجى كتابة موضوع للبحث." : "Please enter a topic to search.");
      return;
    }
    void fetchCourses({ topic: trimmed, label: trimmed, source: 'free' });
  }, [fetchCourses, freeLoading, freeTopic, isArabic, refreshLoading, subjectLoading]);

  const handleRefresh = useCallback(() => {
    if (refreshLoading || subjectLoading || freeLoading) {
      return;
    }
    const label = activeSearchLabel || (isArabic ? "اقتراحات عامة" : "General suggestions");
    void fetchCourses({ topic: lastTopicQuery, label, source: 'refresh' });
  }, [activeSearchLabel, fetchCourses, freeLoading, isArabic, lastTopicQuery, refreshLoading, subjectLoading]);

  return (
    <PageWithSidebar lang={lang}>
      <main className="flex-1 overflow-y-auto">
          <div className="mx-auto w-full max-w-4xl px-4 py-6 space-y-6 animate-in fade-in-0 slide-in-from-bottom-2 duration-300">
            <header className="flex flex-col gap-2">
              <h1 className="text-2xl font-semibold" style={arabicFontStyle}>{headingText}</h1>
              <p className="text-sm text-muted-foreground" style={arabicFontStyle}>{subtitleText}</p>
            </header>

            <div className="grid gap-4 lg:grid-cols-2">
              <SubjectSearchCard
                isArabic={isArabic}
                arabicFontStyle={arabicFontStyle}
                availableSubjects={availableSubjects}
                selectedSubject={selectedSubject}
                onChangeSubject={(value) => { setSelectedSubject(value); setError(null); }}
                subjectTopic={subjectTopic}
                onChangeSubjectTopic={(value) => { setSubjectTopic(value); if (error) setError(null); }}
                onSearch={handleSubjectSearch}
                loading={subjectLoading}
                refreshLoading={refreshLoading}
                selectPlaceholder={selectPlaceholder}
                subjectOptionTitle={subjectOptionTitle}
                subjectOptionDescription={subjectOptionDescription}
                subjectTopicPlaceholder={subjectTopicPlaceholder}
                buttonText={subjectButtonText}
              />

              <FreeSearchCard
                isArabic={isArabic}
                arabicFontStyle={arabicFontStyle}
                value={freeTopic}
                onChange={(value) => { setFreeTopic(value); if (error) setError(null); }}
                onSearch={handleFreeSearch}
                onRefresh={handleRefresh}
                loading={freeLoading}
                refreshLoading={refreshLoading}
                title={freeOptionTitle}
                description={freeOptionDescription}
                placeholder={freeTopicPlaceholder}
                buttonText={freeButtonText}
                refreshText={refreshText}
              />
            </div>

            {error && (
              <div className="rounded-md bg-red-50/90 px-3 py-2 text-xs text-red-700 shadow-sm" style={arabicFontStyle}>
                {error}
              </div>
            )}

            {activeSearchLabel && (
              <div className="rounded-xl bg-primary/5 px-4 py-2 text-sm text-primary shadow-sm" style={arabicFontStyle}>
                {isArabic ? `يتم عرض النتائج لـ: ${activeSearchLabel}` : `Showing results for: ${activeSearchLabel}`}
              </div>
            )}

            {!hasSearched ? (
              <div className="rounded-xl border border-dashed border-border/60 bg-muted/30 px-6 py-12 text-center text-sm text-muted-foreground" style={arabicFontStyle}>
                {isArabic
                  ? "ابدأ بالبحث من خلال اختيار مادة أو كتابة موضوع للحصول على دورات مقترحة."
                  : "Start by selecting one of your subjects or typing a topic to see course suggestions."}
              </div>
            ) : (
              <CoursesResults
                isArabic={isArabic}
                loading={refreshLoading || subjectLoading || freeLoading}
                emptyText={emptyStateText}
                courses={courses}
              />
            )}
          </div>
        </main>
    </PageWithSidebar>
  );
}
