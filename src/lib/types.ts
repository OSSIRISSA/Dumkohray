export type ThemePalette = {
    background: string;
    panel: string;
    panelSoft: string;
    text: string;
    muted: string;
    accent: string;
    accentText: string;
    border: string;
    danger: string;
    success: string;
    graphA: string;
    graphB: string;
    graphC: string;
};

export type ThemeRecord = {
    id: string;
    name: string;
    palette: ThemePalette;
    createdAt: string;
};

export type AppSettings = {
    activeThemeId: string;
    backupMaxCount: number;
    storageLimitMb: number;
    googleDriveEnabled: boolean;
    editorFontSize: number;
    editorLineHeight: number;
    compactMode: boolean;
};

export type LibraryItem = {
    id: string;
    type: "folder" | "novel";
    name: string;
    parentId: string | null;
    order: number;
    createdAt: string;
    updatedAt: string;
};

export type TopicNode = {
    id: string;
    title: string;
    text: string;
    collapsed?: boolean;
    children: TopicNode[];
};

export type GalleryImage = {
    id: string;
    name: string;
    mimeType: string;
    size: number;
    dataUrl: string;
    createdAt: string;
};

export type Relationship = {
    id: string;
    targetCharacterId: string;
    connectionType: string;
    comment: string;
    reciprocal: boolean;
    color: string;
};

export type CharacterRecord = {
    id: string;
    name: string;
    color: string;
    sharedEntityId?: string | null;
    fields: TopicNode[];
    gallery: GalleryImage[];
    relationships: Relationship[];
};

export type NoteRecord = {
    id: string;
    name: string;
    text: string;
    tags: string[];
    createdAt: string;
    updatedAt: string;
};

export type TimelineEvent = {
    id: string;
    title: string;
    text: string;
    dateLabel: string;
    x: number;
    y: number;
    color: string;
};

export type TimelineLink = {
    id: string;
    source: string;
    target: string;
    label?: string;
};

export type CurrencyRate = { id: string; toCurrencyId: string; rate: number };

export type CurrencyRecord = {
    id: string;
    name: string;
    symbol: string;
    notes: string;
    rates: CurrencyRate[];
};

export type NovelSettings = {
    subtitle: string;
    author: string;
    genre: string;
    status: "idea" | "draft" | "revision" | "complete";
    synopsis: string;
    targetWordCount: number;
    language: string;
    coverDataUrl?: string | null;
};

export type NovelRecord = {
    id: string;
    title: string;
    manuscript: string;
    settings: NovelSettings;
    design: TopicNode[];
    characters: CharacterRecord[];
    world: TopicNode[];
    currencies: CurrencyRecord[];
    customModules: TopicNode[];
    notes: NoteRecord[];
    timelineEvents: TimelineEvent[];
    timelineLinks: TimelineLink[];
    createdAt: string;
    updatedAt: string;
    localRevision: number;
    cloudRevision: number;
    lastCloudHash: string | null;
};

export type SharedEntityLink = {
    novelId: string;
    entityId: string;
    label: string;
};

export type SharedEntity = {
    id: string;
    type: "character" | "place" | "concept";
    name: string;
    color: string;
    links: SharedEntityLink[];
};

export type ManifestRecord = {
    library: LibraryItem[];
    sharedEntities: SharedEntity[];
    settings: AppSettings;
    themes: ThemeRecord[];
    updatedAt: string;
    localRevision: number;
    cloudRevision: number;
    lastCloudHash: string | null;
};

export type BackupRecord = {
    id: string;
    name: string;
    comment: string;
    appVersion: string;
    novelId: string;
    novelTitle: string;
    createdAt: string;
    reason: "checkpoint" | "cloud-sync";
    revision: number;
    bytes: number;
    snapshot: NovelRecord;
};

export type DriveBackupBundle = {
    format: "dumkohray-backup";
    formatVersion: 1;
    appVersion: string;
    id: string;
    name: string;
    comment: string;
    createdAt: string;
    manifest: ManifestRecord;
    novels: NovelRecord[];
};

export type DriveBackupMeta = {
    fileId: string;
    id: string;
    name: string;
    comment: string;
    appVersion: string;
    createdAt: string;
    size: number;
};

export type DriveQuota = {
    limit: number | null;
    usage: number;
    usageInDrive: number;
    free: number | null;
};

export type CloudNovelEnvelope = {
    novel: NovelRecord;
    hash: string;
    revision: number;
    updatedAt: string;
};

export type CloudManifestEnvelope = {
    manifest: ManifestRecord;
    hash: string;
    revision: number;
    updatedAt: string;
};
