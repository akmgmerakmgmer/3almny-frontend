"use client";
import React from 'react';
import { cn } from '@/lib/utils';
import { useT } from '@/i18n/useT';

interface DownloadPdfBarProps {
  chatId: string;
  messageId?: string;
  className?: string;
  pdfTitle?: string; // optional precomputed title to use for filename
}

export function DownloadPdfBar({ chatId, messageId, className, pdfTitle }: DownloadPdfBarProps) {
  const [downloading, setDownloading] = React.useState(false);
  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => { const t = requestAnimationFrame(() => setMounted(true)); return () => cancelAnimationFrame(t); }, []);
  const { t } = useT();

  const handleDownload = async () => {
    if (downloading) return;
    setDownloading(true);
    try {
      const qp = messageId ? `?messageId=${encodeURIComponent(messageId)}` : '';
      const res = await fetch(`/api/chats/${encodeURIComponent(chatId)}/pdf${qp}`, { credentials: 'include' });
      if (!res.ok) throw new Error('Failed to generate PDF');
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const baseName = (pdfTitle || '').trim() || undefined;
      const safe = baseName
        ? baseName
            .replace(/\*+/g,'')
            .replace(/[^\w\s-]/g,'')
            .replace(/\s+/g,'-')
            .replace(/-+/g,'-')
            .slice(0,80)
        : 'chat-' + chatId + (messageId ? ('-' + messageId.slice(0, 6)) : '');
      a.download = (safe || 'export') + '.pdf';
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => window.URL.revokeObjectURL(url), 2000);
    } catch (e) {
      console.error(e);
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className={cn(
      'px-4 pb-4 -mt-1 flex justify-center transition-all duration-500',
      mounted ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2',
      className
    )}>
      <button
        onClick={handleDownload}
        aria-label={downloading ? t('chat.pdf.preparing') : t('chat.pdf.download')}
        disabled={downloading}
        className={cn(
          'cursor-pointer group relative flex items-center rounded-lg bg-red-600 hover:bg-red-500 active:bg-red-700 dark:bg-red-500 dark:hover:bg-red-400 px-6 py-3 text-2xl font-semibold text-white shadow-sm',
          'transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500/60',
          downloading && 'opacity-70 cursor-not-allowed'
        )}
      >
        <span className={cn('inline-flex h-6 w-6 items-center justify-center transition-transform', downloading && 'animate-spin')}>
          {!downloading ? (
            <svg viewBox="0 0 24 24" className="h-6 w-6 fill-white" stroke="none">
              <path d="M12 3a1 1 0 0 1 1 1v8.586l2.293-2.293a1 1 0 1 1 1.414 1.414l-4.004 4.004a1 1 0 0 1-1.414 0L7.285 11.707a1 1 0 1 1 1.414-1.414L11 12.586V4a1 1 0 0 1 1-1Z" />
              <path d="M5 15a1 1 0 0 1 1 1v.75c0 .69.56 1.25 1.25 1.25h9.5c.69 0 1.25-.56 1.25-1.25V16a1 1 0 1 1 2 0v.75A3.75 3.75 0 0 1 17.75 20.5h-11.5A3.75 3.75 0 0 1 2.5 16.75V16a1 1 0 0 1 1-1Z" />
            </svg>
          ) : (
            <svg viewBox="0 0 24 24" className="h-6 w-6 text-white" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" className="opacity-30" />
              <path d="M12 6v6l3 3" />
            </svg>
          )}
        </span>
        <span>{downloading ? t('chat.pdf.preparingShort') : t('chat.pdf.downloadFull')}</span>
      </button>
    </div>
  );
}
