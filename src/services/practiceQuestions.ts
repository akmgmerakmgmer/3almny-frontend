import { http } from './http';

export type PracticeDifficulty = 'easy' | 'medium' | 'hard';
export type PracticeQuestionType = 'multiple-choice' | 'true-false';

export interface PracticeQuestionOption {
  label: string;
  value: string;
}

export interface PracticeQuestionStats {
  attempts: number;
  correctAttempts: number;
  accuracy: number | null;
}

export interface PracticeQuestion {
  id: string;
  chatId: string;
  messageId: string;
  question: string;
  type: PracticeQuestionType;
  difficulty: PracticeDifficulty;
  options?: PracticeQuestionOption[];
  explanation?: string;
  language: 'en' | 'ar';
  autoGraded: boolean;
  archived: boolean;
  stats: PracticeQuestionStats;
  createdAt: string;
  updatedAt: string;
  sourceSummary?: string | null;
  sourceTitle?: string | null;
}

export interface GeneratePracticeQuestionsPayload {
  difficulty?: 'easy' | 'medium' | 'hard' | 'mixed';
  count?: number;
  language?: 'auto' | 'en' | 'ar';
  focus?: string;
}

interface PracticeQuestionStreamHandlers {
  onQuestion?: (payload: { question: PracticeQuestion; index: number; total: number }) => void;
  onDone?: (payload: { total: number | null }) => void;
  onError?: (message: string) => void;
}

interface StreamOptions {
  difficulty?: GeneratePracticeQuestionsPayload['difficulty'];
  count?: number;
  language?: GeneratePracticeQuestionsPayload['language'];
}

export interface SubmitPracticeQuestionPayload {
  answer?: string;
  selectedOptionIndex?: number;
  revealExplanation?: boolean;
}

export interface SubmitPracticeQuestionResult {
  correct: boolean | null;
  evaluationAvailable: boolean;
  explanation?: string;
  correctOption?: number;
  acceptableAnswers?: string[];
  stats: PracticeQuestionStats;
}

export interface PracticeStatisticsRow {
  difficulty: PracticeDifficulty;
  total: number;
  archived: number;
  attempts: number;
  correctAttempts: number;
  accuracy: number | null;
}

export async function generatePracticeQuestions(
  chatId: string,
  messageId: string,
  payload: GeneratePracticeQuestionsPayload,
): Promise<PracticeQuestion[]> {
  return http<PracticeQuestion[]>(`/chats/${encodeURIComponent(chatId)}/messages/${encodeURIComponent(messageId)}/practice-questions`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function getPracticeQuestions(
  chatId: string,
  messageId: string,
  includeArchived = false,
): Promise<PracticeQuestion[]> {
  const qs = includeArchived ? '?includeArchived=true' : '';
  return http<PracticeQuestion[]>(`/chats/${encodeURIComponent(chatId)}/messages/${encodeURIComponent(messageId)}/practice-questions${qs}`);
}

export async function submitPracticeQuestion(
  questionId: string,
  payload: SubmitPracticeQuestionPayload,
): Promise<SubmitPracticeQuestionResult> {
  return http<SubmitPracticeQuestionResult>(`/chats/questions/${encodeURIComponent(questionId)}/submit`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function updatePracticeQuestion(
  questionId: string,
  payload: { archived?: boolean },
): Promise<PracticeQuestion> {
  return http<PracticeQuestion>(`/chats/questions/${encodeURIComponent(questionId)}/archive`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
}

export async function getPracticeStatistics(): Promise<PracticeStatisticsRow[]> {
  return http<PracticeStatisticsRow[]>(`/chats/practice/statistics`);
}

type PracticeQuestionStreamMessage =
  | { type: 'question'; question: PracticeQuestion; index: number; total: number }
  | { type: 'done'; total: number | null }
  | { type: 'error'; message: string };

export function streamPracticeQuestions(
  chatId: string,
  messageId: string,
  options: StreamOptions,
  handlers: PracticeQuestionStreamHandlers,
): () => void {
  if (typeof window === 'undefined') {
    throw new Error('streamPracticeQuestions is only available in the browser');
  }
  const base = (process.env.NEXT_PUBLIC_API_BASE || '').replace(/\/$/, '');
  if (!base) {
    handlers.onError?.('Missing NEXT_PUBLIC_API_BASE');
    return () => undefined;
  }

  const params = new URLSearchParams();
  if (options.difficulty) params.set('difficulty', options.difficulty);
  if (options.count) params.set('count', String(options.count));
  if (options.language) params.set('language', options.language);

  const query = params.toString();
  const url = `${base}/chats/${encodeURIComponent(chatId)}/messages/${encodeURIComponent(messageId)}/practice-questions/stream${query ? `?${query}` : ''}`;
  const eventSource = new EventSource(url, { withCredentials: true });

  const cleanup = () => {
    eventSource.close();
  };

  eventSource.onmessage = (event: MessageEvent<string>) => {
    try {
      const payload = JSON.parse(event.data) as PracticeQuestionStreamMessage;
      if (payload.type === 'question') {
        handlers.onQuestion?.({ question: payload.question, index: payload.index, total: payload.total });
      } else if (payload.type === 'done') {
        handlers.onDone?.({ total: payload.total ?? null });
        cleanup();
      } else if (payload.type === 'error') {
        handlers.onError?.(payload.message || 'Failed to generate practice questions');
        cleanup();
      }
    } catch (err) {
      handlers.onError?.(err instanceof Error ? err.message : 'Malformed stream payload');
      cleanup();
    }
  };

  eventSource.onerror = () => {
    handlers.onError?.('Connection lost while streaming questions');
    cleanup();
  };

  return cleanup;
}
