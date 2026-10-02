import type { ReactNode } from "react";
import { Link } from "@/lib/router";
import { useDumkohray } from "./dumkohray-provider";

export function AppShell({
    children,
    title,
    backHref,
}: {
    children: ReactNode;
    title: string;
    backHref?: string;
}) {
    const {
        syncState,
        syncMessage,
        openCloudSave,
        checkpoint,
        driveIsConnected,
    } = useDumkohray();
    return (
        <main className="min-h-screen">
            <header className="topbar">
                {backHref ? (
                    <Link href={backHref} className="quiet-link">
                        ←
                    </Link>
                ) : null}
                <Link href="/" className="brand">
                    DUMKOHRAY
                </Link>
                <div className="topbar-divider" />
                <div className="topbar-title">{title}</div>
                <div className="topbar-status">{syncMessage}</div>
                <button
                    onClick={() => void checkpoint()}
                    className="topbar-action"
                >
                    Local save <kbd>Ctrl S</kbd>
                </button>
                <button
                    onClick={openCloudSave}
                    className={`topbar-action ${syncState === "syncing" ? "active" : ""}`}
                >
                    {driveIsConnected ? "Cloud save" : "Drive off"}{" "}
                    <kbd>Ctrl ⇧ S</kbd>
                </button>
                <Link href="/settings" className="topbar-action">
                    Settings
                </Link>
            </header>
            {children}
        </main>
    );
}
