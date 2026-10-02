import type { ManifestRecord, NovelRecord } from "./types";

export function novelHashPayload(novel: NovelRecord) {
    const { lastCloudHash: _hash, cloudRevision: _cloud, ...content } = novel;
    return content;
}

export function manifestHashPayload(manifest: ManifestRecord) {
    const {
        lastCloudHash: _hash,
        cloudRevision: _cloud,
        ...content
    } = manifest;
    return content;
}
