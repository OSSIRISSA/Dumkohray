import { DEFAULT_PALETTE } from "./defaults";
import type { ThemePalette } from "./types";

export function applyTheme(theme: ThemePalette) {
    const root = document.documentElement;
    Object.entries(theme).forEach(([key, value]) =>
        root.style.setProperty(`--${camelToKebab(key)}`, value),
    );
}

function camelToKebab(value: string) {
    return value.replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`);
}

export function applyFallbackTheme() {
    applyTheme(DEFAULT_PALETTE);
}
