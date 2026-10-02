import type { BackupRecord, ManifestRecord, NovelRecord } from "./types";

const DB_NAME = "dumkohray-local";
const DB_VERSION = 2;
const NOVELS = "novels";
const META = "meta";
const BACKUPS = "backups";
const MANIFEST_KEY = "manifest";

function openDb(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);
        request.onupgradeneeded = () => {
            const db = request.result;
            if (!db.objectStoreNames.contains(NOVELS))
                db.createObjectStore(NOVELS, { keyPath: "id" });
            if (!db.objectStoreNames.contains(META)) db.createObjectStore(META);
            if (!db.objectStoreNames.contains(BACKUPS)) {
                const store = db.createObjectStore(BACKUPS, { keyPath: "id" });
                store.createIndex("novelId", "novelId", { unique: false });
                store.createIndex("createdAt", "createdAt", { unique: false });
            }
        };
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
}

function requestResult<T>(request: IDBRequest<T>): Promise<T> {
    return new Promise((resolve, reject) => {
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
}

export async function getManifest(): Promise<ManifestRecord | null> {
    const db = await openDb();
    const tx = db.transaction(META, "readonly");
    return (
        (await requestResult(tx.objectStore(META).get(MANIFEST_KEY))) ?? null
    );
}

export async function putManifest(manifest: ManifestRecord): Promise<void> {
    const db = await openDb();
    await new Promise<void>((resolve, reject) => {
        const tx = db.transaction(META, "readwrite");
        tx.objectStore(META).put(manifest, MANIFEST_KEY);
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
    });
}

export async function getNovels(): Promise<NovelRecord[]> {
    const db = await openDb();
    const tx = db.transaction(NOVELS, "readonly");
    return (await requestResult(
        tx.objectStore(NOVELS).getAll(),
    )) as NovelRecord[];
}

export async function getNovel(id: string): Promise<NovelRecord | null> {
    const db = await openDb();
    const tx = db.transaction(NOVELS, "readonly");
    return (
        ((await requestResult(tx.objectStore(NOVELS).get(id))) as
            | NovelRecord
            | undefined) ?? null
    );
}

export async function putNovel(novel: NovelRecord): Promise<void> {
    const db = await openDb();
    await new Promise<void>((resolve, reject) => {
        const tx = db.transaction(NOVELS, "readwrite");
        tx.objectStore(NOVELS).put(novel);
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
    });
}

export async function putNovels(novels: NovelRecord[]): Promise<void> {
    const db = await openDb();
    await new Promise<void>((resolve, reject) => {
        const tx = db.transaction(NOVELS, "readwrite");
        const store = tx.objectStore(NOVELS);
        novels.forEach((novel) => store.put(novel));
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
    });
}

export async function deleteNovel(id: string): Promise<void> {
    const db = await openDb();
    await new Promise<void>((resolve, reject) => {
        const tx = db.transaction(NOVELS, "readwrite");
        tx.objectStore(NOVELS).delete(id);
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
    });
}

export async function addBackup(
    backup: BackupRecord,
    maxCount: number,
): Promise<void> {
    const db = await openDb();
    await new Promise<void>((resolve, reject) => {
        const tx = db.transaction(BACKUPS, "readwrite");
        tx.objectStore(BACKUPS).put(backup);
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
    });
    await pruneBackups(backup.novelId, maxCount);
}

export async function getBackups(novelId?: string): Promise<BackupRecord[]> {
    const db = await openDb();
    const tx = db.transaction(BACKUPS, "readonly");
    const store = tx.objectStore(BACKUPS);
    const result = novelId
        ? await requestResult(store.index("novelId").getAll(novelId))
        : await requestResult(store.getAll());
    return (result as BackupRecord[]).sort((a, b) =>
        b.createdAt.localeCompare(a.createdAt),
    );
}

async function pruneBackups(novelId: string, maxCount: number) {
    const backups = await getBackups(novelId);
    const excess = backups.slice(Math.max(1, maxCount));
    if (!excess.length) return;
    const db = await openDb();
    await new Promise<void>((resolve, reject) => {
        const tx = db.transaction(BACKUPS, "readwrite");
        const store = tx.objectStore(BACKUPS);
        excess.forEach((backup) => store.delete(backup.id));
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
    });
}

export async function deleteBackup(id: string): Promise<void> {
    const db = await openDb();
    await new Promise<void>((resolve, reject) => {
        const tx = db.transaction(BACKUPS, "readwrite");
        tx.objectStore(BACKUPS).delete(id);
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
    });
}
