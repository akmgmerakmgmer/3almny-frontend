import React from "react"

type Props = {
    align?: "left" | "right"
}

export function TypingIndicator({ align = "left" }: Props) {
    const bubbleClass =
        align === "right"
            ? "ml-auto rounded-lg bg-primary text-primary-foreground px-3 py-2 max-w-[80%] chat-in"
            : "mr-auto rounded-lg bg-muted px-3 py-2 max-w-[80%] chat-in"

    return (
        <div className="flex">
            <div className={bubbleClass} aria-live="polite" aria-label="Assistant is typing">
                <div className="typing-dots text-foreground/70">
                    <span></span>
                    <span></span>
                    <span></span>
                </div>
            </div>
        </div>
    )
}
