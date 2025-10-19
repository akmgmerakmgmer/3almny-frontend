"use client"

import React from 'react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { GraduationCap, BookOpen, Globe, Star, School, ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useT } from '@/i18n/useT'

export interface EducationSystem {
  id: string
  nameEn: string
  nameAr: string
  description: string
  descriptionAr: string
  icon: React.ReactNode
  color: string
}

const educationSystems: EducationSystem[] = [
  {
    id: 'private_arabic',
    nameEn: 'Private Arabic Schools',
    nameAr: 'المدارس العربية الخاصة',
  description: 'National subjects, Arabic medium',
  descriptionAr: 'مناهج قومية باللغة العربية',
    icon: <BookOpen className="h-4 w-4" />,
    color: 'text-slate-600 dark:text-slate-400'
  },
  {
    id: 'experimental', 
    nameEn: 'Experimental Schools',
    nameAr: 'المدارس التجريبية',
  description: 'Math/Science in English/French',
  descriptionAr: 'العلوم والرياضيات باللغتين الإنجليزية/الفرنسية',
    icon: <School className="h-4 w-4" />,
    color: 'text-indigo-600 dark:text-indigo-400'
  },
  {
    id: 'azhar',
    nameEn: 'Azhar',
    nameAr: 'الأزهر',
  description: 'National + religious studies',
  descriptionAr: 'دراسات قومية بالإضافة إلى علوم دينية',
    icon: <Star className="h-4 w-4" />,
    color: 'text-amber-600 dark:text-amber-400'
  },
  {
    id: 'international',
    nameEn: 'International',
    nameAr: 'دولي',
  description: 'Global curricula, multilingual',
  descriptionAr: 'مناهج عالمية ومتعددة اللغات',
    icon: <Globe className="h-4 w-4" />,
    color: 'text-teal-600 dark:text-teal-400'
  },
  {
    id: 'national',
    nameEn: 'National',
    nameAr: 'قومي',
  description: 'Standard Egyptian curriculum',
  descriptionAr: 'المناهج المصرية الرسمية',
    icon: <GraduationCap className="h-4 w-4" />,
    color: 'text-rose-600 dark:text-rose-400'
  }
]

interface EducationSystemBarProps {
  selectedSystem?: string | null
  onSelect: (systemId: string | null) => void
  className?: string
}

export function EducationSystemBar({
  selectedSystem,
  onSelect,
  className
}: EducationSystemBarProps) {
  const { t, lang } = useT()
  const isArabic = lang === 'ar'
  const selectedSystemData = selectedSystem 
    ? educationSystems.find(sys => sys.id === selectedSystem)
    : null

  return (
    <div className={cn("mx-auto w-full max-w-3xl px-2", className)}>
      <div className="relative overflow-hidden rounded-2xl border border-border/30 bg-gradient-to-r from-card/80 via-card/90 to-card/80 backdrop-blur-sm shadow-md hover:shadow-lg transition-all duration-300">
        <div className="absolute inset-0 bg-gradient-to-r from-primary/3 via-transparent to-primary/3" />
        
        <div className="relative flex items-center gap-4 p-4">
          {/* Icon and Label */}
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-secondary/15 to-secondary/8 text-secondary-foreground border border-secondary/20">
              <GraduationCap className="h-5 w-5" />
            </div>
            <div>
              <div className="text-sm font-semibold text-foreground">{t('educationSystem.title')}</div>
              <div className="text-xs text-muted-foreground/80">{t('educationSystem.subtitle')}</div>
            </div>
          </div>
          
          {/* Selector */}
          <div className="flex-1 flex justify-center">
            <Select 
              value={selectedSystem || "none"} 
              onValueChange={(value) => onSelect(value === "none" ? null : value)}
            >
              <SelectTrigger className="w-full max-w-sm h-11 border-border/20 bg-card/60 backdrop-blur-sm hover:bg-card/80 hover:border-border/40 transition-all duration-200 rounded-xl shadow-sm">
                <SelectValue placeholder={t('educationSystem.selector.placeholder')} />
              </SelectTrigger>
              <SelectContent className="w-full min-w-[320px] border-border/20 bg-card/95 backdrop-blur-lg shadow-2xl rounded-xl border max-h-[400px]">
                <SelectItem value="none" className="rounded-lg hover:bg-muted/30">
                  <div className="flex items-center gap-3 py-1">
                    <div className="h-8 w-8 rounded-lg bg-muted/30 flex items-center justify-center border border-border/20">
                      <ChevronDown className="h-4 w-4 text-muted-foreground/60" />
                    </div>
                    <div>
                      <div className="font-medium text-muted-foreground">{t('educationSystem.selector.none')}</div>
                      <div className="text-xs text-muted-foreground/60">{t('educationSystem.selector.chooseSystem')}</div>
                    </div>
                  </div>
                </SelectItem>
                {educationSystems.map((system) => {
                  const displayName = isArabic ? system.nameAr : system.nameEn
                  const description = isArabic ? system.descriptionAr : system.description
                  return (
                    <SelectItem key={system.id} value={system.id} className="rounded-lg hover:bg-muted/20 focus:bg-muted/30">
                      <div className="flex items-center gap-3 py-1">
                        <span className={cn("flex items-center justify-center", system.color)}>
                          {system.icon}
                        </span>
                        <div className="flex-1">
                          <div
                            className="font-medium text-foreground"
                            style={isArabic ? { fontFamily: 'var(--font-arabic-sans)' } : undefined}
                          >
                            {displayName}
                          </div>
                          <div
                            className="text-xs text-muted-foreground/80"
                            style={isArabic ? { fontFamily: 'var(--font-arabic-sans)' } : undefined}
                          >
                            {description}
                          </div>
                        </div>
                      </div>
                    </SelectItem>
                  )
                })}
              </SelectContent>
            </Select>
          </div>

          {/* Selected System Info */}
          {selectedSystemData && (
            <div className="hidden lg:flex items-center gap-3 px-4 py-2 bg-card/40 border border-border/20 rounded-xl backdrop-blur-sm shadow-sm">
              <div className={cn("flex items-center justify-center", selectedSystemData.color)}>
                {selectedSystemData.icon}
              </div>
              <div>
                <div
                  className="text-sm font-medium text-foreground"
                  style={isArabic ? { fontFamily: 'var(--font-arabic-sans)' } : undefined}
                >
                  {isArabic ? selectedSystemData.nameAr : selectedSystemData.nameEn}
                </div>
                <div
                  className="text-xs text-muted-foreground/70"
                  style={isArabic ? { fontFamily: 'var(--font-arabic-sans)' } : undefined}
                >
                  {isArabic ? selectedSystemData.descriptionAr : selectedSystemData.description}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export { educationSystems }