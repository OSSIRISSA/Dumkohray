import type { DriveBackupBundle, DriveBackupMeta, DriveQuota } from "./types";

const SCOPE = "https://www.googleapis.com/auth/drive.file";
const FOLDER_NAME = "Dumkohray Backups";
const MIME = "application/vnd.dumkohray.backup+json";
let accessToken: string | null = null;

declare global {
    interface Window {
        google?: any;
    }
}

function clientId() {
    return import.meta.env.VITE_GOOGLE_CLIENT_ID as string | undefined;
}
async function loadGoogleIdentity() {
    if (window.google?.accounts?.oauth2) return;
    await new Promise<void>((resolve, reject) => {
        const s = document.createElement("script");
        s.src = "https://accounts.google.com/gsi/client";
        s.async = true;
        s.onload = () => resolve();
        s.onerror = () =>
            reject(new Error("Could not load Google Identity Services."));
        document.head.appendChild(s);
    });
}
export function driveConfigured() {
    return Boolean(clientId());
}
export function driveConnected() {
    return Boolean(accessToken);
}
export function disconnectDrive() {
    accessToken = null;
}
export async function connectDrive() {
    const id = clientId();
    if (!id)
        throw new Error("Google Drive is not configured for this deployment.");
    await loadGoogleIdentity();
    accessToken = await new Promise<string>((resolve, reject) => {
        const tokenClient = window.google.accounts.oauth2.initTokenClient({
            client_id: id,
            scope: SCOPE,
            callback: (response: any) =>
                response.error
                    ? reject(new Error(response.error))
                    : resolve(response.access_token),
        });
        tokenClient.requestAccessToken({ prompt: "consent" });
    });
}
async function request(path: string, init: RequestInit = {}) {
    if (!accessToken) throw new Error("Connect Google Drive first.");
    const headers = new Headers(init.headers);
    headers.set("Authorization", `Bearer ${accessToken}`);
    const r = await fetch(`https://www.googleapis.com${path}`, {
        ...init,
        headers,
    });
    if (r.status === 401) {
        accessToken = null;
        throw new Error(
            "Google session expired. Reconnect Drive and try again.",
        );
    }
    if (!r.ok)
        throw new Error((await r.text()) || `Google Drive error ${r.status}`);
    return r;
}
function escapeQ(v: string) {
    return v.replace(/'/g, "\\'");
}
async function ensureFolder() {
    const q = encodeURIComponent(
        `name = '${escapeQ(FOLDER_NAME)}' and mimeType = 'application/vnd.google-apps.folder' and trashed = false`,
    );
    const list = await (
        await request(
            `/drive/v3/files?q=${q}&fields=files(id,name)&pageSize=10`,
        )
    ).json();
    if (list.files?.[0]?.id) return list.files[0].id as string;
    const created = await (
        await request("/drive/v3/files?fields=id", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                name: FOLDER_NAME,
                mimeType: "application/vnd.google-apps.folder",
            }),
        })
    ).json();
    return created.id as string;
}
export async function listDriveBackups(): Promise<DriveBackupMeta[]> {
    const folder = await ensureFolder();
    const q = encodeURIComponent(`'${folder}' in parents and trashed = false`);
    const data = await (
        await request(
            `/drive/v3/files?q=${q}&orderBy=createdTime desc&pageSize=1000&fields=files(id,name,size,createdTime,appProperties)`,
        )
    ).json();
    return (data.files ?? []).map((f: any) => ({
        fileId: f.id,
        id: f.appProperties?.backupId ?? f.id,
        name: f.appProperties?.backupName ?? f.name,
        comment: f.appProperties?.comment ?? "",
        appVersion: f.appProperties?.appVersion ?? "unknown",
        createdAt: f.createdTime,
        size: Number(f.size ?? 0),
    }));
}
export async function uploadDriveBackup(bundle: DriveBackupBundle) {
    const folder = await ensureFolder();
    const boundary = `dumkohray_${crypto.randomUUID()}`;
    const metadata = {
        name: `${bundle.createdAt.replace(/[:.]/g, "-")}__${bundle.name.replace(/[^a-z0-9 _-]/gi, "_")}.dumkohray.json`,
        parents: [folder],
        mimeType: MIME,
        appProperties: {
            backupId: bundle.id,
            backupName: bundle.name,
            comment: bundle.comment.slice(0, 120),
            appVersion: bundle.appVersion,
        },
    };
    const body = `--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${JSON.stringify(metadata)}\r\n--${boundary}\r\nContent-Type: ${MIME}\r\n\r\n${JSON.stringify(bundle)}\r\n--${boundary}--`;
    const r = await request(
        "/upload/drive/v3/files?uploadType=multipart&fields=id,name,size,createdTime",
        {
            method: "POST",
            headers: {
                "Content-Type": `multipart/related; boundary=${boundary}`,
            },
            body,
        },
    );
    return r.json();
}
export async function downloadDriveBackup(
    fileId: string,
): Promise<DriveBackupBundle> {
    return (await (
        await request(`/drive/v3/files/${fileId}?alt=media`)
    ).json()) as DriveBackupBundle;
}
export async function deleteDriveBackup(fileId: string) {
    await request(`/drive/v3/files/${fileId}`, { method: "DELETE" });
}
export async function getDriveQuota(): Promise<DriveQuota> {
    try {
        const d = await (
            await request("/drive/v3/about?fields=storageQuota")
        ).json();
        const q = d.storageQuota ?? {};
        const limit = q.limit ? Number(q.limit) : null,
            usage = Number(q.usage ?? 0),
            usageInDrive = Number(q.usageInDrive ?? 0);
        return {
            limit,
            usage,
            usageInDrive,
            free: limit == null ? null : Math.max(0, limit - usage),
        };
    } catch {
        return { limit: null, usage: 0, usageInDrive: 0, free: null };
    }
}
