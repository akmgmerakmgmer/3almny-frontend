"use client";

import React from "react";
import { PracticeQuestion, SubmitPracticeQuestionPayload, SubmitPracticeQuestionResult } from "@/services/practiceQuestions";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const difficultyStyles: Record<PracticeQuestion["difficulty"], string> = {
  easy: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-200",
  medium: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-200",
  hard: "bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-200",
};

type Props = {
  question: PracticeQuestion;
  submitting?: boolean;
  result?: SubmitPracticeQuestionResult | null;
  onSubmit: (questionId: string, payload: SubmitPracticeQuestionPayload) => Promise<SubmitPracticeQuestionResult>;
  onArchive?: (questionId: string, archived: boolean) => Promise<void>;
};

export function PracticeQuestionCard({ question, submitting, result, onSubmit, onArchive }: Props) {
  const [selectedOption, setSelectedOption] = React.useState<number | null>(null);
  const [localResult, setLocalResult] = React.useState<SubmitPracticeQuestionResult | null>(result ?? null);
  const [error, setError] = React.useState<string | null>(null);
  const [archiving, setArchiving] = React.useState(false);
  const [busy, setBusy] = React.useState(false);
  const [showCardAnimation, setShowCardAnimation] = React.useState(false);
  const [showResultAnimation, setShowResultAnimation] = React.useState(false);

  React.useEffect(() => {
    setLocalResult(result ?? null);
  }, [result]);

  React.useEffect(() => {
    setSelectedOption(null);
  }, [question.id]);

  React.useEffect(() => {
    const timer = setTimeout(() => setShowCardAnimation(true), 10);
    return () => clearTimeout(timer);
  }, []);

  React.useEffect(() => {
    if (localResult) {
      // Trigger animation when result appears
      setShowResultAnimation(false);
      const timer = setTimeout(() => setShowResultAnimation(true), 10);
      return () => clearTimeout(timer);
    }
  }, [localResult]);

  const containsArabic = React.useCallback((value: string | undefined | null) => /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF]/.test(value ?? ""), []);

  const questionUsesArabicFont = question.language === "ar" || containsArabic(question.question);
  const actionButtonFontStyle = question.language === "ar" ? { fontFamily: 'var(--font-arabic-sans)' } : undefined;

  const isMultipleChoice = question.type === "multiple-choice";
  const isTrueFalse = question.type === "true-false";
  const supportsInteraction = isMultipleChoice || isTrueFalse;
  const localSubmitting = submitting || busy;
  const attempts = localResult?.stats?.attempts ?? question.stats.attempts;
  const hasAnswered = attempts > 0;

  const handleSubmit = async () => {
    if (hasAnswered) {
      setError(question.language === "ar" ? "لقد أجبت على هذا السؤال بالفعل." : "You already submitted an answer for this question.");
      return;
    }
    setError(null);
    const payload: SubmitPracticeQuestionPayload = {};
    if (!supportsInteraction) {
      setError(question.language === "ar" ? "هذا النوع من الأسئلة لم يعد مدعوماً." : "This question type is no longer supported.");
      return;
    }

    if (isMultipleChoice) {
      if (selectedOption == null) {
        setError(question.language === "ar" ? "اختر إجابة أولاً." : "Please select an answer.");
        return;
      }
      payload.selectedOptionIndex = selectedOption;
    } else if (isTrueFalse) {
      if (selectedOption == null) {
        setError(question.language === "ar" ? "اختر صواب أو خطأ أولاً." : "Please choose True or False first.");
        return;
      }
      payload.answer = selectedOption === 0 ? "true" : "false";
    }
    try {
      setBusy(true);
      const res = await onSubmit(question.id, payload);
      setLocalResult(res);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  };

  const handleArchive = async () => {
    if (!onArchive) return;
    try {
      setArchiving(true);
      await onArchive(question.id, !question.archived);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setArchiving(false);
    }
  };

  return (
    <div
      className={cn(
        "rounded-lg border border-border/60 bg-background/20 shadow-sm px-4 py-5 space-y-4 transition-all duration-500 transform",
        showCardAnimation ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
      )}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span
              className={cn("text-xs font-semibold uppercase tracking-wide px-2 py-1 rounded-full", difficultyStyles[question.difficulty])}
              style={question.language === "ar" ? { fontFamily: 'var(--font-arabic-sans)', fontSize: '0.7rem' } : { fontSize: '0.7rem' }}
            >
              {question.language === "ar"
                ? question.difficulty === "easy"
                  ? "سهل"
                  : question.difficulty === "medium"
                  ? "متوسط"
                  : "صعب"
                : question.difficulty}
            </span>
            {!question.autoGraded && (
              <span
                className="text-xs text-muted-foreground"
                style={question.language === "ar" ? { fontFamily: 'var(--font-arabic-sans)', fontSize: '0.7rem' } : { fontSize: '0.7rem' }}
              >
                {question.language === "ar"
                  ? "التصحيح الآلي غير متاح"
                  : "Auto-grading unavailable"}
              </span>
            )}
          </div>
          <p
            className="text-base font-medium leading-6 whitespace-pre-wrap"
            style={questionUsesArabicFont ? { fontFamily: 'var(--font-arabic-sans)', fontSize: '0.95rem' } : { fontSize: '0.95rem' }}
          >
            {question.question}
          </p>
        </div>
      </div>

      {isMultipleChoice && (
        <div className="grid gap-2">
          {(question.options || []).map((opt, idx) => {
            const active = selectedOption === idx;
            const correctOption = localResult?.correctOption;
            const isCorrectOption = correctOption === idx;
            const markState = localResult?.correct === false && isCorrectOption;
            const optionUsesArabicFont = question.language === "ar" || containsArabic(opt.value);
            return (
              <button
                key={idx}
                type="button"
                onClick={() => {
                  if (hasAnswered) return;
                  setSelectedOption(idx);
                }}
                className={cn(
                  "w-full rounded-md border px-3 py-2 text-left transition-colors",
                  active ? "border-primary bg-primary/10" : "border-border/70 hover:bg-muted/60",
                  localResult?.correct === true && active && "border-emerald-500",
                  markState && "border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20",
                )}
                disabled={hasAnswered}
                style={question.language === "ar" ? { fontFamily: 'var(--font-arabic-sans)' } : undefined}
              >
                <span
                  className="mr-2 font-semibold text-sm text-muted-foreground"
                  style={question.language === "ar" ? { fontFamily: 'var(--font-arabic-sans)', fontSize: '0.8rem' } : { fontSize: '0.8rem' }}
                >
                  {opt.label}
                </span>
                <span
                  className="text-sm leading-relaxed"
                  style={optionUsesArabicFont ? { fontFamily: 'var(--font-arabic-sans)', fontSize: '0.8rem' } : { fontSize: '0.8rem' }}
                >
                  {opt.value}
                </span>
              </button>
            );
          })}
        </div>
      )}

      {isTrueFalse && (
        <div className="flex gap-3">
          {[question.language === "ar" ? "صحيح" : "True", question.language === "ar" ? "خطأ" : "False"].map((label, idx) => {
            const active = selectedOption === idx;
            const isCorrectOption = localResult?.acceptableAnswers?.includes(idx === 0 ? "true" : "false");
            return (
              <button
                key={label}
                type="button"
                onClick={() => {
                  if (hasAnswered) return;
                  setSelectedOption(idx);
                }}
                className={cn(
                  "flex-1 rounded-md border px-3 py-2 text-sm",
                  active ? "border-primary bg-primary/10" : "border-border/70 hover:bg-muted/60",
                  localResult?.correct === true && active && "border-emerald-500",
                  localResult?.correct === false && isCorrectOption && "border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20",
                )}
                disabled={hasAnswered}
                style={question.language === "ar" ? { fontFamily: 'var(--font-arabic-sans)' } : undefined}
              >
                <span
                  style={question.language === "ar" ? { fontFamily: 'var(--font-arabic-sans)', fontSize: '0.8rem' } : { fontSize: '0.8rem' }}
                >
                  {label}
                </span>
              </button>
            );
          })}
        </div>
      )}

      {!supportsInteraction && (
        <p
          className="text-sm text-muted-foreground"
          style={question.language === "ar" ? { fontFamily: 'var(--font-arabic-sans)', fontSize: '0.85rem' } : { fontSize: '0.85rem' }}
        >
          {question.language === "ar"
            ? "نوع السؤال هذا غير مدعوم حالياً. يمكنك أرشفته أو إنشاء أسئلة جديدة."
            : "This question type is no longer supported. Archive it or generate new questions instead."}
        </p>
      )}


      {error && (
        <p className="text-sm text-destructive" style={question.language === "ar" ? { fontFamily: 'var(--font-arabic-sans)', fontSize: '0.8rem' } : { fontSize: '0.8rem' }}>
          {error}
        </p>
      )}

      {localResult && localResult.evaluationAvailable && (
        <div
          className={cn(
            "rounded-md border px-3 py-2 text-sm transition-all duration-500",
            "transform",
            showResultAnimation ? "opacity-100 scale-100 translate-y-0" : "opacity-0 scale-95 translate-y-2",
            localResult.correct
              ? "border-emerald-500 bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-200"
              : "border-rose-500 bg-rose-50 text-rose-700 dark:bg-rose-900/30 dark:text-rose-200",
          )}
          style={question.language === "ar" ? { fontFamily: 'var(--font-arabic-sans)' } : undefined}
        >
          <p className="font-semibold">
            {localResult.correct
              ? question.language === "ar" ? "إجابة صحيحة!" : "Correct!"
              : question.language === "ar" ? "إجابة غير صحيحة" : "Not quite right"}
          </p>
          {localResult.explanation && (
            <p
              className="mt-1 whitespace-pre-wrap text-xs leading-6 text-muted-foreground"
              style={containsArabic(localResult.explanation) || question.language === "ar" ? { fontFamily: 'var(--font-arabic-sans)' } : undefined}
            >
              {localResult.explanation}
            </p>
          )}
          {localResult.correct === false && localResult.acceptableAnswers && localResult.acceptableAnswers.length > 0 && (
            <p className="mt-1 text-xs" style={question.language === "ar" ? { fontFamily: 'var(--font-arabic-sans)' } : undefined}>
              <span className="font-semibold">
                {question.language === "ar" ? "الإجابات المقبولة:" : "Accepted answers:"}
              </span>{" "}
              {localResult.acceptableAnswers.join(
                question.language === "ar" ? "، " : ", ",
              )}
            </p>
          )}
        </div>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <Button
          type="button"
          size="sm"
          onClick={handleSubmit}
          disabled={localSubmitting || !supportsInteraction || hasAnswered}
          style={actionButtonFontStyle}
        >
          {localSubmitting
            ? question.language === "ar" ? "جارٍ التقييم..." : "Checking..."
            : question.language === "ar" ? "تحقق من الإجابة" : "Check answer"}
        </Button>
      </div>
    </div>
  );
}
