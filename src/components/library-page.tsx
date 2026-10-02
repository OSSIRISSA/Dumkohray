import { useMemo, useState } from "react";
import { Link } from "@/lib/router";
import { useDumkohray } from "./dumkohray-provider";
import { AppShell } from "./app-shell";
import { Button, Input } from "./ui";
function Cover({ title, image }: { title: string; image?: string | null }) {
    if (image)
        return (
            <img
                src={image}
                alt=""
                className="aspect-[2/3] w-full object-cover"
            />
        );
    const size =
        title.length > 55
            ? 14
            : title.length > 32
              ? 16
              : title.length > 18
                ? 18
                : 22;
    return (
        <div className="grid aspect-[2/3] place-items-center bg-white p-4 text-center text-black">
            <span
                className="max-w-full break-words font-serif font-semibold leading-tight"
                style={{ fontSize: size }}
            >
                {title}
            </span>
        </div>
    );
}
export function LibraryPage() {
    const {
        ready,
        manifest,
        novels,
        createFolder,
        createNovel,
        deleteLibraryItem,
        renameLibraryItem,
    } = useDumkohray();
    const [folder, setFolder] = useState<string | null>(null),
        [name, setName] = useState("");
    const items = useMemo(
        () =>
            manifest?.library
                .filter((i) => i.parentId === folder)
                .sort((a, b) => a.order - b.order) ?? [],
        [manifest, folder],
    );
    const path = useMemo(() => {
        const out: { id: string | null; name: string }[] = [];
        let id = folder;
        while (id) {
            const it = manifest?.library.find((x) => x.id === id);
            if (!it) break;
            out.unshift({ id: it.id, name: it.name });
            id = it.parentId;
        }
        return [{ id: null, name: "Library" }, ...out];
    }, [manifest, folder]);
    if (!ready || !manifest)
        return <div className="loading-screen">Opening Dumkohray…</div>;
    const add = (type: "folder" | "novel") => {
        const clean =
            name.trim() ||
            (type === "folder" ? "New series" : "Untitled novel");
        type === "folder"
            ? createFolder(clean, folder)
            : createNovel(clean, folder);
        setName("");
    };
    const remove = async (id: string, label: string, type: string) => {
        if (
            confirm(
                `Delete ${type} “${label}”${type === "folder" ? " and everything inside it" : ""}? This cannot be undone unless you have a local/cloud backup.`,
            )
        )
            await deleteLibraryItem(id);
    };
    return (
        <AppShell title="Library">
            <section className="page-frame">
                <div className="library-hero">
                    <div>
                        <div className="eyebrow">
                            Local-first writing studio
                        </div>
                        <h1>Dumkohray</h1>
                        <p>
                            Your library lives on this device first. Google
                            Drive is optional.
                        </p>
                    </div>
                    <div className="library-create">
                        <Input
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Name a series or novel"
                        />
                        <Button onClick={() => add("folder")}>+ Series</Button>
                        <Button
                            onClick={() => add("novel")}
                            className="accent-button"
                        >
                            + Novel
                        </Button>
                    </div>
                </div>
                <nav className="breadcrumb">
                    {path.map((p, i) => (
                        <button
                            key={String(p.id)}
                            onClick={() => setFolder(p.id)}
                        >
                            {i ? "/ " : ""}
                            {p.name}
                        </button>
                    ))}
                </nav>
                {items.length === 0 ? (
                    <div className="empty-state">
                        <span>EMPTY DIRECTORY</span>
                        <strong>Build your story structure here.</strong>
                        <p>
                            Create series folders and novels. Everything
                            autosaves locally.
                        </p>
                    </div>
                ) : (
                    <div className="library-grid">
                        {items.map((item) => {
                            const novel = novels.find((n) => n.id === item.id);
                            return (
                                <article key={item.id} className="library-card">
                                    {item.type === "folder" ? (
                                        <button
                                            className="folder-face"
                                            onClick={() => setFolder(item.id)}
                                        >
                                            <span className="folder-glyph">
                                                ⌗
                                            </span>
                                            <span>{item.name}</span>
                                            <small>Series folder</small>
                                        </button>
                                    ) : (
                                        <Link
                                            href={`/novel/${item.id}`}
                                            className="novel-face"
                                        >
                                            <Cover
                                                title={
                                                    novel?.title ?? item.name
                                                }
                                                image={
                                                    novel?.settings.coverDataUrl
                                                }
                                            />
                                            <span>{item.name}</span>
                                            <small>
                                                {novel?.settings.status ??
                                                    "novel"}
                                            </small>
                                        </Link>
                                    )}
                                    <div className="card-actions">
                                        <button
                                            onClick={() => {
                                                const v = prompt(
                                                    "Rename",
                                                    item.name,
                                                );
                                                if (v?.trim())
                                                    renameLibraryItem(
                                                        item.id,
                                                        v.trim(),
                                                    );
                                            }}
                                        >
                                            Rename
                                        </button>
                                        <button
                                            className="danger-link"
                                            onClick={() =>
                                                void remove(
                                                    item.id,
                                                    item.name,
                                                    item.type,
                                                )
                                            }
                                        >
                                            Delete
                                        </button>
                                    </div>
                                </article>
                            );
                        })}
                    </div>
                )}
            </section>
        </AppShell>
    );
}
