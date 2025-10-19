"use client"

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import PageWithSidebar from "@/components/layout/PageWithSidebar";
import { useAuthContext } from "@/contexts/AuthContext";
import { getSubjects, type Subject as SubjectOption, type EduSystem } from "@/components/chat/SubjectSelector";
import { educationSystems } from "@/components/chat/EducationSystemSelector";
import { gradesBySystem } from "@/components/chat/GradeSelector";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { listStudyRecords, createStudyRecord, deleteStudyRecord, getRecordFilters, type StudyRecord } from "@/services/study-records";
import { Loader2, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import FocusSetupCard from "@/components/records/FocusSetupCard";
import RecorderPanel from "@/components/records/RecorderPanel";
import ManualLogForm from "@/components/records/ManualLogForm";
import type { User } from "@/services/users";

function toLocalDateTimeInput(date: Date) {
  const iso = new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString();
  return iso.slice(0, 16);
}

function formatDuration(minutes: number) {
  if (!Number.isFinite(minutes) || minutes <= 0) return "0m";
  const hrs = Math.floor(minutes / 60);
  const mins = Math.round(minutes % 60);
  if (hrs === 0) return `${mins}m`;
  if (mins === 0) return `${hrs}h`;
  return `${hrs}h ${mins}m`;
}

function containsArabic(text: string): boolean {
  return /[\u0600-\u06FF]/.test(text);
}

const MIN_RECORDING_MS = 0;

type Props = {
  lang: string;
  initialUser: User | null;
  initialRecords: StudyRecord[];
  initialUnauthorized: boolean;
};

export default function StudyRecordsClient({ lang, initialUser, initialRecords, initialUnauthorized }: Props) {
  const router = useRouter();
  const isArabic = lang === "ar";

  const { user, fullUser, updatePreferences } = useAuthContext();
  const effectiveUser = fullUser ?? initialUser ?? null;
  const educationSystem = effectiveUser?.educationSystem ?? null;
  const userGrade = effectiveUser?.grade ?? null;
  const userSubject = effectiveUser?.subject ?? null;

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [records, setRecords] = useState<StudyRecord[]>(initialRecords || []);
  const [error, setError] = useState<string | null>(null);
  const [unauthorized, setUnauthorized] = useState(initialUnauthorized);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [preferencesError, setPreferencesError] = useState<string | null>(null);

  const [selectedGrade, setSelectedGrade] = useState<string | null>(userGrade ?? null);
  const [subject, setSubject] = useState<string>(userSubject || "");

  const getDefaultEndTime = () => toLocalDateTimeInput(new Date());
  const getDefaultStartTime = () => {
    const oneHourAgo = new Date();
    oneHourAgo.setHours(oneHourAgo.getHours() - 1);
    return toLocalDateTimeInput(oneHourAgo);
  };

  const [startedAt, setStartedAt] = useState<string>(getDefaultStartTime());
  const [endedAt, setEndedAt] = useState<string>(getDefaultEndTime());

  const [isRecording, setIsRecording] = useState(false);
  const [recordingStartedAt, setRecordingStartedAt] = useState<Date | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  const [removingIds, setRemovingIds] = useState<Set<string>>(new Set());
  const [recentlyAddedIds, setRecentlyAddedIds] = useState<Set<string>>(new Set());
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [recordingMode, setRecordingMode] = useState<"timer" | "manual">("timer");
  const [isProgressExpanded, setIsProgressExpanded] = useState(true);
  const [isFocusExpanded, setIsFocusExpanded] = useState(true);
  const [filterSubject, setFilterSubject] = useState<string>("all");
  const [filterGrade, setFilterGrade] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [filteredTotal, setFilteredTotal] = useState(0);
  const [filteredTotalMinutes, setFilteredTotalMinutes] = useState(0);
  const [availableSubjectsFromRecords, setAvailableSubjectsFromRecords] = useState<string[]>([]);
  const [loadingFilters, setLoadingFilters] = useState(false);

  const RECORDS_PER_PAGE = 20;

  useEffect(() => {
    setSelectedGrade(userGrade ?? null);
  }, [userGrade]);

  useEffect(() => {
    setSubject(userSubject || "");
  }, [userSubject]);

  // This effect is replaced by the fetchRecords logic below

  useEffect(() => {
    if (!isRecording || !recordingStartedAt) return;
    const interval = setInterval(() => {
      const nowMs = Date.now();
      const startedMs = recordingStartedAt.getTime();
      const diffMs = nowMs - startedMs;
      const seconds = Math.floor(diffMs / 1000);
      setElapsedSeconds(seconds);
      setEndedAt(toLocalDateTimeInput(new Date(nowMs)));
    }, 1000);
    return () => clearInterval(interval);
  }, [isRecording, recordingStartedAt]);

  const toggleSidebar = () => setSidebarOpen((prev) => !prev);
  const closeSidebar = () => setSidebarOpen(false);

  const educationSystemDetails = useMemo(
    () => educationSystems.find((sys) => sys.id === educationSystem) ?? null,
    [educationSystem]
  );

  const gradeOptions = useMemo(() => {
    if (!educationSystem) return [];
    return gradesBySystem[educationSystem as keyof typeof gradesBySystem] || [];
  }, [educationSystem]);

  const availableSubjects = useMemo(() => {
    if (!educationSystem || !selectedGrade) return [];
    return getSubjects(educationSystem as EduSystem | null, selectedGrade);
  }, [educationSystem, selectedGrade]);

  const subjectLookup = useMemo(() => {
    const map = new Map<string, SubjectOption>();
    for (const subj of availableSubjects) {
      map.set(subj.id, subj);
    }
    return map;
  }, [availableSubjects]);

  const totalMinutes = useMemo(() => {
    return records.reduce((sum, record) => sum + (record.timeSpentMinutes || 0), 0);
  }, [records]);

  // Create a global subject lookup including all possible subjects
  const globalSubjectLookup = useMemo(() => {
    const map = new Map<string, SubjectOption>();
    if (educationSystem) {
      gradeOptions.forEach(gradeOpt => {
        const subjects = getSubjects(educationSystem as EduSystem | null, gradeOpt.id);
        subjects.forEach(subj => {
          if (!map.has(subj.id)) {
            map.set(subj.id, subj);
          }
        });
      });
    }
    return map;
  }, [educationSystem, gradeOptions]);

  // Get all unique subjects from API with their associated grades
  const allRecordSubjects = useMemo(() => {
    const subjectsMap = new Map<string, { subject: string; grades: Set<string> }>();
    
    availableSubjectsFromRecords.forEach(subjectId => {
      // Find which grade this subject belongs to
      let foundGrade = null;
      if (educationSystem) {
        for (const gradeOpt of gradeOptions) {
          const gradeSubjects = getSubjects(educationSystem as EduSystem | null, gradeOpt.id);
          if (gradeSubjects.some(s => s.id === subjectId)) {
            foundGrade = gradeOpt.id;
            break;
          }
        }
      }
      
      if (!subjectsMap.has(subjectId)) {
        subjectsMap.set(subjectId, { subject: subjectId, grades: new Set() });
      }
      if (foundGrade) {
        subjectsMap.get(subjectId)!.grades.add(foundGrade);
      }
    });
    
    return Array.from(subjectsMap.values());
  }, [availableSubjectsFromRecords, educationSystem, gradeOptions]);

  // Get unique grades from records
  const recordGrades = useMemo(() => {
    const gradesSet = new Set<string>();
    allRecordSubjects.forEach(({ grades }) => {
      grades.forEach(grade => gradesSet.add(grade));
    });
    return Array.from(gradesSet).sort();
  }, [allRecordSubjects]);

  // Fetch records with filters and pagination
  const fetchRecords = useCallback(async (page: number = 0, resetRecords: boolean = false) => {
    if (!effectiveUser) return;
    
    setLoading(true);
    try {
      const offset = page * RECORDS_PER_PAGE;
      const res = await listStudyRecords({
        subject: filterSubject !== "all" ? filterSubject : undefined,
        offset,
        limit: RECORDS_PER_PAGE,
      });
      
      let processedRecords = res.records || [];
      
      // Apply grade filter client-side since backend doesn't store grade with records
      if (filterGrade !== "all") {
        processedRecords = processedRecords.filter(record => {
          if (!educationSystem) return true;
          for (const gradeOpt of gradeOptions) {
            const gradeSubjects = getSubjects(educationSystem as EduSystem | null, gradeOpt.id);
            if (gradeSubjects.some(s => s.id === record.subject) && gradeOpt.id === filterGrade) {
              return true;
            }
          }
          return false;
        });
      }
      
      if (resetRecords || page === 0) {
        setRecords(processedRecords);
      } else {
        setRecords(prev => [...prev, ...processedRecords]);
      }
      
      setHasMore(res.hasMore);
      setFilteredTotal(res.filteredTotal);
      setFilteredTotalMinutes(res.filteredTotalMinutes);
      setCurrentPage(page);
      setError(null);
      setUnauthorized(false);
    } catch (err: unknown) {
      if ((err as { message?: string })?.message === "UNAUTHORIZED") {
        setUnauthorized(true);
      } else {
        setError((err as { message?: string })?.message || "Failed to load study records");
      }
    } finally {
      setLoading(false);
    }
  }, [effectiveUser, filterSubject, filterGrade, RECORDS_PER_PAGE, educationSystem, gradeOptions]);

  // Fetch available filters from API
  const fetchFilters = useCallback(async () => {
    if (!effectiveUser) return;
    
    setLoadingFilters(true);
    try {
      const filtersData = await getRecordFilters();
      setAvailableSubjectsFromRecords(filtersData.subjects || []);
    } catch (err: unknown) {
      console.error("Failed to fetch filters:", err);
    } finally {
      setLoadingFilters(false);
    }
  }, [effectiveUser]);

  // Fetch filters on mount and when user changes
  useEffect(() => {
    if (effectiveUser) {
      fetchFilters();
    }
  }, [effectiveUser, fetchFilters]);

  // Reset to page 0 when filters change
  useEffect(() => {
    if (effectiveUser) {
      setCurrentPage(0);
      fetchRecords(0, true);
    }
  }, [filterSubject, filterGrade, effectiveUser]);

  const processCreatedRecord = useCallback((record: StudyRecord, endedAtISO: string) => {
    // Reset to page 0 and fetch fresh data after creating a record
    setCurrentPage(0);
    fetchRecords(0, true);
    fetchFilters(); // Refresh available filters
    setStartedAt("");
    setEndedAt("");
    setFormError(null);
    setShowSuccessMessage(true);
    setTimeout(() => setShowSuccessMessage(false), 3000);
  }, [fetchRecords, fetchFilters]);

  const handleGradeChange = useCallback(async (newGrade: string) => {
    setSelectedGrade(newGrade);
    setSubject("");
    setPreferencesError(null);
    try {
      await updatePreferences({ grade: newGrade, subject: "" });
    } catch (err: unknown) {
      setPreferencesError((err as { message?: string })?.message || "Failed to update grade preference");
    }
  }, [updatePreferences]);

  const handleSubjectChange = useCallback(async (newSubject: string) => {
    setSubject(newSubject);
    setPreferencesError(null);
    try {
      await updatePreferences({ subject: newSubject });
    } catch (err: unknown) {
      setPreferencesError((err as { message?: string })?.message || "Failed to update subject preference");
    }
  }, [updatePreferences]);

  const handleSubmit = useCallback(async (event: React.FormEvent) => {
    event.preventDefault();
    setFormError(null);

    if (!educationSystem) { setFormError("Education system information is required"); return; }
    if (!selectedGrade) { setFormError("Grade is required"); return; }
    if (!subject) { setFormError("Subject is required"); return; }
    if (!startedAt || !endedAt) { setFormError("Both start and end times are required"); return; }
    if (isRecording) { setFormError("Cannot log a session manually while recording is in progress"); return; }

    setSubmitting(true);
    try {
      const payload = { subject, startedAt: new Date(startedAt).toISOString(), endedAt: new Date(endedAt).toISOString() };
      const { record } = await createStudyRecord(payload);
      processCreatedRecord(record, payload.endedAt);
      const newEndTime = new Date();
      const newStartTime = new Date();
      newStartTime.setHours(newStartTime.getHours() - 1);
      setStartedAt(toLocalDateTimeInput(newStartTime));
      setEndedAt(toLocalDateTimeInput(newEndTime));
      setFormError(null);
    } catch (err: unknown) {
      if ((err as { message?: string })?.message === "UNAUTHORIZED") { setUnauthorized(true); return; }
      setFormError((err as { message?: string })?.message || "Failed to create study record");
    } finally {
      setSubmitting(false);
    }
  }, [subject, startedAt, endedAt, educationSystem, selectedGrade, isRecording, processCreatedRecord]);

  const handleStartRecording = useCallback(() => {
    setFormError(null);
    if (isRecording) return;
    if (!educationSystem) { setFormError("Education system information is required to start recording"); return; }
    if (!selectedGrade) { setFormError("Grade is required"); return; }
    if (!subject) { setFormError("Subject is required"); return; }
    const now = new Date();
    setRecordingStartedAt(now);
    setStartedAt(toLocalDateTimeInput(now));
    setEndedAt(toLocalDateTimeInput(now));
    setElapsedSeconds(0);
    setIsRecording(true);
  }, [educationSystem, selectedGrade, subject, isRecording]);

  const handleStopRecording = useCallback(async () => {
    if (!isRecording || !recordingStartedAt) return;
    const nowMs = Date.now();
    const startedMs = recordingStartedAt.getTime();
    if (nowMs - startedMs < MIN_RECORDING_MS) {
      setFormError(isArabic ? "استمر بالتسجيل لمدة أطول (30 ثانية على الأقل) قبل الإيقاف." : "Keep recording for at least 30 seconds before stopping.");
      return;
    }
    if (!educationSystem) {
      setFormError("Education system information is required to save the recording");
      setIsRecording(false);
      setRecordingStartedAt(null);
      setElapsedSeconds(0);
      return;
    }
    if (!selectedGrade) { setFormError("Grade is required"); return; }
    if (!subject) { setFormError("Subject is required"); return; }

    setSubmitting(true);
    const endDate = new Date();
    const payload = { subject, startedAt: recordingStartedAt.toISOString(), endedAt: endDate.toISOString() };
    try {
      const { record } = await createStudyRecord(payload);
      processCreatedRecord(record, payload.endedAt);
      setFormError(null);
    } catch (err: unknown) {
      if ((err as { message?: string })?.message === "UNAUTHORIZED") { setUnauthorized(true); }
      else { setFormError((err as { message?: string })?.message || "Failed to save recorded session"); }
    } finally {
      setSubmitting(false);
      setIsRecording(false);
      setRecordingStartedAt(null);
      setElapsedSeconds(0);
    }
  }, [isRecording, recordingStartedAt, educationSystem, selectedGrade, subject, processCreatedRecord, isArabic]);

  const handleDelete = useCallback(async (recordId: string) => {
    setRemovingIds((prev) => { const next = new Set(prev); next.add(recordId); return next; });
    try {
      await deleteStudyRecord(recordId);
      // Refresh current view and filters
      await fetchRecords(currentPage, true);
      await fetchFilters();
      setError(null);
      setUnauthorized(false);
    } catch (err: unknown) {
      if ((err as { message?: string })?.message === "UNAUTHORIZED") { setUnauthorized(true); }
      else { setError((err as { message?: string })?.message || "Failed to delete record"); }
    } finally {
      setRemovingIds((prev) => { const next = new Set(prev); next.delete(recordId); return next; });
    }
  }, [fetchRecords, fetchFilters, currentPage]);

  useEffect(() => {
    if (recentlyAddedIds.size === 0) return;
    const timer = setTimeout(() => { setRecentlyAddedIds((prev) => { if (prev.size === 0) return prev; return new Set(); }); }, 600);
    return () => clearTimeout(timer);
  }, [recentlyAddedIds]);

  const showSidebar = Boolean(user || initialUser);

  const dateTimeFormatter = useMemo(() => new Intl.DateTimeFormat(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }), []);

  const liveMinutes = Math.floor(elapsedSeconds / 60);
  const liveSeconds = elapsedSeconds % 60;
  const liveTimerLabel = `${String(liveMinutes).padStart(2, "0")}:${String(liveSeconds).padStart(2, "0")}`;
  const educationSystemLabel = educationSystemDetails ? (isArabic ? educationSystemDetails.nameAr : educationSystemDetails.nameEn) : null;
  const educationSystemHint = educationSystemDetails ? (isArabic ? educationSystemDetails.descriptionAr : educationSystemDetails.description) : null;
  const canStartRecording = Boolean(educationSystem && selectedGrade && subject);
  const canStopRecording = isRecording && elapsedSeconds >= 30;
  const recordingButtonDisabled = isRecording ? (submitting || !canStopRecording) : !canStartRecording || submitting;
  const recordingButtonLabel = isRecording ? (isArabic ? "إيقاف التسجيل" : "Stop recording") : (isArabic ? "ابدأ التسجيل" : "Start recording");
  const recordingStatusTitle = isRecording ? (isArabic ? "التسجيل قيد التنفيذ" : "Recording in progress") : (isArabic ? "مسجل الدراسة" : "Quick recorder");
  const recordingStatusSubtitle = isRecording
    ? (isArabic ? "دع التطبيق يتتبع وقت دراستك تلقائياً." : "We are tracking your study time automatically.")
    : (isArabic ? "ابدأ تسجيلاً لحساب وقتك الدراسي تلقائياً." : "Start a timer to track your study session automatically.");
  const gradePlaceholder = isArabic ? "اختر الصف الدراسي" : "Choose a grade";
  const gradeMissingMessage = isArabic
    ? "قم بتحديث ملفك لتحديد النظام التعليمي قبل اختيار الصف."
    : "Update your profile to set an education system before choosing a grade.";
  const subjectMissingMessage = isArabic
    ? "اختر الصف الدراسي لعرض المواد المتاحة."
    : "Select a grade to view available subjects.";
  const selectedGradeOption = useMemo(() => gradeOptions.find((grade) => grade.id === selectedGrade) ?? null, [gradeOptions, selectedGrade]);
  const selectedGradeDisplay = selectedGradeOption
    ? (isArabic ? selectedGradeOption.nameAr : selectedGradeOption.nameEn)
    : (isArabic ? "غير محدد" : "Not selected");
  const selectedSubjectOption = subject ? globalSubjectLookup.get(subject) ?? null : null;
  const selectedSubjectDisplay = selectedSubjectOption
    ? (isArabic ? selectedSubjectOption.nameAr : selectedSubjectOption.nameEn)
    : (isArabic ? "غير محدد" : "Not selected");

  return (
    <PageWithSidebar lang={lang}>
      <div className="flex-1">
        
        <div className="">
        </div>
        <div className="">
        </div>
        <div className="">
        </div>
        <div className="">
        </div>
        <div className="">
        </div>
        <div className="">
        </div>
        <div className="">
        </div>
        <div className="">
        </div>
        <div className="">
        </div>
        <div className="">
        </div>
        <div className="">
        </div>
        <div className="">
        </div>
        
        <main className="flex-1 overflow-y-auto">
          <div className="mx-auto w-full max-w-4xl px-4 py-6 space-y-6 animate-in fade-in-0 slide-in-from-bottom-2 duration-300">
            <header className="flex flex-col gap-2">
              <h1 className="text-2xl font-semibold">Study Records</h1>
              <p className="text-sm text-muted-foreground">Track your study sessions and keep an eye on your learning streak.</p>
            </header>

              <div className="space-y-6">
                <FocusSetupCard
                  isArabic={isArabic}
                  educationSystemLabel={educationSystemLabel}
                  educationSystemHint={educationSystemHint}
                  selectedGradeDisplay={selectedGradeDisplay}
                  availableSubjects={availableSubjects}
                  subject={subject}
                  onSubjectChange={handleSubjectChange}
                  submitting={submitting}
                  subjectMissingMessage={subjectMissingMessage}
                  gradeMissingMessage={gradeMissingMessage}
                  isExpanded={isFocusExpanded}
                  onToggleExpanded={() => setIsFocusExpanded(!isFocusExpanded)}
                >
                  <RecorderPanel
                    isArabic={isArabic}
                    recordingMode={recordingMode}
                    setRecordingMode={setRecordingMode}
                    isRecording={isRecording}
                    submitting={submitting}
                    canStopRecording={canStopRecording}
                    canStartRecording={canStartRecording}
                    recordingButtonDisabled={recordingButtonDisabled}
                    recordingStatusTitle={recordingStatusTitle}
                    recordingStatusSubtitle={recordingStatusSubtitle}
                    liveTimerLabel={liveTimerLabel}
                    onStart={handleStartRecording}
                    onStop={handleStopRecording}
                  />

                  {recordingMode === "manual" && (
                    <ManualLogForm
                      isArabic={isArabic}
                      submitting={submitting}
                      startedAt={startedAt}
                      endedAt={endedAt}
                      onChangeStart={setStartedAt}
                      onChangeEnd={setEndedAt}
                      formError={formError}
                      canSubmit={!submitting && !!subject && !!selectedGrade && availableSubjects.length > 0 && !isRecording}
                      onSubmit={handleSubmit}
                    />
                  )}
                </FocusSetupCard>

                {showSuccessMessage && (
                  <div className="fixed bottom-6 right-6 z-50 animate-in slide-in-from-bottom-5 fade-in-0 duration-300">
                    <div className="flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 shadow-lg">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-100">
                        <svg className="h-5 w-5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-emerald-900">{isArabic ? "تم الحفظ بنجاح!" : "Record saved successfully!"}</p>
                        <p className="text-xs text-emerald-700">{isArabic ? "تمت إضافة جلستك الدراسية" : "Your study session has been added"}</p>
                      </div>
                    </div>
                  </div>
                )}

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
                      <Button variant="ghost" size="sm" onClick={() => setIsProgressExpanded(!isProgressExpanded)} className="h-8 w-8 p-0 hover:bg-primary/10">
                        <svg className={cn("h-5 w-5 text-primary transition-transform duration-300", !isProgressExpanded && "rotate-180")} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                        </svg>
                        <span className="sr-only">{isProgressExpanded ? (isArabic ? "إخفاء" : "Collapse") : (isArabic ? "عرض" : "Expand")}</span>
                      </Button>
                    </div>
                  </CardHeader>
                  <div className={cn("grid transition-all duration-300 ease-in-out", isProgressExpanded ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0")}
                  >
                    <div className="overflow-hidden">
                      <CardContent className="relative pb-6">
                        {/* Filters */}
                        <div className="mb-6 flex flex-wrap gap-3 animate-in fade-in-0 slide-in-from-top-2 duration-500">
                          <div className="flex-1 min-w-[200px] animate-in fade-in-0 slide-in-from-left-2 duration-500" style={{ animationDelay: '50ms', animationFillMode: 'backwards' }}>
                            <Label htmlFor="filter-grade" className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground/70 mb-2 block">
                              {isArabic ? "تصفية حسب الصف" : "Filter by Grade"}
                            </Label>
                            <Select value={filterGrade} onValueChange={setFilterGrade} disabled={loadingFilters}>
                                <SelectTrigger id="filter-grade" className="h-10 rounded-lg border border-primary/30 bg-background/80">
                                  <SelectValue placeholder={isArabic ? "كل الصفوف" : "All grades"} />
                                </SelectTrigger>
                                <SelectContent className="rounded-lg border border-primary/20 bg-background/95 shadow-xl">
                                  <SelectItem value="all" className="rounded-md">
                                    <span className="text-sm font-medium">{isArabic ? "كل الصفوف" : "All grades"}</span>
                                  </SelectItem>
                                  {recordGrades.map(gradeId => {
                                    const gradeOpt = gradeOptions.find(g => g.id === gradeId);
                                    if (!gradeOpt) return null;
                                    return (
                                      <SelectItem key={gradeId} value={gradeId} className="rounded-md">
                                        <span className="text-sm font-medium">{isArabic ? gradeOpt.nameAr : gradeOpt.nameEn}</span>
                                      </SelectItem>
                                    );
                                  })}
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="flex-1 min-w-[200px] animate-in fade-in-0 slide-in-from-right-2 duration-500" style={{ animationDelay: '100ms', animationFillMode: 'backwards' }}>
                              <Label htmlFor="filter-subject" className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground/70 mb-2 block">
                                {isArabic ? "تصفية حسب المادة" : "Filter by Subject"}
                              </Label>
                              <Select value={filterSubject} onValueChange={setFilterSubject} disabled={loadingFilters}>
                                <SelectTrigger id="filter-subject" className="h-10 rounded-lg border border-primary/30 bg-background/80">
                                  <SelectValue placeholder={isArabic ? "كل المواد" : "All subjects"} />
                                </SelectTrigger>
                                <SelectContent className="rounded-lg border border-primary/20 bg-background/95 shadow-xl">
                                  <SelectItem value="all" className="rounded-md">
                                    <span className="text-sm font-medium">{isArabic ? "كل المواد" : "All subjects"}</span>
                                  </SelectItem>
                                  {allRecordSubjects.map(({ subject: subj }) => {
                                    const subjectOpt = globalSubjectLookup.get(subj);
                                    const displayName = subjectOpt ? (isArabic ? subjectOpt.nameAr : subjectOpt.nameEn) : subj;
                                    return (
                                      <SelectItem key={subj} value={subj} className="rounded-md">
                                        <span className="text-sm font-medium">{displayName}</span>
                                      </SelectItem>
                                    );
                                  })}
                                </SelectContent>
                              </Select>
                            </div>
                            {(filterGrade !== "all" || filterSubject !== "all") && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setFilterGrade("all");
                                  setFilterSubject("all");
                                }}
                                className="self-end h-10 border-primary/30 hover:bg-primary/10"
                              >
                                <svg className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                                {isArabic ? "إعادة تعيين" : "Clear filters"}
                              </Button>
                            )}
                          </div>

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
                              <p className="text-4xl font-bold text-foreground tracking-tight">{formatDuration(filteredTotalMinutes)}</p>
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
                              <p className="text-4xl font-bold text-foreground tracking-tight">{filteredTotal}</p>
                              <p className="text-xs text-muted-foreground/70">{isArabic ? "جلسة دراسية كاملة" : "completed study sessions"}</p>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </div>
                  </div>
                </Card>

                {error && (<div className="rounded-lg bg-red-50/90 px-3 py-2 text-sm text-red-700 shadow-sm">{error}</div>)}

                {/* Records count indicator */}
                {(filterSubject !== "all" || filterGrade !== "all") && filteredTotal > 0 && (
                  <div className="rounded-lg bg-primary/5 border border-primary/20 px-4 py-2 text-sm">
                    <span className="font-medium text-primary">
                      {isArabic 
                        ? `عرض ${records.length} من ${filteredTotal} جلسة`
                        : `Showing ${records.length} of ${filteredTotal} sessions`
                      }
                    </span>
                    {filterSubject !== "all" || filterGrade !== "all" ? (
                      <span className="text-muted-foreground ml-2">
                        {isArabic ? "• مع الفلاتر المطبقة" : "• with filters applied"}
                      </span>
                    ) : null}
                  </div>
                )}

                <div className="space-y-4 animate-in fade-in-0 slide-in-from-bottom-2 duration-300">
                  {loading && currentPage === 0 && records.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                      <Loader2 className="h-8 w-8 animate-spin mb-3" />
                      <p className="text-sm">{isArabic ? "جاري تحميل السجلات..." : "Loading records..."}</p>
                    </div>
                  ) : records.length === 0 && !loading ? (
                    <div className="rounded-xl bg-muted/30 px-6 py-12 text-center text-sm text-muted-foreground shadow-inner">
                      {filteredTotal === 0 && (filterSubject !== "all" || filterGrade !== "all")
                        ? (isArabic ? "لا توجد جلسات تطابق الفلاتر المحددة." : "No sessions match the selected filters.")
                        : (isArabic ? "لم يتم تسجيل أي جلسات دراسية حتى الآن. ابدأ بتسجيل جلستك الدراسية القادمة." : "No study sessions logged yet. Start by recording your next study block.")
                      }
                    </div>
                  ) : (
                    <>
                      <div className="space-y-3">
                        {records.map((record: StudyRecord, index: number) => {
                        const subjectMeta = globalSubjectLookup.get(record.subject);
                        const displaySubjectName = subjectMeta ? (isArabic ? subjectMeta.nameAr : subjectMeta.nameEn) : record.subject;
                        const isRemoving = removingIds.has(record.id);
                        const isRecentlyAdded = recentlyAddedIds.has(record.id);
                        // Stagger animation delay based on index (max 10 items for performance)
                        const animationDelay = index < 10 ? `${index * 50}ms` : '0ms';
                        return (
                          <div 
                            key={record.id} 
                            className={cn(
                              "relative rounded-xl bg-card/70 p-4 shadow-sm ring-1 ring-border/20 transition-all duration-300",
                              "animate-in fade-in-0 slide-in-from-bottom-2",
                              isRemoving && "animate-out fade-out-0 slide-out-to-right-2",
                              isRemoving && "pointer-events-none opacity-60"
                            )}
                            style={{ 
                              animationDelay,
                              animationFillMode: 'backwards'
                            }}
                          >
                            <div className="flex flex-wrap items-start justify-between gap-3">
                              <div className="space-y-1">
                                <h2 className="text-base font-semibold text-foreground capitalize" style={containsArabic(displaySubjectName) ? { fontFamily: 'var(--font-arabic-sans)', fontSize: '0.95rem' } : undefined}>
                                  {displaySubjectName}
                                </h2>
                                <p className="text-xs text-muted-foreground">
                                  {dateTimeFormatter.format(new Date(record.startedAt))} — {dateTimeFormatter.format(new Date(record.endedAt))}
                                </p>
                                <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground/70">{formatDuration(record.timeSpentMinutes)} studied</p>
                              </div>
                              <Button type="button" variant="ghost" size="sm" onClick={() => handleDelete(record.id)} disabled={isRemoving} className="inline-flex items-center gap-1 text-red-600 disabled:opacity-80 hover:bg-red-100 hover:text-red-500">
                                {isRemoving ? (<Loader2 className="h-4 w-4 animate-spin text-red-600" />) : (<Trash2 className="h-4 w-4" />)}
                                {isRemoving ? "Removing" : "Remove"}
                              </Button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    
                    {/* Load More Button */}
                    {hasMore && (
                      <div className="flex justify-center pt-4">
                        <Button
                          onClick={() => fetchRecords(currentPage + 1, false)}
                          disabled={loading}
                          variant="outline"
                          className="min-w-[200px] border-primary/30 hover:bg-primary/10"
                        >
                          {loading ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              {isArabic ? "جاري التحميل..." : "Loading..."}
                            </>
                          ) : (
                            <>
                              {isArabic ? "تحميل المزيد" : "Load More"}
                              <svg className="ml-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                              </svg>
                            </>
                          )}
                        </Button>
                      </div>
                    )}
                  </>
                  )}
                </div>
              </div>
            </div>
        </main>
      </div>
    </PageWithSidebar>
  );
}


