"use client"

import React from 'react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { BookOpen, GraduationCap, Globe, FlaskConical, Atom, Languages, Landmark } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useT } from '@/i18n/useT'

export interface Subject {
  id: string
  nameEn: string
  nameAr: string
  group: string
  icon: React.ReactNode
  color: string
}

const groupLabels: Record<string, { en: string; ar: string }> = {
  Core: { en: 'Core', ar: 'المواد الأساسية' },
  Languages: { en: 'Languages', ar: 'اللغات' },
  STEM: { en: 'STEM', ar: 'العلوم والتكنولوجيا' },
  Humanities: { en: 'Humanities', ar: 'الدراسات الإنسانية' },
  'Islamic Studies': { en: 'Islamic Studies', ar: 'الدراسات الإسلامية' },
  'A-Level': { en: 'A-Level', ar: 'مستوى A المتقدم' }
}

export type EduSystem = 'private_arabic' | 'experimental' | 'azhar' | 'national' | 'international'

function parseGrade(gradeId: string | null | undefined): { phase: 'primary' | 'prep' | 'secondary' | 'intl_lower' | 'intl_igcse' | 'intl_alevel' | null; n?: number } {
  if (!gradeId) return { phase: null }
  if (gradeId.startsWith('grade_')) {
    const n = Number(gradeId.split('_')[1])
    if (n >= 1 && n <= 6) return { phase: 'primary', n }
    if (n >= 7 && n <= 9) return { phase: 'prep', n }
    return { phase: 'secondary', n }
  }
  if (gradeId.startsWith('year_')) {
    const n = Number(gradeId.split('_')[1])
    if (n >= 7 && n <= 9) return { phase: 'intl_lower', n }
    if (n >= 10 && n <= 11) return { phase: 'intl_igcse', n }
    return { phase: 'intl_alevel', n }
  }
  return { phase: null }
}

function baseCorePrimary(): Subject[] {
  return [
    { id: 'arabic', nameEn: 'Arabic', nameAr: 'اللغة العربية', group: 'Core', icon: <BookOpen className="h-4 w-4" />, color: 'text-rose-600' },
    { id: 'english', nameEn: 'English', nameAr: 'اللغة الإنجليزية', group: 'Core', icon: <BookOpen className="h-4 w-4" />, color: 'text-sky-600' },
    { id: 'math', nameEn: 'Math', nameAr: 'الرياضيات', group: 'Core', icon: <GraduationCap className="h-4 w-4" />, color: 'text-indigo-600' },
    { id: 'science', nameEn: 'Science', nameAr: 'العلوم', group: 'Core', icon: <FlaskConical className="h-4 w-4" />, color: 'text-emerald-600' },
    { id: 'religion', nameEn: 'Religion', nameAr: 'التربية الدينية', group: 'Core', icon: <Landmark className="h-4 w-4" />, color: 'text-amber-600' },
  ]
}

function addPrimarySocialStudies(phase: ReturnType<typeof parseGrade>): Subject[] {
  const extra: Subject[] = []
  if (phase.n && phase.n >= 4) {
    extra.push({ id: 'social', nameEn: 'Social Studies', nameAr: 'الدراسات الاجتماعية', group: 'Core', icon: <Globe className="h-4 w-4" />, color: 'text-teal-600' })
  }
  return extra
}

function prepSubjects(): Subject[] {
  return [
    { id: 'arabic', nameEn: 'Arabic', nameAr: 'اللغة العربية', group: 'Languages', icon: <BookOpen className="h-4 w-4" />, color: 'text-rose-600' },
    { id: 'english', nameEn: 'English', nameAr: 'اللغة الإنجليزية', group: 'Languages', icon: <BookOpen className="h-4 w-4" />, color: 'text-sky-600' },
    { id: 'second_lang', nameEn: 'Second Language (French)', nameAr: 'اللغة الثانية (الفرنسية)', group: 'Languages', icon: <Languages className="h-4 w-4" />, color: 'text-fuchsia-600' },
    { id: 'math', nameEn: 'Math (Algebra/Geometry)', nameAr: 'الرياضيات (جبر/هندسة)', group: 'STEM', icon: <GraduationCap className="h-4 w-4" />, color: 'text-indigo-600' },
    { id: 'science', nameEn: 'Science', nameAr: 'العلوم', group: 'STEM', icon: <FlaskConical className="h-4 w-4" />, color: 'text-emerald-600' },
    { id: 'social', nameEn: 'Social Studies', nameAr: 'الدراسات الاجتماعية', group: 'Humanities', icon: <Globe className="h-4 w-4" />, color: 'text-teal-600' },
    { id: 'religion', nameEn: 'Religion', nameAr: 'التربية الدينية', group: 'Core', icon: <Landmark className="h-4 w-4" />, color: 'text-amber-600' },
  ]
}

function secondarySubjects(): Subject[] {
  return [
    { id: 'arabic', nameEn: 'Arabic', nameAr: 'اللغة العربية', group: 'Languages', icon: <BookOpen className="h-4 w-4" />, color: 'text-rose-600' },
    { id: 'english', nameEn: 'English', nameAr: 'اللغة الإنجليزية', group: 'Languages', icon: <BookOpen className="h-4 w-4" />, color: 'text-sky-600' },
    { id: 'math', nameEn: 'Math', nameAr: 'الرياضيات', group: 'STEM', icon: <GraduationCap className="h-4 w-4" />, color: 'text-indigo-600' },
    { id: 'physics', nameEn: 'Physics', nameAr: 'الفيزياء', group: 'STEM', icon: <Atom className="h-4 w-4" />, color: 'text-purple-600' },
    { id: 'chemistry', nameEn: 'Chemistry', nameAr: 'الكيمياء', group: 'STEM', icon: <FlaskConical className="h-4 w-4" />, color: 'text-emerald-600' },
    { id: 'biology', nameEn: 'Biology', nameAr: 'الأحياء', group: 'STEM', icon: <FlaskConical className="h-4 w-4" />, color: 'text-green-600' },
    { id: 'history', nameEn: 'History', nameAr: 'التاريخ', group: 'Humanities', icon: <Globe className="h-4 w-4" />, color: 'text-orange-600' },
    { id: 'geography', nameEn: 'Geography', nameAr: 'الجغرافيا', group: 'Humanities', icon: <Globe className="h-4 w-4" />, color: 'text-teal-600' },
    { id: 'philosophy', nameEn: 'Philosophy', nameAr: 'الفلسفة', group: 'Humanities', icon: <BookOpen className="h-4 w-4" />, color: 'text-stone-600' },
    { id: 'religion', nameEn: 'Religion', nameAr: 'التربية الدينية', group: 'Core', icon: <Landmark className="h-4 w-4" />, color: 'text-amber-600' },
  ]
}

function azharExtras(): Subject[] {
  return [
    { id: 'quran', nameEn: 'Quran', nameAr: 'القرآن الكريم', group: 'Islamic Studies', icon: <Landmark className="h-4 w-4" />, color: 'text-emerald-700' },
    { id: 'fiqh', nameEn: 'Fiqh', nameAr: 'الفقه', group: 'Islamic Studies', icon: <Landmark className="h-4 w-4" />, color: 'text-emerald-700' },
    { id: 'hadith', nameEn: 'Hadith', nameAr: 'الحديث', group: 'Islamic Studies', icon: <Landmark className="h-4 w-4" />, color: 'text-emerald-700' },
  ]
}

function intlLower(): Subject[] {
  return [
    { id: 'english', nameEn: 'English', nameAr: 'الإنجليزية', group: 'Core', icon: <BookOpen className="h-4 w-4" />, color: 'text-sky-600' },
    { id: 'maths', nameEn: 'Maths', nameAr: 'الرياضيات', group: 'Core', icon: <GraduationCap className="h-4 w-4" />, color: 'text-indigo-600' },
    { id: 'science', nameEn: 'Science', nameAr: 'العلوم', group: 'Core', icon: <FlaskConical className="h-4 w-4" />, color: 'text-emerald-600' },
    { id: 'ict', nameEn: 'ICT', nameAr: 'تكنولوجيا المعلومات', group: 'Core', icon: <Globe className="h-4 w-4" />, color: 'text-teal-600' },
    { id: 'history', nameEn: 'History', nameAr: 'التاريخ', group: 'Humanities', icon: <Globe className="h-4 w-4" />, color: 'text-orange-600' },
    { id: 'geography', nameEn: 'Geography', nameAr: 'الجغرافيا', group: 'Humanities', icon: <Globe className="h-4 w-4" />, color: 'text-teal-600' },
    { id: 'arabic', nameEn: 'Arabic', nameAr: 'العربية (إن وجدت)', group: 'Languages', icon: <BookOpen className="h-4 w-4" />, color: 'text-rose-600' },
  ]
}

function intlIgcse(): Subject[] {
  return [
    { id: 'english', nameEn: 'English (First/Second Language)', nameAr: 'الإنجليزية (لغة أولى/ثانية)', group: 'Languages', icon: <BookOpen className="h-4 w-4" />, color: 'text-sky-600' },
    { id: 'maths', nameEn: 'Mathematics', nameAr: 'الرياضيات', group: 'STEM', icon: <GraduationCap className="h-4 w-4" />, color: 'text-indigo-600' },
    { id: 'physics', nameEn: 'Physics', nameAr: 'الفيزياء', group: 'STEM', icon: <Atom className="h-4 w-4" />, color: 'text-purple-600' },
    { id: 'chemistry', nameEn: 'Chemistry', nameAr: 'الكيمياء', group: 'STEM', icon: <FlaskConical className="h-4 w-4" />, color: 'text-emerald-600' },
    { id: 'biology', nameEn: 'Biology', nameAr: 'الأحياء', group: 'STEM', icon: <FlaskConical className="h-4 w-4" />, color: 'text-green-600' },
    { id: 'ict', nameEn: 'ICT', nameAr: 'تكنولوجيا المعلومات', group: 'STEM', icon: <Globe className="h-4 w-4" />, color: 'text-teal-600' },
    { id: 'business', nameEn: 'Business/Economics', nameAr: 'الأعمال/الاقتصاد', group: 'Humanities', icon: <Globe className="h-4 w-4" />, color: 'text-orange-600' },
  ]
}

function intlALevel(): Subject[] {
  return [
    { id: 'math_a', nameEn: 'Mathematics', nameAr: 'الرياضيات', group: 'A-Level', icon: <GraduationCap className="h-4 w-4" />, color: 'text-indigo-600' },
    { id: 'physics_a', nameEn: 'Physics', nameAr: 'الفيزياء', group: 'A-Level', icon: <Atom className="h-4 w-4" />, color: 'text-purple-600' },
    { id: 'chemistry_a', nameEn: 'Chemistry', nameAr: 'الكيمياء', group: 'A-Level', icon: <FlaskConical className="h-4 w-4" />, color: 'text-emerald-600' },
    { id: 'biology_a', nameEn: 'Biology', nameAr: 'الأحياء', group: 'A-Level', icon: <FlaskConical className="h-4 w-4" />, color: 'text-green-600' },
    { id: 'business_a', nameEn: 'Business/Economics', nameAr: 'الأعمال/الاقتصاد', group: 'A-Level', icon: <Globe className="h-4 w-4" />, color: 'text-orange-600' },
  ]
}

function getSubjects(educationSystem: EduSystem | null | undefined, gradeId: string | null | undefined): Subject[] {
  if (!educationSystem || !gradeId) return []
  const g = parseGrade(gradeId)
  switch (educationSystem) {
    case 'private_arabic':
    case 'national': {
      if (g.phase === 'primary') return [...baseCorePrimary(), ...addPrimarySocialStudies(g)]
      if (g.phase === 'prep') return prepSubjects()
      return secondarySubjects()
    }
    case 'experimental': {
      // Same subjects, but math/science are taught in English; mark them accordingly
      const mark = (s: Subject): Subject => (
        ['math', 'science', 'physics', 'chemistry', 'biology'].includes(s.id)
          ? { ...s, nameEn: `${s.nameEn} (EN)` }
          : s
      )
      if (g.phase === 'primary') return [...baseCorePrimary(), ...addPrimarySocialStudies(g)].map(mark)
      if (g.phase === 'prep') return prepSubjects().map(mark)
      return secondarySubjects().map(mark)
    }
    case 'azhar': {
      if (g.phase === 'primary') return [...baseCorePrimary(), ...addPrimarySocialStudies(g), ...azharExtras()]
      if (g.phase === 'prep') return [...prepSubjects(), ...azharExtras()]
      return [...secondarySubjects(), ...azharExtras()]
    }
    case 'international': {
      if (g.phase === 'intl_lower') return intlLower()
      if (g.phase === 'intl_igcse') return intlIgcse()
      return intlALevel()
    }
  }
}

interface SubjectSelectorProps {
  educationSystem?: string | null
  gradeId?: string | null
  selectedSubject?: string | null
  onSelect: (subjectId: string | null) => void
  className?: string
}

export function SubjectSelector({ educationSystem, gradeId, selectedSubject, onSelect, className }: SubjectSelectorProps) {
  const { t, lang } = useT()
  const isArabic = lang === 'ar'
  const subjects = getSubjects((educationSystem as EduSystem) ?? null, gradeId)

  if (!educationSystem || !gradeId || subjects.length === 0) return null

  const byGroup = subjects.reduce((acc, s) => {
    if (!acc[s.group]) acc[s.group] = []
    acc[s.group].push(s)
    return acc
  }, {} as Record<string, Subject[]>)

  const selected = selectedSubject ? subjects.find(s => s.id === selectedSubject) : null

  return (
    <div className={cn('mx-auto w-full max-w-3xl px-2', className)}>
      <div className="relative overflow-hidden rounded-2xl border border-border/30 bg-gradient-to-r from-card/80 via-card/90 to-card/80 backdrop-blur-sm shadow-md hover:shadow-lg transition-all duration-300">
        <div className="absolute inset-0 bg-gradient-to-r from-primary/3 via-transparent to-primary/3" />

        <div className="relative flex items-center gap-4 p-4">
          {/* Icon and Label */}
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-secondary/15 to-secondary/8 text-secondary-foreground border border-secondary/20">
              <BookOpen className="h-5 w-5" />
            </div>
            <div>
              <div className="text-sm font-semibold text-foreground">{t('subject.title')}</div>
              <div className="text-xs text-muted-foreground/80">{t('subject.subtitle')}</div>
            </div>
          </div>

          {/* Selector */}
          <div className="flex-1 flex justify-center">
            <Select
              value={selectedSubject || 'none'}
              onValueChange={(v) => onSelect(v === 'none' ? null : v)}
            >
              <SelectTrigger className="w-full max-w-sm h-11 border-border/20 bg-card/60 backdrop-blur-sm hover:bg-card/80 hover:border-border/40 transition-all duration-200 rounded-xl shadow-sm">
                <SelectValue placeholder={t('subject.selector.placeholder')} />
              </SelectTrigger>
              <SelectContent className="w-full min-w-[320px] border-border/20 bg-card/95 backdrop-blur-lg shadow-2xl rounded-xl border max-h-[400px]">
                <SelectItem value="none" className="rounded-lg hover:bg-muted/30">
                  <div className="flex items-center gap-3 py-1">
                    <div className="h-8 w-8 rounded-lg bg-muted/30 flex items-center justify-center border border-border/20">
                      <BookOpen className="h-4 w-4 text-muted-foreground/60" />
                    </div>
                    <div>
                      <div className="font-medium text-muted-foreground">{t('subject.selector.none')}</div>
                      <div className="text-xs text-muted-foreground/60">{t('subject.selector.chooseSubject')}</div>
                    </div>
                  </div>
                </SelectItem>

                {Object.entries(byGroup).map(([group, list]) => {
                  const groupLabel = groupLabels[group]?.[isArabic ? 'ar' : 'en'] ?? group
                  return (
                    <React.Fragment key={group}>
                      <div className="px-2 py-2">
                        <div
                          className="text-xs font-semibold text-muted-foreground/80 uppercase tracking-wide"
                          style={isArabic ? { fontFamily: 'var(--font-arabic-sans)' } : undefined}
                        >
                          {groupLabel}
                        </div>
                      </div>
                      {list.map((s) => {
                        const displayName = isArabic ? s.nameAr : s.nameEn
                        return (
                          <SelectItem key={s.id} value={s.id} className="rounded-lg hover:bg-muted/20 focus:bg-muted/30 ml-2">
                            <div className="flex items-center gap-3 py-1">
                              <span className={cn('flex items-center justify-center', s.color)}>
                                {s.icon}
                              </span>
                              <div
                                className="flex-1 font-medium text-foreground"
                                style={isArabic ? { fontFamily: 'var(--font-arabic-sans)' } : undefined}
                              >
                                {displayName}
                              </div>
                            </div>
                          </SelectItem>
                        )
                      })}
                    </React.Fragment>
                  )
                })}
              </SelectContent>
            </Select>
          </div>

          {/* Selected Subject Info */}
          {selected && (
            <div className="hidden lg:flex items-center gap-3 px-4 py-2 bg-card/40 border border-border/20 rounded-xl backdrop-blur-sm shadow-sm">
              <div className={cn('flex items-center justify-center', selected.color)}>
                {selected.icon}
              </div>
              <div>
                <div
                  className="text-sm font-medium text-foreground"
                  style={isArabic ? { fontFamily: 'var(--font-arabic-sans)' } : undefined}
                >
                  {isArabic ? selected.nameAr : selected.nameEn}
                </div>
                <div
                  className="text-xs text-muted-foreground/70"
                  style={isArabic ? { fontFamily: 'var(--font-arabic-sans)' } : undefined}
                >
                  {groupLabels[selected.group]?.[isArabic ? 'ar' : 'en'] ?? selected.group}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export { getSubjects }
