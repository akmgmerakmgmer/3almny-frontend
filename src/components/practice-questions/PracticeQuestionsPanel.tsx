"use client";

import React from "react";
import {
  getPracticeQuestions,
  submitPracticeQuestion,
  updatePracticeQuestion,
  streamPracticeQuestions,
  PracticeQuestion,
  SubmitPracticeQuestionPayload,
  SubmitPracticeQuestionResult,
} from "@/services/practiceQuestions";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PracticeQuestionCard } from "./PracticeQuestionCard";

interface PracticeQuestionsPanelProps {
  chatId: string;
  messageId: string;
}

type SubmitMap = Record<string, boolean>;
type ResultMap = Record<string, SubmitPracticeQuestionResult>;

const QUESTION_COUNT_OPTIONS = [5, 10, 15, 20];

enum DifficultyLabel {
  easy = "Easy",
  medium = "Medium",
  hard = "Hard",
  mixed = "Mixed",
}

type PracticeDifficultyFilter = "mixed" | "easy" | "medium" | "hard";
type LanguageOption = "auto" | "en" | "ar";

export function PracticeQuestionsPanel({ chatId, messageId }: PracticeQuestionsPanelProps) {
  const [appliedDifficulty, setAppliedDifficulty] = React.useState<PracticeDifficultyFilter>("mixed");
  const [uiDifficulty, setUiDifficulty] = React.useState<PracticeDifficultyFilter>("mixed");
  const [appliedCount, setAppliedCount] = React.useState<number>(QUESTION_COUNT_OPTIONS[0]);
  const [uiCount, setUiCount] = React.useState<number>(QUESTION_COUNT_OPTIONS[0]);
  const [appliedLanguage, setAppliedLanguage] = React.useState<LanguageOption>("auto");
  const [uiLanguage, setUiLanguage] = React.useState<LanguageOption>("auto");
  const [loading, setLoading] = React.useState(true);
  const [generating, setGenerating] = React.useState(false);
  const [streamProgress, setStreamProgress] = React.useState<{ total: number | null; received: number }>({
    total: null,
    received: 0,
  });
  const [questions, setQuestions] = React.useState<PracticeQuestion[]>([]);
  const [submitMap, setSubmitMap] = React.useState<SubmitMap>({});
  const [results, setResults] = React.useState<ResultMap>({});
  const [error, setError] = React.useState<string | null>(null);
  const streamCleanupRef = React.useRef<(() => void) | null>(null);

  const isSupportedQuestion = React.useCallback(
    (question: PracticeQuestion) => question.type === "multiple-choice" || question.type === "true-false",
    [],
  );

  const activeQuestions = React.useMemo(() => questions.filter((q) => !q.archived), [questions]);

  const aggregateStats = React.useMemo(() => {
    const total = activeQuestions.length;
    let answered = 0;
    let correct = 0;

    activeQuestions.forEach((question) => {
      const result = results[question.id];
      const attempts = result?.stats.attempts ?? question.stats.attempts;
      const correctAttempts = result?.stats.correctAttempts ?? question.stats.correctAttempts;
      if (attempts > 0) {
        answered += 1;
        if (correctAttempts > 0) {
          correct += 1;
        }
      }
    });

    const accuracy = answered > 0 ? Math.round((correct / answered) * 100) : null;

    return {
      total,
      answered,
      correct,
      accuracy,
    };
  }, [activeQuestions, results]);

  const encouragement = React.useMemo(() => {
    if (aggregateStats.answered === 0) return "Answer a question to start tracking your score.";
    const acc = aggregateStats.accuracy ?? 0;
    if (acc >= 80) return "Excellent progress! You're on a roll.";
    if (acc >= 50) return "Nice work—keep the momentum going.";
    return "Keep practicing and you'll master this in no time.";
  }, [aggregateStats.answered, aggregateStats.accuracy]);

  const loadQuestions = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const existing = await getPracticeQuestions(chatId, messageId, false);
  const filtered = existing.filter(isSupportedQuestion);
  const difficultyFiltered = appliedDifficulty === "mixed" ? filtered : filtered.filter((q) => q.difficulty === appliedDifficulty);
  const limited = difficultyFiltered.slice(0, appliedCount);
      setQuestions(limited);
      const hydrated: ResultMap = {};
      limited.forEach((q) => {
        if (q.stats.attempts > 0) {
          hydrated[q.id] = {
            correct: null,
            evaluationAvailable: false,
            stats: q.stats,
          } as SubmitPracticeQuestionResult;
        }
      });
      setResults(hydrated);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }, [chatId, messageId, appliedDifficulty, appliedCount, isSupportedQuestion]);

  React.useEffect(() => {
    void loadQuestions();
  }, [loadQuestions]);

  React.useEffect(() => () => streamCleanupRef.current?.(), []);

  const handleGenerate = React.useCallback(() => {
    if (generating) return;
    streamCleanupRef.current?.();
    setError(null);
    setGenerating(true);
  setStreamProgress({ total: null, received: 0 });
  setQuestions([]);
  setResults({});
  setSubmitMap({});

  const nextDifficulty = uiDifficulty;
  const nextCount = uiCount;
  const nextLanguage = uiLanguage;

  setAppliedDifficulty(nextDifficulty);
  setAppliedCount(nextCount);
  setAppliedLanguage(nextLanguage);

  const maxCount = nextCount;

    const stopStreaming = () => {
      const cleanupFn = streamCleanupRef.current;
      if (cleanupFn) {
        cleanupFn();
        streamCleanupRef.current = null;
      }
      setGenerating(false);
      setStreamProgress({
        total: maxCount,
        received: maxCount,
      });
      void loadQuestions();
    };

    const cleanup = streamPracticeQuestions(
      chatId,
      messageId,
      { difficulty: nextDifficulty, count: nextCount, language: nextLanguage },
      {
        onQuestion: ({ question, index, total }: { question: PracticeQuestion; index: number; total: number }) => {
          setStreamProgress({ total, received: Math.min(index + 1, maxCount) });
          if (!isSupportedQuestion(question)) return;
          if (nextDifficulty !== "mixed" && question.difficulty !== nextDifficulty) return;

          let reachedLimit = false;
          setQuestions((prev) => {
            if (prev.length >= maxCount) {
              reachedLimit = true;
              return prev;
            }
            const next = [...prev, question];
            if (next.length >= maxCount) {
              reachedLimit = true;
            }
            return next;
          });

          if (reachedLimit) {
            stopStreaming();
          }
        },
        onDone: ({ total }: { total: number | null }) => {
          setStreamProgress((prev) => ({ total: total ?? prev.total, received: prev.received }));
          const cleanupFn = streamCleanupRef.current;
          if (cleanupFn) {
            cleanupFn();
            streamCleanupRef.current = null;
            setGenerating(false);
            void loadQuestions();
          } else {
            setGenerating(false);
          }
        },
        onError: (message: string) => {
          setError(message);
          setGenerating(false);
          setStreamProgress({ total: null, received: 0 });
          streamCleanupRef.current?.();
          streamCleanupRef.current = null;
        },
      },
    );

    streamCleanupRef.current = cleanup;
  }, [chatId, messageId, uiDifficulty, uiCount, uiLanguage, generating, loadQuestions, isSupportedQuestion]);

  const handleSubmit = async (
    questionId: string,
    payload: SubmitPracticeQuestionPayload,
  ) => {
    setSubmitMap((prev) => ({ ...prev, [questionId]: true }));
    try {
      const result = await submitPracticeQuestion(questionId, payload);
      setResults((prev) => ({ ...prev, [questionId]: result }));
      setQuestions((prev) =>
        prev.map((q) =>
          q.id === questionId
            ? {
                ...q,
                stats: result.stats,
              }
            : q,
        ),
      );
      return result;
    } finally {
      setSubmitMap((prev) => {
        const next = { ...prev };
        delete next[questionId];
        return next;
      });
    }
  };

  const handleArchive = async (questionId: string, archived: boolean) => {
    const updated = await updatePracticeQuestion(questionId, { archived });
    setQuestions((prev) => prev.map((q) => (q.id === questionId ? { ...q, archived: updated.archived } : q)));
  };

  return (
    <div className="space-y-5 rounded-2xl border border-border/30 bg-gradient-to-br from-white via-slate-50 to-slate-100 p-5 shadow-lg transition dark:from-slate-900 dark:via-slate-900/40 dark:to-slate-950">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="grid w-full max-w-3xl gap-4 sm:grid-cols-3">
          <div className="flex flex-col gap-1">
            <span className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-300">
              Difficulty
            </span>
            <Select value={uiDifficulty} onValueChange={(val) => setUiDifficulty(val as PracticeDifficultyFilter)}>
              <SelectTrigger className="h-10 rounded-xl border border-border/40 bg-white/70 text-sm shadow-sm transition hover:border-primary/50 focus:ring-2 focus:ring-primary/30 dark:border-slate-700 dark:bg-slate-900/60">
                <SelectValue placeholder="Select difficulty" />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(DifficultyLabel).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-1">
            <span className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-300">
              Number of questions
            </span>
            <Select value={String(uiCount)} onValueChange={(val) => setUiCount(Number(val))}>
              <SelectTrigger className="h-10 rounded-xl border border-border/40 bg-white/70 text-sm shadow-sm transition hover:border-primary/50 focus:ring-2 focus:ring-primary/30 dark:border-slate-700 dark:bg-slate-900/60">
                <SelectValue placeholder="Choose amount" />
              </SelectTrigger>
              <SelectContent>
                {QUESTION_COUNT_OPTIONS.map((option) => (
                  <SelectItem key={option} value={String(option)}>
                    {option} questions
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-1">
            <span className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-300">
              Language
            </span>
            <Select value={uiLanguage} onValueChange={(val) => setUiLanguage(val as LanguageOption)}>
              <SelectTrigger className="h-10 rounded-xl border border-border/40 bg-white/70 text-sm shadow-sm transition hover:border-primary/50 focus:ring-2 focus:ring-primary/30 dark:border-slate-700 dark:bg-slate-900/60">
                <SelectValue placeholder="Language" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="auto">Auto</SelectItem>
                <SelectItem value="en">English</SelectItem>
                <SelectItem value="ar">Arabic</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <Button
          type="button"
          onClick={handleGenerate}
          disabled={generating}
          className="h-11 rounded-xl bg-primary px-6 text-sm font-semibold tracking-wide text-primary-foreground shadow-md transition hover:bg-primary/90 disabled:opacity-60"
        >
          {generating ? "Generating questions…" : "Generate questions"}
        </Button>
      </div>

      {error && (
        <div className="rounded-xl border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </div>
      )}

      {generating && (
        <div className="flex items-center justify-between rounded-xl border border-dashed border-primary/30 bg-primary/5 px-4 py-3 text-sm text-primary/80">
          <span>
            {streamProgress.total
              ? `Streaming questions ${streamProgress.received}/${streamProgress.total}`
              : "Assembling personalised questions"}
          </span>
          <span className="flex items-center gap-2 text-xs text-primary/60">
            <span className="inline-flex h-2 w-2 animate-ping rounded-full bg-primary" />
            Live
          </span>
        </div>
      )}

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 2 }).map((_, idx) => (
            <div key={idx} className="h-28 animate-pulse rounded-xl bg-muted/40" />
          ))}
        </div>
      ) : questions.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No practice questions yet. Generate a set to start quizzing.
        </p>
      ) : (
        <div className="space-y-4">
          {activeQuestions
            .map((question) => (
              <PracticeQuestionCard
                key={question.id}
                question={question}
                submitting={submitMap[question.id]}
                result={results[question.id]}
                onSubmit={handleSubmit}
                onArchive={handleArchive}
              />
            ))}

          {activeQuestions.length > 0 && (
            <div className="relative overflow-hidden rounded-2xl border border-primary/20 bg-gradient-to-r from-primary/5 via-primary/10 to-primary/5 px-5 py-4 shadow-sm">
              <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
                <div className="h-full w-full bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.4),transparent_65%)]" />
              </div>
              <div className="relative flex flex-col gap-4 text-sm text-muted-foreground">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-primary/80">Scoreboard</p>
                    <p className="text-2xl font-semibold text-foreground">
                      {aggregateStats.correct}
                      <span className="text-base font-normal text-muted-foreground"> / {aggregateStats.total}</span>
                    </p>
                  </div>
                  <div className="flex flex-col items-start gap-1 sm:items-end">
                    <span className="text-xs font-semibold uppercase tracking-wide text-primary/80">Accuracy</span>
                    <span className="text-lg font-semibold text-foreground">
                      {aggregateStats.accuracy != null ? `${aggregateStats.accuracy}%` : "—"}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      Answered {aggregateStats.answered}/{aggregateStats.total}
                    </span>
                  </div>
                </div>
                <div className="relative h-2 w-full overflow-hidden rounded-full bg-primary/15">
                  <div
                    className="absolute left-0 top-0 h-full rounded-full bg-primary/80 transition-all duration-500"
                    style={{ width: `${aggregateStats.accuracy != null ? Math.min(aggregateStats.accuracy, 100) : 0}%` }}
                  />
                </div>
                <p className="text-xs text-muted-foreground">{encouragement}</p>
              </div>
            </div>
          )}

          {questions.some((q) => q.archived) && (
            <details className="rounded-xl border border-dashed border-border/40 bg-background/70 px-3 py-2 text-sm text-muted-foreground">
              <summary className="cursor-pointer font-medium">Archived questions</summary>
              <div className="mt-3 space-y-4">
                {questions
                  .filter((q) => q.archived)
                  .map((question) => (
                    <PracticeQuestionCard
                      key={question.id}
                      question={question}
                      submitting={submitMap[question.id]}
                      result={results[question.id]}
                      onSubmit={handleSubmit}
                      onArchive={handleArchive}
                    />
                  ))}
              </div>
            </details>
          )}
        </div>
      )}
    </div>
  );
}
