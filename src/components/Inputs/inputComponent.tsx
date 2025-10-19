"use client"
import { Label } from '@radix-ui/react-label'
import React, { Fragment } from 'react'
import { Input } from '../ui/input'

interface InputComponentProps extends React.InputHTMLAttributes<HTMLInputElement> {
    label: string;
    error?: string | null;
    hideLabel?: boolean; // for visually hidden label if needed
}

export default function InputComponent({
    label,
    error,
    hideLabel = false,
    id,
    className,
    ...props
}: InputComponentProps) {
    const inputId = id || label.replace(/\s+/g, '-').toLowerCase();
    const errorId = error ? `${inputId}-error` : undefined;

    return (
        <div className="space-y-1.5">
            <Label
                htmlFor={inputId}
                className={hideLabel ? 'sr-only' : undefined}
            >
                {label}
            </Label>
            <Input
                id={inputId}
                aria-invalid={!!error || undefined}
                aria-describedby={errorId}
                className={className}
                {...props}
            />
            {error && (
                <p
                    id={errorId}
                        className="text-xs text-destructive mt-1 flex items-start gap-1"
                >
                    {error}
                </p>
            )}
        </div>
    );
}
