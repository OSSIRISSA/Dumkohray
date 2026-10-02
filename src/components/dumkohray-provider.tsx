import {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useRef,
    useState,
    type ReactNode,
} from "react";
import {
    addBackup,
    deleteNovel as deleteNovelDb,
    getBackups,
    getManifest,
    getNovels,
    putManifest,
    putNovel,
    putNovels,
} from "@/lib/local-db";
import { byteSize } from "@/lib/hash";
import { makeManifest, makeNovel } from "@/lib/defaults";
import { applyTheme } from "@/lib/theme";
import {
    connectDrive,
    deleteDriveBackup,
    disconnectDrive,
    downloadDriveBackup,
    driveConfigured,
    driveConnected,
    getDriveQuota,
    listDriveBackups,
    uploadDriveBackup,
} from "@/lib/google-drive";
import type {
    DriveBackupBundle,
    DriveBackupMeta,
    DriveQuota,
    LibraryItem,
    ManifestRecord,
    NovelRecord,
} from "@/lib/types";

const APP_VERSION = "0.3.0";
type SyncState = "idle" | "syncing" | "synced" | "offline" | "error";
type SaveDraft = { open: boolean; name: string; comment: string };
type ContextValue = {
    ready: boolean;
    manifest: ManifestRecord | null;
    novels: NovelRecord[];
    syncState: SyncState;
    syncMessage: string;
    estimatedBytes: number;
    driveIsConfigured: boolean;
    driveIsConnected: boolean;
    driveBackups: DriveBackupMeta[];
    driveQuota: DriveQuota | null;
    createFolder: (name: string, parentId: string | null) => void;
    createNovel: (name: string, parentId: string | null) => string;
    renameLibraryItem: (id: string, name: string) => void;
    deleteLibraryItem: (id: string) => Promise<void>;
    updateManifest: (mutator: (m: ManifestRecord) => ManifestRecord) => void;
    updateNovel: (id: string, mutator: (n: NovelRecord) => NovelRecord) => void;
    checkpoint: (novelIds?: string[]) => Promise<number>;
    openCloudSave: () => void;
    connectGoogleDrive: () => Promise<void>;
    disconnectGoogleDrive: () => void;
    refreshDrive: () => Promise<void>;
    restoreDriveBackup: (fileId: string) => Promise<void>;
    removeDriveBackup: (fileId: string) => Promise<void>;
};
const Ctx = createContext<ContextValue | null>(null);

export function DumkohrayProvider({ children }: { children: ReactNode }) {
    const [ready, setReady] = useState(false),
        [manifest, setManifest] = useState<ManifestRecord | null>(null),
        [novels, setNovels] = useState<NovelRecord[]>([]);
    const [syncState, setSyncState] = useState<SyncState>("idle"),
        [syncMessage, setSyncMessage] = useState("Local autosave active");
    const [connected, setConnected] = useState(false),
        [driveBackups, setDriveBackups] = useState<DriveBackupMeta[]>([]),
        [driveQuota, setDriveQuota] = useState<DriveQuota | null>(null);
    const [saveDraft, setSaveDraft] = useState<SaveDraft>({
        open: false,
        name: "",
        comment: "",
    });
    const timers = useRef(new Map<string, ReturnType<typeof setTimeout>>());
    useEffect(() => {
        (async () => {
            let m = await getManifest();
            if (!m) {
                m = makeManifest();
                await putManifest(m);
            } else if (m.settings.googleDriveEnabled === undefined) {
                m = {
                    ...m,
                    settings: {
                        ...m.settings,
                        googleDriveEnabled: false,
                        storageLimitMb: 0,
                    },
                };
                await putManifest(m);
            }
            const ns = await getNovels();
            setManifest(m);
            setNovels(ns);
            const t =
                m.themes.find((x) => x.id === m!.settings.activeThemeId) ??
                m.themes[0];
            if (t) applyTheme(t.palette);
            setReady(true);
        })();
    }, []);
    const persistManifestSoon = useCallback((m: ManifestRecord) => {
        window.setTimeout(() => void putManifest(m), 70);
    }, []);
    const updateManifest = useCallback(
        (fn: (m: ManifestRecord) => ManifestRecord) =>
            setManifest((cur) => {
                if (!cur) return cur;
                const n = {
                    ...fn(cur),
                    updatedAt: new Date().toISOString(),
                    localRevision: cur.localRevision + 1,
                };
                persistManifestSoon(n);
                return n;
            }),
        [persistManifestSoon],
    );
    const updateNovel = useCallback(
        (id: string, fn: (n: NovelRecord) => NovelRecord) =>
            setNovels((cur) =>
                cur.map((n) => {
                    if (n.id !== id) return n;
                    const next = {
                        ...fn(n),
                        updatedAt: new Date().toISOString(),
                        localRevision: n.localRevision + 1,
                    };
                    const old = timers.current.get(id);
                    if (old) clearTimeout(old);
                    timers.current.set(
                        id,
                        setTimeout(() => void putNovel(next), 150),
                    );
                    return next;
                }),
            ),
        [],
    );
    const createFolder = useCallback(
        (name: string, parentId: string | null) =>
            updateManifest((m) => ({
                ...m,
                library: [
                    ...m.library,
                    {
                        id: crypto.randomUUID(),
                        type: "folder",
                        name,
                        parentId,
                        order: m.library.length,
                        createdAt: new Date().toISOString(),
                        updatedAt: new Date().toISOString(),
                    },
                ],
            })),
        [updateManifest],
    );
    const createNovel = useCallback(
        (name: string, parentId: string | null) => {
            const n = makeNovel(name);
            setNovels((v) => [...v, n]);
            void putNovel(n);
            updateManifest((m) => ({
                ...m,
                library: [
                    ...m.library,
                    {
                        id: n.id,
                        type: "novel",
                        name,
                        parentId,
                        order: m.library.length,
                        createdAt: n.createdAt,
                        updatedAt: n.updatedAt,
                    },
                ],
            }));
            return n.id;
        },
        [updateManifest],
    );
    const renameLibraryItem = useCallback(
        (id: string, name: string) => {
            updateManifest((m) => ({
                ...m,
                library: m.library.map((x) =>
                    x.id === id
                        ? { ...x, name, updatedAt: new Date().toISOString() }
                        : x,
                ),
            }));
            updateNovel(id, (n) => ({ ...n, title: name }));
        },
        [updateManifest, updateNovel],
    );
    const deleteLibraryItem = useCallback(
        async (id: string) => {
            if (!manifest) return;
            const ids = new Set<string>([id]);
            let grew = true;
            while (grew) {
                grew = false;
                for (const x of manifest.library)
                    if (x.parentId && ids.has(x.parentId) && !ids.has(x.id)) {
                        ids.add(x.id);
                        grew = true;
                    }
            }
            const novelIds = manifest.library
                .filter((x) => ids.has(x.id) && x.type === "novel")
                .map((x) => x.id);
            setNovels((v) => v.filter((n) => !novelIds.includes(n.id)));
            for (const nid of novelIds) await deleteNovelDb(nid);
            updateManifest((m) => ({
                ...m,
                library: m.library.filter((x) => !ids.has(x.id)),
                sharedEntities: m.sharedEntities
                    .map((e) => ({
                        ...e,
                        links: e.links.filter(
                            (l) => !novelIds.includes(l.novelId),
                        ),
                    }))
                    .filter((e) => e.links.length),
            }));
        },
        [manifest, updateManifest],
    );
    const checkpoint = useCallback(
        async (ids?: string[]) => {
            if (!manifest) return 0;
            const selected = ids?.length
                ? novels.filter((n) => ids.includes(n.id))
                : novels;
            let made = 0;
            for (const n of selected) {
                await putNovel(n);
                const latest = (await getBackups(n.id))[0];
                if (latest?.revision === n.localRevision) continue;
                await addBackup(
                    {
                        id: crypto.randomUUID(),
                        name: `Local checkpoint — ${n.title}`,
                        comment: "",
                        appVersion: APP_VERSION,
                        novelId: n.id,
                        novelTitle: n.title,
                        createdAt: new Date().toISOString(),
                        reason: "checkpoint",
                        revision: n.localRevision,
                        bytes: byteSize(n),
                        snapshot: structuredClone(n),
                    },
                    manifest.settings.backupMaxCount,
                );
                made++;
            }
            setSyncMessage(
                made
                    ? `Local checkpoint: ${made} changed novel${made === 1 ? "" : "s"}.`
                    : "Everything is already saved locally.",
            );
            return made;
        },
        [manifest, novels],
    );
    const refreshDrive = useCallback(async () => {
        if (!driveConnected()) return;
        const [b, q] = await Promise.all([listDriveBackups(), getDriveQuota()]);
        setDriveBackups(b);
        setDriveQuota(q);
        setConnected(true);
    }, []);
    const connectGoogleDrive = useCallback(async () => {
        setSyncState("syncing");
        try {
            await connectDrive();
            setConnected(true);
            updateManifest((m) => ({
                ...m,
                settings: { ...m.settings, googleDriveEnabled: true },
            }));
            await refreshDrive();
            setSyncState("synced");
            setSyncMessage(
                "Google Drive connected. Cloud backup is optional and manual.",
            );
        } catch (e) {
            setSyncState("error");
            setSyncMessage(
                e instanceof Error
                    ? e.message
                    : "Could not connect Google Drive",
            );
        }
    }, [refreshDrive, updateManifest]);
    const disconnectGoogleDrive = useCallback(() => {
        disconnectDrive();
        setConnected(false);
        setDriveBackups([]);
        setDriveQuota(null);
        updateManifest((m) => ({
            ...m,
            settings: { ...m.settings, googleDriveEnabled: false },
        }));
        setSyncMessage(
            "Google Drive disconnected. Local autosave still works; cloud backups are disabled.",
        );
    }, [updateManifest]);
    const openCloudSave = useCallback(() => {
        if (!connected) {
            setSyncMessage(
                "Connect Google Drive to create a cloud backup. Local autosave is still active.",
            );
            return;
        }
        setSaveDraft({
            open: true,
            name: `Save ${new Date().toLocaleString()}`,
            comment: "",
        });
    }, [connected]);
    const performCloudSave = useCallback(async () => {
        if (!manifest || !saveDraft.name.trim()) return;
        setSyncState("syncing");
        try {
            await checkpoint();
            let backups = await listDriveBackups();
            let max = Math.max(1, manifest.settings.backupMaxCount);
            if (backups.length >= max) {
                const oldest = backups[backups.length - 1];
                const yes = window.confirm(
                    `This will create backup ${backups.length + 1}, above your limit of ${max}. Delete the oldest backup “${oldest.name}” from ${new Date(oldest.createdAt).toLocaleString()}?\n\nCancel keeps every backup and increases the limit instead.`,
                );
                if (yes) {
                    await deleteDriveBackup(oldest.fileId);
                    backups = backups.slice(0, -1);
                } else {
                    max = backups.length + 1;
                    updateManifest((m) => ({
                        ...m,
                        settings: { ...m.settings, backupMaxCount: max },
                    }));
                }
            }
            const bundle: DriveBackupBundle = {
                format: "dumkohray-backup",
                formatVersion: 1,
                appVersion: APP_VERSION,
                id: crypto.randomUUID(),
                name: saveDraft.name.trim(),
                comment: saveDraft.comment.trim(),
                createdAt: new Date().toISOString(),
                manifest: {
                    ...manifest,
                    settings: { ...manifest.settings, backupMaxCount: max },
                },
                novels: structuredClone(novels),
            };
            await uploadDriveBackup(bundle);
            setSaveDraft({ open: false, name: "", comment: "" });
            await refreshDrive();
            setSyncState("synced");
            setSyncMessage(`Cloud backup “${bundle.name}” created.`);
        } catch (e) {
            setSyncState(navigator.onLine ? "error" : "offline");
            setSyncMessage(
                e instanceof Error ? e.message : "Cloud backup failed",
            );
        }
    }, [checkpoint, manifest, novels, refreshDrive, saveDraft, updateManifest]);
    const restoreDriveBackup = useCallback(
        async (fileId: string) => {
            if (
                !window.confirm(
                    "Load this cloud save? Current local data will be checkpointed first, then replaced.",
                )
            )
                return;
            await checkpoint();
            const b = await downloadDriveBackup(fileId);
            const old = await getNovels();
            for (const n of old)
                if (!b.novels.some((x) => x.id === n.id))
                    await deleteNovelDb(n.id);
            await putNovels(b.novels);
            await putManifest(b.manifest);
            setNovels(b.novels);
            setManifest(b.manifest);
            const t =
                b.manifest.themes.find(
                    (x) => x.id === b.manifest.settings.activeThemeId,
                ) ?? b.manifest.themes[0];
            if (t) applyTheme(t.palette);
            setSyncMessage(`Loaded cloud save “${b.name}” (${b.appVersion}).`);
        },
        [checkpoint],
    );
    const removeDriveBackup = useCallback(
        async (fileId: string) => {
            if (!window.confirm("Delete this Google Drive backup permanently?"))
                return;
            await deleteDriveBackup(fileId);
            await refreshDrive();
        },
        [refreshDrive],
    );
    useEffect(() => {
        const onKey = (e: KeyboardEvent) => {
            if (!(e.ctrlKey || e.metaKey) || e.key.toLowerCase() !== "s")
                return;
            e.preventDefault();
            if (e.shiftKey) openCloudSave();
            else void checkpoint();
        };
        addEventListener("keydown", onKey);
        return () => removeEventListener("keydown", onKey);
    }, [checkpoint, openCloudSave]);
    const estimatedBytes = useMemo(
        () => byteSize({ manifest, novels }),
        [manifest, novels],
    );
    const value: ContextValue = {
        ready,
        manifest,
        novels,
        syncState,
        syncMessage,
        estimatedBytes,
        driveIsConfigured: driveConfigured(),
        driveIsConnected: connected,
        driveBackups,
        driveQuota,
        createFolder,
        createNovel,
        renameLibraryItem,
        deleteLibraryItem,
        updateManifest,
        updateNovel,
        checkpoint,
        openCloudSave,
        connectGoogleDrive,
        disconnectGoogleDrive,
        refreshDrive,
        restoreDriveBackup,
        removeDriveBackup,
    };
    return (
        <Ctx.Provider value={value}>
            {children}
            {saveDraft.open ? (
                <div
                    className="modal-backdrop"
                    onMouseDown={() =>
                        setSaveDraft((v) => ({ ...v, open: false }))
                    }
                >
                    <div
                        className="modal-card"
                        onMouseDown={(e) => e.stopPropagation()}
                    >
                        <div className="eyebrow">Google Drive backup</div>
                        <h2 className="modal-title">Name this save</h2>
                        <p className="subtle">
                            This snapshot contains your current library and
                            novels. It is uploaded only after you confirm.
                        </p>
                        <label className="field-label">Save name</label>
                        <input
                            autoFocus
                            className="control"
                            value={saveDraft.name}
                            onChange={(e) =>
                                setSaveDraft((v) => ({
                                    ...v,
                                    name: e.target.value,
                                }))
                            }
                        />
                        <label className="field-label">
                            Comment <span className="subtle">optional</span>
                        </label>
                        <textarea
                            className="control min-h-28"
                            value={saveDraft.comment}
                            onChange={(e) =>
                                setSaveDraft((v) => ({
                                    ...v,
                                    comment: e.target.value,
                                }))
                            }
                            placeholder="What changed in this version?"
                        />
                        <div className="modal-actions">
                            <button
                                className="ghost-button"
                                onClick={() =>
                                    setSaveDraft((v) => ({ ...v, open: false }))
                                }
                            >
                                Cancel
                            </button>
                            <button
                                className="primary-button"
                                disabled={
                                    !saveDraft.name.trim() ||
                                    syncState === "syncing"
                                }
                                onClick={() => void performCloudSave()}
                            >
                                Create cloud save
                            </button>
                        </div>
                    </div>
                </div>
            ) : null}
        </Ctx.Provider>
    );
}
export function useDumkohray() {
    const v = useContext(Ctx);
    if (!v) throw new Error("DumkohrayProvider missing");
    return v;
}
