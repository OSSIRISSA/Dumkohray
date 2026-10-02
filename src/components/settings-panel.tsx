import { useEffect, useMemo, useState } from "react";
import { Link } from "@/lib/router";
import { applyTheme } from "@/lib/theme";
import { getBackups, deleteBackup, putNovel } from "@/lib/local-db";
import { useDumkohray } from "./dumkohray-provider";
import { Button, Input, Label } from "./ui";
import type { BackupRecord, ThemePalette, ThemeRecord } from "@/lib/types";
const labels: Record<keyof ThemePalette, string> = {
    background: "Background",
    panel: "Panel",
    panelSoft: "Raised panel",
    text: "Primary text",
    muted: "Muted text",
    accent: "Accent",
    accentText: "Accent contrast",
    border: "Lines",
    danger: "Danger",
    success: "Success",
    graphA: "Graph A",
    graphB: "Graph B",
    graphC: "Graph C",
};
const fmt = (n: number | null) =>
    n == null
        ? "Unknown"
        : n > 1024 ** 3
          ? `${(n / 1024 ** 3).toFixed(2)} GB`
          : `${(n / 1024 ** 2).toFixed(1)} MB`;
export function SettingsPanel() {
    const {
        ready,
        manifest,
        updateManifest,
        updateNovel,
        estimatedBytes,
        driveIsConfigured,
        driveIsConnected,
        driveBackups,
        driveQuota,
        connectGoogleDrive,
        disconnectGoogleDrive,
        refreshDrive,
        restoreDriveBackup,
        removeDriveBackup,
    } = useDumkohray();
    const [localBackups, setLocalBackups] = useState<BackupRecord[]>([]),
        [themeModal, setThemeModal] = useState(false),
        [template, setTemplate] = useState("blank"),
        [newName, setNewName] = useState("Untitled theme");
    useEffect(() => {
        void getBackups().then(setLocalBackups);
    }, []);
    if (!ready || !manifest)
        return <div className="loading-screen">Opening settings…</div>;
    const theme =
        manifest.themes.find((t) => t.id === manifest.settings.activeThemeId) ??
        manifest.themes[0];
    const setPalette = (palette: ThemePalette) => {
        updateManifest((m) => ({
            ...m,
            themes: m.themes.map((t) =>
                t.id === theme.id ? { ...t, palette } : t,
            ),
        }));
        applyTheme(palette);
    };
    const createTheme = () => {
        const base =
            template === "blank"
                ? (Object.fromEntries(
                      Object.keys(labels).map((k) => [k, "#000000"]),
                  ) as ThemePalette)
                : (manifest.themes.find((t) => t.id === template)?.palette ??
                  theme.palette);
        const t: ThemeRecord = {
            id: crypto.randomUUID(),
            name: newName.trim() || "Untitled theme",
            palette: { ...base },
            createdAt: new Date().toISOString(),
        };
        updateManifest((m) => ({
            ...m,
            themes: [...m.themes, t],
            settings: { ...m.settings, activeThemeId: t.id },
        }));
        applyTheme(t.palette);
        setThemeModal(false);
    };
    const quotaPct = driveQuota?.limit
        ? Math.min(100, (driveQuota.usage / driveQuota.limit) * 100)
        : 0;
    return (
        <main className="min-h-screen">
            <header className="topbar">
                <Link href="/" className="quiet-link">
                    ← Library
                </Link>
                <div className="brand">DUMKOHRAY</div>
                <div className="topbar-divider" />
                <div className="topbar-title">Settings</div>
            </header>
            <div className="settings-layout">
                <section className="settings-section">
                    <div className="section-heading">
                        <div>
                            <div className="eyebrow">01 / General</div>
                            <h1>Application settings</h1>
                            <p>
                                Global preferences live locally and are included
                                in cloud backup snapshots.
                            </p>
                        </div>
                    </div>
                    <div className="settings-grid">
                        <div>
                            <Label>Backup max count</Label>
                            <Input
                                type="number"
                                min={1}
                                value={manifest.settings.backupMaxCount}
                                onChange={(e) =>
                                    updateManifest((m) => ({
                                        ...m,
                                        settings: {
                                            ...m.settings,
                                            backupMaxCount: Math.max(
                                                1,
                                                Number(e.target.value) || 1,
                                            ),
                                        },
                                    }))
                                }
                            />
                        </div>
                        <div>
                            <Label>Editor font px</Label>
                            <Input
                                type="number"
                                value={manifest.settings.editorFontSize}
                                onChange={(e) =>
                                    updateManifest((m) => ({
                                        ...m,
                                        settings: {
                                            ...m.settings,
                                            editorFontSize: Number(
                                                e.target.value,
                                            ),
                                        },
                                    }))
                                }
                            />
                        </div>
                        <div>
                            <Label>Editor line height</Label>
                            <Input
                                type="number"
                                step=".1"
                                value={manifest.settings.editorLineHeight}
                                onChange={(e) =>
                                    updateManifest((m) => ({
                                        ...m,
                                        settings: {
                                            ...m.settings,
                                            editorLineHeight: Number(
                                                e.target.value,
                                            ),
                                        },
                                    }))
                                }
                            />
                        </div>
                    </div>
                    <div className="metric-row">
                        <span>Local Dumkohray payload</span>
                        <strong>{fmt(estimatedBytes)}</strong>
                    </div>
                </section>
                <section className="settings-section">
                    <div className="section-heading">
                        <div>
                            <div className="eyebrow">02 / Cloud backup</div>
                            <h2>Google Drive</h2>
                            <p>
                                Optional. Without Drive, Dumkohray still works
                                fully on this PC and autosaves to IndexedDB, but
                                there is no cloud backup or cross-device
                                restore.
                            </p>
                        </div>
                        {driveIsConnected ? (
                            <Button onClick={disconnectGoogleDrive}>
                                Disconnect
                            </Button>
                        ) : (
                            <Button
                                disabled={!driveIsConfigured}
                                onClick={() => void connectGoogleDrive()}
                                className="accent-button"
                            >
                                Connect Google Drive
                            </Button>
                        )}
                    </div>
                    {!driveIsConfigured ? (
                        <div className="notice">
                            This deployment has no{" "}
                            <code>VITE_GOOGLE_CLIENT_ID</code>. Local mode works
                            normally. Add the OAuth client ID at build time to
                            enable Drive.
                        </div>
                    ) : null}
                    {driveIsConnected ? (
                        <>
                            <div className="quota-panel">
                                <div>
                                    <span>Drive used</span>
                                    <strong>
                                        {fmt(driveQuota?.usage ?? 0)}
                                    </strong>
                                </div>
                                <div>
                                    <span>Drive free</span>
                                    <strong>
                                        {fmt(driveQuota?.free ?? null)}
                                    </strong>
                                </div>
                                <div>
                                    <span>Backups in Dumkohray folder</span>
                                    <strong>{driveBackups.length}</strong>
                                </div>
                                <button
                                    className="quiet-link"
                                    onClick={() => void refreshDrive()}
                                >
                                    Refresh
                                </button>
                            </div>
                            {driveQuota?.limit ? (
                                <div className="quota-track">
                                    <div style={{ width: `${quotaPct}%` }} />
                                </div>
                            ) : null}
                            <p className="fineprint">
                                All Dumkohray cloud saves are stored in one
                                “Dumkohray Backups” folder created by the app.
                            </p>
                            <div className="backup-list">
                                <div className="backup-list-head">
                                    <span>Cloud saves — newest first</span>
                                    <span>Version</span>
                                    <span>Size</span>
                                    <span />
                                </div>
                                {driveBackups.map((b) => (
                                    <div className="backup-row" key={b.fileId}>
                                        <div>
                                            <strong>{b.name}</strong>
                                            <small>
                                                {new Date(
                                                    b.createdAt,
                                                ).toLocaleString()}
                                                {b.comment
                                                    ? ` · ${b.comment}`
                                                    : ""}
                                            </small>
                                        </div>
                                        <code>{b.appVersion}</code>
                                        <span>{fmt(b.size)}</span>
                                        <div className="row-actions">
                                            <button
                                                onClick={() =>
                                                    void restoreDriveBackup(
                                                        b.fileId,
                                                    )
                                                }
                                            >
                                                Load
                                            </button>
                                            <button
                                                className="danger-link"
                                                onClick={() =>
                                                    void removeDriveBackup(
                                                        b.fileId,
                                                    )
                                                }
                                            >
                                                Delete
                                            </button>
                                        </div>
                                    </div>
                                ))}
                                {!driveBackups.length ? (
                                    <div className="empty-inline">
                                        No cloud saves yet. Press
                                        Ctrl/Cmd+Shift+S anywhere in Dumkohray.
                                    </div>
                                ) : null}
                            </div>
                        </>
                    ) : null}
                </section>
                <section className="settings-section">
                    <div className="section-heading">
                        <div>
                            <div className="eyebrow">03 / Appearance</div>
                            <h2>Themes</h2>
                            <p>
                                Color-driven, square-edged, low-distraction
                                interface.
                            </p>
                        </div>
                        <Button
                            onClick={() => setThemeModal(true)}
                            className="accent-button"
                        >
                            + Theme
                        </Button>
                    </div>
                    <div className="theme-strip">
                        {manifest.themes.map((t) => (
                            <button
                                key={t.id}
                                className={t.id === theme.id ? "selected" : ""}
                                onClick={() => {
                                    updateManifest((m) => ({
                                        ...m,
                                        settings: {
                                            ...m.settings,
                                            activeThemeId: t.id,
                                        },
                                    }));
                                    applyTheme(t.palette);
                                }}
                            >
                                <i style={{ background: t.palette.accent }} />
                                {t.name}
                            </button>
                        ))}
                    </div>
                    <div className="color-grid">
                        {(Object.keys(labels) as (keyof ThemePalette)[]).map(
                            (k) => (
                                <label className="color-control" key={k}>
                                    <input
                                        type="color"
                                        value={theme.palette[k]}
                                        onChange={(e) =>
                                            setPalette({
                                                ...theme.palette,
                                                [k]: e.target.value,
                                            })
                                        }
                                    />
                                    <span>
                                        {labels[k]}
                                        <small>{theme.palette[k]}</small>
                                    </span>
                                </label>
                            ),
                        )}
                    </div>
                </section>
                <section className="settings-section">
                    <div className="section-heading">
                        <div>
                            <div className="eyebrow">04 / Local history</div>
                            <h2>Local checkpoints</h2>
                            <p>
                                Ctrl/Cmd+S creates local recovery points. They
                                never contact Google.
                            </p>
                        </div>
                    </div>
                    <div className="backup-list">
                        {localBackups.slice(0, 60).map((b) => (
                            <div className="backup-row" key={b.id}>
                                <div>
                                    <strong>{b.novelTitle}</strong>
                                    <small>
                                        {new Date(b.createdAt).toLocaleString()}{" "}
                                        · revision {b.revision}
                                    </small>
                                </div>
                                <code>{b.appVersion}</code>
                                <span>{fmt(b.bytes)}</span>
                                <div className="row-actions">
                                    <button
                                        onClick={async () => {
                                            await putNovel(b.snapshot);
                                            updateNovel(
                                                b.novelId,
                                                () => b.snapshot,
                                            );
                                        }}
                                    >
                                        Restore
                                    </button>
                                    <button
                                        className="danger-link"
                                        onClick={async () => {
                                            await deleteBackup(b.id);
                                            setLocalBackups(await getBackups());
                                        }}
                                    >
                                        Delete
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>
            </div>
            {themeModal ? (
                <div
                    className="modal-backdrop"
                    onMouseDown={() => setThemeModal(false)}
                >
                    <div
                        className="modal-card theme-template-modal"
                        onMouseDown={(e) => e.stopPropagation()}
                    >
                        <div className="eyebrow">New theme</div>
                        <h2 className="modal-title">Choose a template</h2>
                        <div className="theme-templates">
                            <button
                                className={
                                    template === "blank" ? "selected" : ""
                                }
                                onClick={() => setTemplate("blank")}
                            >
                                <span className="theme-preview black" />
                                Blank / black
                            </button>
                            {manifest.themes.map((t) => (
                                <button
                                    key={t.id}
                                    className={
                                        template === t.id ? "selected" : ""
                                    }
                                    onClick={() => setTemplate(t.id)}
                                >
                                    <span
                                        className="theme-preview"
                                        style={{
                                            background: `linear-gradient(135deg,${t.palette.background} 0 52%,${t.palette.accent} 52%)`,
                                        }}
                                    />
                                    {t.name}
                                </button>
                            ))}
                        </div>
                        <Label>Theme name</Label>
                        <Input
                            value={newName}
                            onChange={(e) => setNewName(e.target.value)}
                        />
                        <div className="modal-actions">
                            <Button onClick={() => setThemeModal(false)}>
                                Cancel
                            </Button>
                            <Button
                                className="accent-button"
                                onClick={createTheme}
                            >
                                Create theme
                            </Button>
                        </div>
                    </div>
                </div>
            ) : null}
        </main>
    );
}
