"use client";
import type {
    ButtonHTMLAttributes,
    InputHTMLAttributes,
    TextareaHTMLAttributes,
    ReactNode,
} from "react";
export function Button({
    className = "",
    ...props
}: ButtonHTMLAttributes<HTMLButtonElement>) {
    return (
        <button
            className={`border border-[var(--border)] bg-[var(--panel)] px-3 py-2 text-sm text-[var(--text)] transition hover:bg-[var(--panel-soft)] focus:outline-none focus:border-[var(--accent)] disabled:opacity-40 ${className}`}
            {...props}
        />
    );
}
export function Input({
    className = "",
    ...props
}: InputHTMLAttributes<HTMLInputElement>) {
    return (
        <input
            className={`w-full border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm outline-none focus:border-[var(--accent)] ${className}`}
            {...props}
        />
    );
}
export function Textarea({
    className = "",
    ...props
}: TextareaHTMLAttributes<HTMLTextAreaElement>) {
    return (
        <textarea
            className={`w-full resize-y border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm leading-6 outline-none focus:border-[var(--accent)] ${className}`}
            {...props}
        />
    );
}
export function Label({ children }: { children: ReactNode }) {
    return (
        <div className="mb-1 text-[11px] uppercase tracking-[0.14em] text-[var(--muted)]">
            {children}
        </div>
    );
}
