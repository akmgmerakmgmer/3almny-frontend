import React from "react"
import type { ChatMessage } from "@/hooks/useChat"
import { TypingIndicator } from "@/components/chat/TypingIndicator"
import { DownloadPdfBar } from '@/components/pdf/DownloadPdfBar'
import { PracticeQuestionsPanel } from '@/components/practice-questions/PracticeQuestionsPanel'
import { Bookmark, BookmarkCheck, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"

type Props = {
    messages: ChatMessage[]
    loading: boolean
    bottomRef: React.RefObject<HTMLDivElement | null>
    chatId?: string
    onToggleBookmark?: (messageId: string) => void
    bookmarkSavingIds?: string[]
    emptyLabel?: string
}

export function Messages({ messages, loading, bottomRef, chatId, onToggleBookmark, bookmarkSavingIds, emptyLabel }: Props) {
    return (
        <div className="flex-1 overflow-auto">
            <div className="mx-auto w-full max-w-3xl px-4 py-6 space-y-4">
                {messages.length === 0 ? (
                    <div className="text-center text-base text-muted-foreground py-16">{emptyLabel || "Start typing below to begin..."}</div>
                ) : (
                    messages.map((m) => {
                        // Hide empty assistant placeholder until first chunk arrives
                        if (m.role === "assistant" && !m.content.trim()) return null
                        // Extract first **bold** segment (markdown style) for pdf title if present in assistant message
                        let pdfTitle: string | undefined;
                        if (m.role === 'assistant') {
                            const boldMatch = m.content.match(/\*\*(.{1,80}?)\*\*/);
                            if (boldMatch) {
                                pdfTitle = boldMatch[1].trim();
                            }
                        }
                        const isBookmarked = Boolean(m.bookmarked)
                        const isSaving = bookmarkSavingIds?.includes(m.id) && !isBookmarked
                        const resolvedChatId = m.chatId ?? chatId
                        const assistantContainsArabic = m.role === 'assistant' && /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF]/.test(m.content)
                        return (
                            <div key={m.id} className="flex flex-col gap-1">
                                <div
                                    className={cn(
                                        "rounded-lg px-3 py-2 chat-in",
                                        m.role === "user"
                                            ? "ml-auto bg-primary text-primary-foreground max-w-[80%]"
                                            : "mr-auto bg-muted max-w-[100%]",
                                    )}
                                >
                                    {onToggleBookmark && m.role === "assistant" && m.meta?.articleEligible && (
                                        <div className="flex justify-end pb-1">
                                            <button
                                                type="button"
                                                onClick={() => onToggleBookmark(m.id)}
                                                className={cn(
                                                    "inline-flex items-center gap-2 rounded-full border border-border/40 bg-gradient-to-r from-primary/15 via-primary/10 to-primary/15 px-3 py-1.5 text-xs font-medium text-primary shadow-sm transition hover:from-primary/25 hover:via-primary/20 hover:to-primary/25"
                                                )}
                                                disabled={isSaving}
                                                aria-label={isBookmarked ? "Remove bookmark" : "Bookmark message"}
                                                aria-pressed={isBookmarked}
                                            >
                                                {isSaving ? (
                                                    <>
                                                        <Loader2 className="h-4 w-4 animate-spin" />
                                                        <span>Saving...</span>
                                                    </>
                                                ) : isBookmarked ? (
                                                    <>
                                                        <BookmarkCheck className="h-4 w-4" />
                                                        <span>Saved</span>
                                                    </>
                                                ) : (
                                                    <>
                                                        <Bookmark className="h-4 w-4" />
                                                        <span>Save</span>
                                                    </>
                                                )}
                                            </button>
                                        </div>
                                    )}
                                    <p
                                        className={
                                            m.role === "assistant"
                                                ? "whitespace-pre-wrap text-[14px] md:text-[15px] leading-relaxed mb-2"
                                                : "whitespace-pre-wrap text-[15px] leading-relaxed mb-2"
                                        }
                                        style={assistantContainsArabic ? { fontFamily: 'var(--font-arabic-sans)' } : undefined}
                                    >
                                        {m.content}
                                    </p>
                                    {m.role === 'assistant' && m.meta?.articleEligible && resolvedChatId && (
                                        <div className="pt-3 mt-3 border-t border-border/40 -mx-3 px-3 space-y-4">
                                            <div className="flex justify-end">
                                                <DownloadPdfBar
                                                    chatId={resolvedChatId}
                                                    messageId={m.id}
                                                    pdfTitle={pdfTitle}
                                                    className="p-0 pb-0 [&>button]:px-2 [&>button]:py-1 [&>button]:text-[13px] [&>button]:rounded-md [&>button]:shadow [&>button_svg]:h-4 [&>button_svg]:w-4"
                                                />
                                            </div>
                                            <PracticeQuestionsPanel chatId={resolvedChatId} messageId={m.id} />
                                        </div>
                                    )}
                                </div>
                            </div>
                        )
                    })
                )}
                {loading && <TypingIndicator />}
                <div ref={bottomRef} />
            </div>
        </div>
    )
}
