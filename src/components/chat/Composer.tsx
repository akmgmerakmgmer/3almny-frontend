import React, { useRef, useEffect, useCallback, useState, useId } from "react"
import { Button } from "@/components/ui/button"
import { useT } from '@/i18n/useT';
import { cn } from '@/lib/utils';
import { Loader2, Send, Square, ChevronDown } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { educationSystems } from './EducationSystemSelector';
import { gradesBySystem } from './GradeSelector';
import { getSubjects } from './SubjectSelector';

type Props = {
  input: string
  loading: boolean
  streaming?: boolean
  setInput: (v: string) => void
  onKeyDown: (e: React.KeyboardEvent<HTMLElement>) => void
  onSend: () => void
  disabled?: boolean
  onStop?: () => void
  selectedEducationSystem?: string | null
  selectedGrade?: string | null
  onEducationSystemChange?: (systemId: string | null) => void
  onGradeChange?: (gradeId: string | null) => void
  selectedSubject?: string | null
  onSubjectChange?: (subjectId: string | null) => void
}
export default function Composer({
  input,
  loading,
  streaming,
  setInput,
  onKeyDown,
  onSend,
  disabled,
  onStop,
  selectedEducationSystem,
  selectedGrade,
  onEducationSystemChange,
  onGradeChange,
  selectedSubject,
  onSubjectChange,
}: Props) {
  const { t, lang } = useT();
  const isArabic = lang === 'ar';
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const selectorsContentId = useId();
  const selectorsInnerRef = useRef<HTMLDivElement | null>(null);
  const [selectorsCollapsed, setSelectorsCollapsed] = useState(false);
  const [selectorsHeight, setSelectorsHeight] = useState<number>(0);

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (!streaming && !loading && input.trim() && !disabled) {
        onSend();
      }
      return;
    }
    onKeyDown?.(e);
  }, [streaming, loading, input, disabled, onSend, onKeyDown]);

  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = Math.min(el.scrollHeight, 220) + 'px';
  }, [input]);

  const availableGrades: Array<any> = selectedEducationSystem
    ? ((gradesBySystem as Record<string, Array<any>>)[selectedEducationSystem] || [])
    : [];
  const availableSubjects: Array<any> = getSubjects((selectedEducationSystem as any) ?? null, selectedGrade);

  const selectedSystemData = selectedEducationSystem
    ? educationSystems.find(s => s.id === selectedEducationSystem) || null
    : null;
  const selectedGradeObj = selectedGrade
    ? availableGrades.find(g => g.id === selectedGrade) || null
    : null;
  const selectedSubjectObj = selectedSubject
    ? availableSubjects.find(s => s.id === selectedSubject) || null
    : null;

  const selectionSummary = [
    selectedSystemData ? (isArabic ? selectedSystemData.nameAr : selectedSystemData.nameEn) : null,
    selectedGradeObj ? (isArabic ? selectedGradeObj.nameAr : selectedGradeObj.nameEn) : null,
    selectedSubjectObj ? (isArabic ? selectedSubjectObj.nameAr : selectedSubjectObj.nameEn) : null,
  ].filter(Boolean).join(' • ');

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const node = selectorsInnerRef.current;
    if (!node) return;
    const measure = () => setSelectorsHeight(node.scrollHeight);
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(node);
    return () => observer.disconnect();
  }, [availableGrades.length, availableSubjects.length, selectedEducationSystem, selectedGrade, selectedSubject]);

  return (
    <div className="sticky bottom-0 bg-gradient-to-t from-background/95 via-background/80 to-background/40 backdrop-blur supports-[backdrop-filter]:bg-background/60 pt-4 px-2">
      {!disabled && onEducationSystemChange && (
        <div className="mx-auto w-full max-w-3xl px-2 mb-4">
          <div className="selector-in rounded-xl border border-border/30 bg-card/80 backdrop-blur-sm p-3 md:p-4 shadow-sm transition-colors">
            <div className="flex items-start gap-3">
              <div className="flex-1 min-w-0">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/80">
                  {t('educationSystem.selector.title')}
                </p>
                <p className="mt-0.5 text-xs text-muted-foreground/70 truncate">
                  {selectionSummary || t('educationSystem.selector.placeholder')}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectorsCollapsed((prev) => !prev)}
                aria-expanded={!selectorsCollapsed}
                aria-controls={selectorsContentId}
                className={cn(
                  "relative inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-border/40",
                  "bg-gradient-to-br from-primary/18 via-primary/10 to-primary/22 text-primary transition-all duration-300",
                  selectorsCollapsed ? "shadow-none" : "shadow-[0_8px_18px_-8px_rgba(59,130,246,0.6)]"
                )}
                aria-label={selectorsCollapsed ? 'Show learning context' : 'Hide learning context'}
              >
                <span
                  className={cn(
                    "absolute inset-0 rounded-full bg-primary/20 blur-md opacity-0 transition-opacity duration-300",
                    selectorsCollapsed ? "opacity-0" : "opacity-100"
                  )}
                />
                <ChevronDown
                  className={cn(
                    "relative h-4 w-4 transition-transform duration-400 ease-out",
                    selectorsCollapsed ? "rotate-0" : "rotate-180"
                  )}
                />
              </button>
            </div>
            <div
              id={selectorsContentId}
              style={{ maxHeight: selectorsCollapsed ? 0 : selectorsHeight || undefined }}
              className="overflow-hidden transition-[max-height] duration-500 ease-in-out"
            >
              <div
                ref={selectorsInnerRef}
                className={cn(
                  "grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 pt-3 pb-1 transition-opacity duration-300",
                  selectorsCollapsed ? "opacity-0 pointer-events-none select-none" : "opacity-100"
                )}
              >
              <div className="flex flex-col">
                <label className="text-[13px] md:text-sm font-semibold text-muted-foreground/90 mb-1 tracking-wide">{t('educationSystem.title')}</label>
                <Select
                  value={selectedEducationSystem || 'none'}
                  onValueChange={(v) => onEducationSystemChange(v === 'none' ? null : v)}
                >
                  <SelectTrigger className="relative z-10 h-10 outline-none rounded-lg border-border/30 bg-card/60 text-[13px] md:text-sm focus-visible:z-20 focus-visible:shadow-[0_0_0_2px_hsl(var(--primary))] focus:ring-0 focus-visible:ring-0 focus:ring-offset-0 focus-visible:ring-offset-0">
                    <SelectValue placeholder={t('educationSystem.selector.placeholder')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">{t('educationSystem.selector.none')}</SelectItem>
                    {educationSystems.map((s) => {
                      const displayName = isArabic ? s.nameAr : s.nameEn;
                      return (
                        <SelectItem key={s.id} value={s.id}>
                          <div className="flex items-center gap-2 py-1 leading-tight">
                            <span className={cn('shrink-0', s.color)}>{s.icon}</span>
                            <div
                              className="flex-1 font-medium text-[13px] md:text-sm text-foreground"
                              style={isArabic ? { fontFamily: 'var(--font-arabic-sans)' } : undefined}
                            >
                              {displayName}
                            </div>
                          </div>
                        </SelectItem>
                      )
                    })}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-col">
                <label className="text-[13px] md:text-sm font-semibold text-muted-foreground/90 mb-1 tracking-wide">{t('grade.title')}</label>
                <Select
                  disabled={!selectedEducationSystem || !onGradeChange}
                  value={selectedGrade || 'none'}
                  onValueChange={(v) => onGradeChange?.(v === 'none' ? null : v)}
                >
                  <SelectTrigger className="relative z-10 h-10 outline-none rounded-lg border-border/30 bg-card/60 disabled:opacity-60 text-[13px] md:text-sm focus-visible:z-20 focus-visible:shadow-[0_0_0_2px_hsl(var(--primary))] focus:ring-0 focus-visible:ring-0 focus:ring-offset-0 focus-visible:ring-offset-0">
                    <SelectValue placeholder={t('grade.selector.placeholder')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">{t('grade.selector.none')}</SelectItem>
                    {availableGrades.map((g) => {
                      const displayName = isArabic ? g.nameAr : g.nameEn;
                      return (
                        <SelectItem key={g.id} value={g.id}>
                          <div className="flex items-center gap-2 py-1 leading-tight">
                            <span className={cn('shrink-0', g.color)}>{g.icon}</span>
                            <div
                              className="flex-1 font-medium text-[13px] md:text-sm text-foreground"
                              style={isArabic ? { fontFamily: 'var(--font-arabic-sans)' } : undefined}
                            >
                              {displayName}
                            </div>
                          </div>
                        </SelectItem>
                      )
                    })}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-col">
                <label className="text-[13px] md:text-sm font-semibold text-muted-foreground/90 mb-1 tracking-wide">{t('subject.title')}</label>
                <Select
                  disabled={!selectedEducationSystem || !selectedGrade || !onSubjectChange}
                  value={selectedSubject || 'none'}
                  onValueChange={(v) => onSubjectChange?.(v === 'none' ? null : v)}
                >
                  <SelectTrigger className="relative z-10 h-10 outline-none rounded-lg border-border/30 bg-card/60 disabled:opacity-60 text-[13px] md:text-sm focus-visible:z-20 focus-visible:shadow-[0_0_0_2px_hsl(var(--primary))] focus:ring-0 focus-visible:ring-0 focus:ring-offset-0 focus-visible:ring-offset-0">
                    <SelectValue placeholder={t('subject.selector.placeholder')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">{t('subject.selector.none')}</SelectItem>
                    {availableSubjects.map((s) => {
                      const displayName = isArabic ? s.nameAr : s.nameEn;
                      return (
                        <SelectItem key={s.id} value={s.id}>
                          <div className="flex items-center gap-2 py-1 leading-tight">
                            <span className={cn('shrink-0', s.color)}>{s.icon}</span>
                            <div
                              className="flex-1 font-medium text-[13px] md:text-sm text-foreground"
                              style={isArabic ? { fontFamily: 'var(--font-arabic-sans)' } : undefined}
                            >
                              {displayName}
                            </div>
                          </div>
                        </SelectItem>
                      )
                    })}
                  </SelectContent>
                </Select>
              </div>
            </div>
            </div>
          </div>
        </div>
      )}

      <div className="mx-auto w-full max-w-3xl">
        <div className="relative group">
          <div className={cn(
            'rounded-2xl ring-0 border shadow-sm bg-background/95 transition-all duration-300',
            'focus-within:shadow-md',
            disabled && 'opacity-70'
          )}>
            <div className="flex items-end gap-2 p-3">
              <div className="flex-1 min-w-0">
                <textarea
                  ref={textareaRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  disabled={loading || disabled}
                  placeholder={t('chat.composer.placeholder') + ' ✨'}
                  rows={1}
                  className={cn(
                    'block w-full resize-none bg-transparent border-0 px-1 py-1 text-sm leading-relaxed outline-none placeholder:text-muted-foreground/70',
                    'max-h-[220px] overflow-y-auto'
                  )}
                />
              </div>
              <div className="flex items-center gap-2 pb-1">
                {streaming ? (
                  <Button
                    type="button"
                    onClick={onStop}
                    variant="outline"
                    disabled={disabled}
                    className="h-9 gap-1 px-3 rounded-full border-red-300/40 text-red-600 hover:text-red-700 hover:bg-red-50 dark:border-red-400/30 dark:text-red-300 dark:hover:bg-red-400/10"
                  >
                    <Square className="h-4 w-4" />
                    <span className="hidden sm:inline">Stop</span>
                  </Button>
                ) : (
                  <Button
                    type="button"
                    onClick={onSend}
                    disabled={loading || !input.trim() || disabled}
                    className={cn(
                      'relative inline-flex h-9 items-center gap-1 rounded-full px-4 text-sm font-medium transition disabled:opacity-50 disabled:cursor-not-allowed',
                      'bg-gradient-to-r from-primary via-primary/90 to-primary hover:from-primary/90 hover:to-primary shadow-sm hover:shadow-md active:scale-95'
                    )}
                  >
                    {loading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Send className="h-4 w-4" />
                    )}
                    <span className="hidden sm:inline">
                      {disabled ? t('chat.composer.button.loginRequired') : loading ? t('chat.composer.button.sending') : t('chat.composer.button.send')}
                    </span>
                  </Button>
                )}
              </div>
            </div>
            <div className="flex items-center justify-between px-4 pb-2">
              <p className="text-[11px] text-muted-foreground select-none">
                {disabled ? t('chat.composer.helper.auth') : streaming ? t('chat.composer.helper.streaming') : t('chat.composer.helper.enter')} (Shift+Enter ↵)
              </p>
              <div className="hidden sm:flex gap-1 text-[10px] text-muted-foreground/70">
                <span className="px-1.5 py-0.5 rounded bg-muted/60">Enter</span>
                <span className="self-center">= send</span>
                <span className="px-1.5 py-0.5 rounded bg-muted/60">Shift+Enter</span>
                <span className="self-center">= newline</span>
              </div>
            </div>
          </div>
          <div className="pointer-events-none absolute inset-0 rounded-2xl ring-1 ring-primary/0 group-hover:ring-primary/20 transition"></div>
        </div>
        <div className="h-4" />
      </div>
    </div>
  );
}

// Also export a named version to support `import { Composer } from ...`
export { Composer };
