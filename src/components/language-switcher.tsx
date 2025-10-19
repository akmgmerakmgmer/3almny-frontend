"use client";
import { useParams, usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useMemo } from 'react';
import { cn } from '@/lib/utils';

export default function LanguageSwitcher({ className, variant = 'inline' }: { className?: string; variant?: 'inline' | 'floating' | 'sidebar' }) {
  const params = useParams<{lang: string}>();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();
  const current = params?.lang || 'en';
  const other = current === 'ar' ? 'en' : 'ar';

  const restPath = useMemo(() => pathname?.replace(/^\/(en|ar)/, '') || '', [pathname]);
  const queryString = useMemo(() => {
    if (!searchParams) return '';
    const entries = Array.from(searchParams.entries());
    if (!entries.length) return '';
    const usp = new URLSearchParams(entries);
    return '?' + usp.toString();
  }, [searchParams]);

  const targetHref = `/${other}${restPath}${queryString}`;

  const onToggle = useCallback(() => {
    document.cookie = `lang=${other}; path=/; max-age=${60 * 60 * 24 * 365}; SameSite=Lax`;
    router.replace(targetHref);
  }, [other, targetHref, router]);

  const baseBtn = 'group relative inline-flex items-center justify-center h-8 px-3 rounded-md text-sm font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2';
  const styleByVariant: Record<string,string> = {
    inline: 'border border-border/70 bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60 shadow-sm hover:bg-muted',
    floating: 'shadow-lg bg-background/90 backdrop-blur-md border border-border/60 hover:bg-muted/70 rounded-full px-4',
  sidebar: 'border border-border/50 bg-muted/40 hover:bg-muted/70 px-3 w-28 justify-center'
  };

  return (
    <button
      type="button"
      onClick={onToggle}
      aria-label={current === 'en' ? 'Switch to Arabic' : 'التبديل إلى الإنجليزية'}
      className={cn(baseBtn, styleByVariant[variant], 'data-[lang=ar]:font-semibold cursor-pointer', className)}
      data-lang={current}
    >
      <span className="flex items-center gap-1">
        <span className={cn('transition-opacity', current === 'en' ? 'opacity-60' : 'opacity-100')}>عربي</span>
        <span className="h-3 w-px bg-border/50" />
        <span className={cn('transition-opacity', current === 'ar' ? 'opacity-60' : 'opacity-100')}>EN</span>
      </span>
      {variant !== 'sidebar' && (
  <span className="absolute -bottom-6 left-1/2 -translate-x-1/2 pointer-events-none select-none rounded bg-popover px-2 py-1 text-[11px] font-medium text-popover-foreground opacity-0 shadow ring-1 ring-border transition-all group-hover:opacity-100 group-hover:translate-y-0 translate-y-1">
          {current === 'en' ? 'العربية' : 'English'}
        </span>
      )}
    </button>
  );
}
