export async function stableHash(value: unknown): Promise<string> {
    const encoded = new TextEncoder().encode(JSON.stringify(value));
    const digest = await crypto.subtle.digest("SHA-256", encoded);
    return Array.from(new Uint8Array(digest))
        .map((byte) => byte.toString(16).padStart(2, "0"))
        .join("");
}

export function byteSize(value: unknown): number {
    return new Blob([JSON.stringify(value)]).size;
}
