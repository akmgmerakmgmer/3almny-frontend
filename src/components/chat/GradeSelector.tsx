"use client"

import React from 'react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { BookOpen, Users, GraduationCap, Globe } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useT } from '@/i18n/useT'

export interface Grade {
  id: string
  nameEn: string
  nameAr: string
  level: string
  icon: React.ReactNode
  color: string
}

const levelLabels: Record<string, { en: string; ar: string }> = {
  Primary: { en: 'Primary', ar: 'المرحلة الابتدائية' },
  Preparatory: { en: 'Preparatory', ar: 'المرحلة الإعدادية' },
  Secondary: { en: 'Secondary', ar: 'المرحلة الثانوية' },
  'Lower Secondary': { en: 'Lower Secondary', ar: 'المرحلة المتوسطة' },
  IGCSE: { en: 'IGCSE', ar: 'الشهادة الدولية IGCSE' },
  'A-Level': { en: 'A-Level', ar: 'المستوى المتقدم A-Level' }
}

// Grade definitions based on Egyptian education system
const gradesBySystem: Record<string, Grade[]> = {
  private_arabic: [
    // Primary Education
    { id: 'grade_1', nameEn: 'Grade 1', nameAr: 'الصف الأول', level: 'Primary', icon: <BookOpen className="h-4 w-4" />, color: 'text-blue-500' },
    { id: 'grade_2', nameEn: 'Grade 2', nameAr: 'الصف الثاني', level: 'Primary', icon: <BookOpen className="h-4 w-4" />, color: 'text-blue-500' },
    { id: 'grade_3', nameEn: 'Grade 3', nameAr: 'الصف الثالث', level: 'Primary', icon: <BookOpen className="h-4 w-4" />, color: 'text-blue-500' },
    { id: 'grade_4', nameEn: 'Grade 4', nameAr: 'الصف الرابع', level: 'Primary', icon: <BookOpen className="h-4 w-4" />, color: 'text-blue-500' },
    { id: 'grade_5', nameEn: 'Grade 5', nameAr: 'الصف الخامس', level: 'Primary', icon: <BookOpen className="h-4 w-4" />, color: 'text-blue-500' },
    { id: 'grade_6', nameEn: 'Grade 6', nameAr: 'الصف السادس', level: 'Primary', icon: <BookOpen className="h-4 w-4" />, color: 'text-blue-500' },
    
    // Preparatory Education
    { id: 'grade_7', nameEn: 'Grade 7', nameAr: 'الصف الأول الإعدادي', level: 'Preparatory', icon: <Users className="h-4 w-4" />, color: 'text-green-500' },
    { id: 'grade_8', nameEn: 'Grade 8', nameAr: 'الصف الثاني الإعدادي', level: 'Preparatory', icon: <Users className="h-4 w-4" />, color: 'text-green-500' },
    { id: 'grade_9', nameEn: 'Grade 9', nameAr: 'الصف الثالث الإعدادي', level: 'Preparatory', icon: <Users className="h-4 w-4" />, color: 'text-green-500' },
    
    // Secondary Education
    { id: 'grade_10', nameEn: 'Grade 10', nameAr: 'الصف الأول الثانوي', level: 'Secondary', icon: <GraduationCap className="h-4 w-4" />, color: 'text-purple-500' },
    { id: 'grade_11', nameEn: 'Grade 11', nameAr: 'الصف الثاني الثانوي', level: 'Secondary', icon: <GraduationCap className="h-4 w-4" />, color: 'text-purple-500' },
    { id: 'grade_12', nameEn: 'Grade 12', nameAr: 'الصف الثالث الثانوي', level: 'Secondary', icon: <GraduationCap className="h-4 w-4" />, color: 'text-purple-500' }
  ],
  experimental: [
    // Same as Private Arabic system
    { id: 'grade_1', nameEn: 'Grade 1', nameAr: 'الصف الأول', level: 'Primary', icon: <BookOpen className="h-4 w-4" />, color: 'text-blue-500' },
    { id: 'grade_2', nameEn: 'Grade 2', nameAr: 'الصف الثاني', level: 'Primary', icon: <BookOpen className="h-4 w-4" />, color: 'text-blue-500' },
    { id: 'grade_3', nameEn: 'Grade 3', nameAr: 'الصف الثالث', level: 'Primary', icon: <BookOpen className="h-4 w-4" />, color: 'text-blue-500' },
    { id: 'grade_4', nameEn: 'Grade 4', nameAr: 'الصف الرابع', level: 'Primary', icon: <BookOpen className="h-4 w-4" />, color: 'text-blue-500' },
    { id: 'grade_5', nameEn: 'Grade 5', nameAr: 'الصف الخامس', level: 'Primary', icon: <BookOpen className="h-4 w-4" />, color: 'text-blue-500' },
    { id: 'grade_6', nameEn: 'Grade 6', nameAr: 'الصف السادس', level: 'Primary', icon: <BookOpen className="h-4 w-4" />, color: 'text-blue-500' },
    { id: 'grade_7', nameEn: 'Grade 7', nameAr: 'الصف الأول الإعدادي', level: 'Preparatory', icon: <Users className="h-4 w-4" />, color: 'text-green-500' },
    { id: 'grade_8', nameEn: 'Grade 8', nameAr: 'الصف الثاني الإعدادي', level: 'Preparatory', icon: <Users className="h-4 w-4" />, color: 'text-green-500' },
    { id: 'grade_9', nameEn: 'Grade 9', nameAr: 'الصف الثالث الإعدادي', level: 'Preparatory', icon: <Users className="h-4 w-4" />, color: 'text-green-500' },
    { id: 'grade_10', nameEn: 'Grade 10', nameAr: 'الصف الأول الثانوي', level: 'Secondary', icon: <GraduationCap className="h-4 w-4" />, color: 'text-purple-500' },
    { id: 'grade_11', nameEn: 'Grade 11', nameAr: 'الصف الثاني الثانوي', level: 'Secondary', icon: <GraduationCap className="h-4 w-4" />, color: 'text-purple-500' },
    { id: 'grade_12', nameEn: 'Grade 12', nameAr: 'الصف الثالث الثانوي', level: 'Secondary', icon: <GraduationCap className="h-4 w-4" />, color: 'text-purple-500' }
  ],
  azhar: [
    // Same structure as Private Arabic system
    { id: 'grade_1', nameEn: 'Grade 1', nameAr: 'الصف الأول', level: 'Primary', icon: <BookOpen className="h-4 w-4" />, color: 'text-blue-500' },
    { id: 'grade_2', nameEn: 'Grade 2', nameAr: 'الصف الثاني', level: 'Primary', icon: <BookOpen className="h-4 w-4" />, color: 'text-blue-500' },
    { id: 'grade_3', nameEn: 'Grade 3', nameAr: 'الصف الثالث', level: 'Primary', icon: <BookOpen className="h-4 w-4" />, color: 'text-blue-500' },
    { id: 'grade_4', nameEn: 'Grade 4', nameAr: 'الصف الرابع', level: 'Primary', icon: <BookOpen className="h-4 w-4" />, color: 'text-blue-500' },
    { id: 'grade_5', nameEn: 'Grade 5', nameAr: 'الصف الخامس', level: 'Primary', icon: <BookOpen className="h-4 w-4" />, color: 'text-blue-500' },
    { id: 'grade_6', nameEn: 'Grade 6', nameAr: 'الصف السادس', level: 'Primary', icon: <BookOpen className="h-4 w-4" />, color: 'text-blue-500' },
    { id: 'grade_7', nameEn: 'Grade 7', nameAr: 'الصف الأول الإعدادي', level: 'Preparatory', icon: <Users className="h-4 w-4" />, color: 'text-green-500' },
    { id: 'grade_8', nameEn: 'Grade 8', nameAr: 'الصف الثاني الإعدادي', level: 'Preparatory', icon: <Users className="h-4 w-4" />, color: 'text-green-500' },
    { id: 'grade_9', nameEn: 'Grade 9', nameAr: 'الصف الثالث الإعدادي', level: 'Preparatory', icon: <Users className="h-4 w-4" />, color: 'text-green-500' },
    { id: 'grade_10', nameEn: 'Grade 10', nameAr: 'الصف الأول الثانوي', level: 'Secondary', icon: <GraduationCap className="h-4 w-4" />, color: 'text-purple-500' },
    { id: 'grade_11', nameEn: 'Grade 11', nameAr: 'الصف الثاني الثانوي', level: 'Secondary', icon: <GraduationCap className="h-4 w-4" />, color: 'text-purple-500' },
    { id: 'grade_12', nameEn: 'Grade 12', nameAr: 'الصف الثالث الثانوي', level: 'Secondary', icon: <GraduationCap className="h-4 w-4" />, color: 'text-purple-500' }
  ],
  national: [
    // Same structure as Private Arabic system
    { id: 'grade_1', nameEn: 'Grade 1', nameAr: 'الصف الأول', level: 'Primary', icon: <BookOpen className="h-4 w-4" />, color: 'text-blue-500' },
    { id: 'grade_2', nameEn: 'Grade 2', nameAr: 'الصف الثاني', level: 'Primary', icon: <BookOpen className="h-4 w-4" />, color: 'text-blue-500' },
    { id: 'grade_3', nameEn: 'Grade 3', nameAr: 'الصف الثالث', level: 'Primary', icon: <BookOpen className="h-4 w-4" />, color: 'text-blue-500' },
    { id: 'grade_4', nameEn: 'Grade 4', nameAr: 'الصف الرابع', level: 'Primary', icon: <BookOpen className="h-4 w-4" />, color: 'text-blue-500' },
    { id: 'grade_5', nameEn: 'Grade 5', nameAr: 'الصف الخامس', level: 'Primary', icon: <BookOpen className="h-4 w-4" />, color: 'text-blue-500' },
    { id: 'grade_6', nameEn: 'Grade 6', nameAr: 'الصف السادس', level: 'Primary', icon: <BookOpen className="h-4 w-4" />, color: 'text-blue-500' },
    { id: 'grade_7', nameEn: 'Grade 7', nameAr: 'الصف الأول الإعدادي', level: 'Preparatory', icon: <Users className="h-4 w-4" />, color: 'text-green-500' },
    { id: 'grade_8', nameEn: 'Grade 8', nameAr: 'الصف الثاني الإعدادي', level: 'Preparatory', icon: <Users className="h-4 w-4" />, color: 'text-green-500' },
    { id: 'grade_9', nameEn: 'Grade 9', nameAr: 'الصف الثالث الإعدادي', level: 'Preparatory', icon: <Users className="h-4 w-4" />, color: 'text-green-500' },
    { id: 'grade_10', nameEn: 'Grade 10', nameAr: 'الصف الأول الثانوي', level: 'Secondary', icon: <GraduationCap className="h-4 w-4" />, color: 'text-purple-500' },
    { id: 'grade_11', nameEn: 'Grade 11', nameAr: 'الصف الثاني الثانوي', level: 'Secondary', icon: <GraduationCap className="h-4 w-4" />, color: 'text-purple-500' },
    { id: 'grade_12', nameEn: 'Grade 12', nameAr: 'الصف الثالث الثانوي', level: 'Secondary', icon: <GraduationCap className="h-4 w-4" />, color: 'text-purple-500' }
  ],
  international: [
    // International system uses Year notation
    { id: 'year_7', nameEn: 'Year 7', nameAr: 'السنة السابعة', level: 'Lower Secondary', icon: <Globe className="h-4 w-4" />, color: 'text-teal-500' },
    { id: 'year_8', nameEn: 'Year 8', nameAr: 'السنة الثامنة', level: 'Lower Secondary', icon: <Globe className="h-4 w-4" />, color: 'text-teal-500' },
    { id: 'year_9', nameEn: 'Year 9', nameAr: 'السنة التاسعة', level: 'Lower Secondary', icon: <Globe className="h-4 w-4" />, color: 'text-teal-500' },
    { id: 'year_10', nameEn: 'Year 10', nameAr: 'السنة العاشرة', level: 'IGCSE', icon: <Globe className="h-4 w-4" />, color: 'text-orange-500' },
    { id: 'year_11', nameEn: 'Year 11', nameAr: 'السنة الحادية عشر', level: 'IGCSE', icon: <Globe className="h-4 w-4" />, color: 'text-orange-500' },
    { id: 'year_12', nameEn: 'Year 12', nameAr: 'السنة الثانية عشر', level: 'A-Level', icon: <GraduationCap className="h-4 w-4" />, color: 'text-red-500' },
    { id: 'year_13', nameEn: 'Year 13', nameAr: 'السنة الثالثة عشر', level: 'A-Level', icon: <GraduationCap className="h-4 w-4" />, color: 'text-red-500' }
  ]
}

interface GradeSelectorProps {
  selectedGrade?: string | null
  educationSystem?: string | null
  onSelect: (gradeId: string | null) => void
  className?: string
}

export function GradeSelector({
  selectedGrade,
  educationSystem,
  onSelect,
  className
}: GradeSelectorProps) {
  const { t, lang } = useT()
  const isArabic = lang === 'ar'
  
  // Get available grades for the selected education system
  const availableGrades = educationSystem ? gradesBySystem[educationSystem] || [] : []
  const selectedGradeData = selectedGrade 
    ? availableGrades.find(grade => grade.id === selectedGrade)
    : null

  // Don't show grade selector if no education system is selected
  if (!educationSystem || availableGrades.length === 0) {
    return null
  }

  // Group grades by level for better organization
  const gradesByLevel = availableGrades.reduce((acc, grade) => {
    if (!acc[grade.level]) acc[grade.level] = []
    acc[grade.level].push(grade)
    return acc
  }, {} as Record<string, Grade[]>)

  return (
    <div className={cn("mx-auto w-full max-w-3xl px-2", className)}>
      <div className="relative overflow-hidden rounded-2xl border border-border/30 bg-gradient-to-r from-card/80 via-card/90 to-card/80 backdrop-blur-sm shadow-md hover:shadow-lg transition-all duration-300">
        <div className="absolute inset-0 bg-gradient-to-r from-primary/3 via-transparent to-primary/3" />
        
        <div className="relative flex items-center gap-4 p-4">
          {/* Icon and Label */}
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-secondary/15 to-secondary/8 text-secondary-foreground border border-secondary/20">
              <Users className="h-5 w-5" />
            </div>
            <div>
              <div className="text-sm font-semibold text-foreground">{t('grade.title')}</div>
              <div className="text-xs text-muted-foreground/80">{t('grade.subtitle')}</div>
            </div>
          </div>
          
          {/* Selector */}
          <div className="flex-1 flex justify-center">
            <Select 
              value={selectedGrade || "none"} 
              onValueChange={(value) => onSelect(value === "none" ? null : value)}
            >
              <SelectTrigger className="w-full max-w-sm h-11 border-border/20 bg-card/60 backdrop-blur-sm hover:bg-card/80 hover:border-border/40 transition-all duration-200 rounded-xl shadow-sm">
                <SelectValue placeholder={t('grade.selector.placeholder')} />
              </SelectTrigger>
              <SelectContent className="w-full min-w-[320px] border-border/20 bg-card/95 backdrop-blur-lg shadow-2xl rounded-xl border max-h-[400px]">
                <SelectItem value="none" className="rounded-lg hover:bg-muted/30">
                  <div className="flex items-center gap-3 py-1">
                    <div className="h-8 w-8 rounded-lg bg-muted/30 flex items-center justify-center border border-border/20">
                      <Users className="h-4 w-4 text-muted-foreground/60" />
                    </div>
                    <div>
                      <div className="font-medium text-muted-foreground">{t('grade.selector.none')}</div>
                      <div className="text-xs text-muted-foreground/60">{t('grade.selector.chooseGrade')}</div>
                    </div>
                  </div>
                </SelectItem>
                
                {Object.entries(gradesByLevel).map(([level, grades]) => {
                  const levelLabel = levelLabels[level]?.[isArabic ? 'ar' : 'en'] ?? level
                  return (
                    <React.Fragment key={level}>
                      <div className="px-2 py-2">
                        <div
                          className="text-xs font-semibold text-muted-foreground/80 uppercase tracking-wide"
                          style={isArabic ? { fontFamily: 'var(--font-arabic-sans)' } : undefined}
                        >
                          {levelLabel}
                        </div>
                      </div>
                      {grades.map((grade) => {
                        const displayName = isArabic ? grade.nameAr : grade.nameEn
                        return (
                          <SelectItem key={grade.id} value={grade.id} className="rounded-lg hover:bg-muted/20 focus:bg-muted/30 ml-2">
                            <div className="flex items-center gap-3 py-1">
                              <div className={cn("h-8 w-8 rounded-lg bg-card border border-border/30 flex items-center justify-center shadow-sm", grade.color)}>
                                {grade.icon}
                              </div>
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

          {/* Selected Grade Info */}
          {selectedGradeData && (
            <div className="hidden lg:flex items-center gap-3 px-4 py-2 bg-card/40 border border-border/20 rounded-xl backdrop-blur-sm shadow-sm">
              <div className={cn("flex items-center justify-center", selectedGradeData.color)}>
                {selectedGradeData.icon}
              </div>
              <div>
                <div
                  className="text-sm font-medium text-foreground"
                  style={isArabic ? { fontFamily: 'var(--font-arabic-sans)' } : undefined}
                >
                  {isArabic ? selectedGradeData.nameAr : selectedGradeData.nameEn}
                </div>
                <div
                  className="text-xs text-muted-foreground/70"
                  style={isArabic ? { fontFamily: 'var(--font-arabic-sans)' } : undefined}
                >
                  {levelLabels[selectedGradeData.level]?.[isArabic ? 'ar' : 'en'] ?? selectedGradeData.level}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export { gradesBySystem }